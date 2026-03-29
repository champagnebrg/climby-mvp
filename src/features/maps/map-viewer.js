import { getFloorMapVersion, getSectorMarkerPayload } from './map-model.js';
import { isNormalizedMarker } from './map-validation.js';
import { openSector3D } from './map-routing.js';
import { getRenderedImageContentRect, toRectLog } from './map-render-geometry.js';

const OVERLAY_SELECTOR = '[data-floor-map-overlay="1"]';
const OVERLAY_CLEANUP_KEY = '__climbyUserMapOverlayCleanup';

function alignOverlayToImage({ overlayEl, containerEl, imageEl, debugLabel = 'user', extra = {} } = {}) {
  if (!overlayEl || !containerEl || !imageEl) return null;
  const geometry = getRenderedImageContentRect({ containerEl, imageEl });
  if (!geometry) return null;
  const { imageRect, renderedRect, overlayLeft: left, overlayTop: top, width, height } = geometry;
  overlayEl.style.left = `${left}px`;
  overlayEl.style.top = `${top}px`;
  overlayEl.style.width = `${width}px`;
  overlayEl.style.height = `${height}px`;
  const overlayRect = overlayEl.getBoundingClientRect();
  console.info(`[map-marker][${debugLabel}] overlay sync`, {
    imageRect: toRectLog(imageRect),
    renderedRect: toRectLog(renderedRect),
    overlayRect: toRectLog(overlayRect),
    ...extra,
  });
  return { imageRect, renderedRect, overlayRect, left, top, width, height };
}

function setupOverlaySync({ overlayEl, containerEl, imageEl, debugLabel = 'user', getExtra = () => ({}) } = {}) {
  if (!overlayEl || !containerEl || !imageEl) return;
  if (typeof containerEl[OVERLAY_CLEANUP_KEY] === 'function') {
    containerEl[OVERLAY_CLEANUP_KEY]();
  }
  const sync = () => alignOverlayToImage({ overlayEl, containerEl, imageEl, debugLabel, extra: getExtra() });
  const rafId = window.requestAnimationFrame(sync);
  const handleLoad = () => sync();
  imageEl.addEventListener('load', handleLoad);
  window.addEventListener('resize', sync);
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => sync())
    : null;
  resizeObserver?.observe(containerEl);
  resizeObserver?.observe(imageEl);
  sync();
  containerEl[OVERLAY_CLEANUP_KEY] = () => {
    window.cancelAnimationFrame(rafId);
    imageEl.removeEventListener('load', handleLoad);
    window.removeEventListener('resize', sync);
    resizeObserver?.disconnect();
    if (containerEl[OVERLAY_CLEANUP_KEY]) containerEl[OVERLAY_CLEANUP_KEY] = null;
  };
}

function clearOverlay(floorMapLinkEl) {
  if (!floorMapLinkEl) return;
  if (typeof floorMapLinkEl[OVERLAY_CLEANUP_KEY] === 'function') {
    floorMapLinkEl[OVERLAY_CLEANUP_KEY]();
  }
  floorMapLinkEl.querySelectorAll(OVERLAY_SELECTOR).forEach((node) => node.remove());
}

export function renderUserGymFloorMapMarkers({
  gymId,
  gymData = {},
  sectors = [],
  floorMapEl,
  floorMapLinkEl,
  open3DFn,
  markerLabelBuilder,
} = {}) {
  if (!floorMapEl || !floorMapLinkEl) return;

  clearOverlay(floorMapLinkEl);

  const floorMapUrl = String(gymData?.floorMapUrl || '').trim();
  if (!floorMapUrl) return;

  const floorMapVersion = getFloorMapVersion(gymData);
  const validMarkers = sectors
    .map((sector) => {
      const { marker, markerVersion } = getSectorMarkerPayload(sector);
      console.info('[map-marker][user] marker data from DB', {
        sectorId: sector?.sectorId,
        marker,
        markerVersion,
        floorMapVersion,
      });
      if (!isNormalizedMarker(marker)) return null;
      if (!Number.isFinite(markerVersion) || markerVersion !== floorMapVersion) return null;
      return {
        sectorId: sector?.sectorId,
        sectorName: sector?.sectorName || sector?.name || sector?.sectorId || '',
        x: Number(marker.x),
        y: Number(marker.y),
      };
    })
    .filter((row) => !!row?.sectorId);

  if (!validMarkers.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'gym-floor-map-overlay';
  overlay.dataset.floorMapOverlay = '1';
  setupOverlaySync({
    overlayEl: overlay,
    containerEl: floorMapLinkEl,
    imageEl: floorMapEl,
    debugLabel: 'user',
    getExtra: () => ({ gymId, floorMapVersion, markerCount: validMarkers.length })
  });

  validMarkers.forEach((marker) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gym-floor-map-marker';
    button.style.left = `${marker.x * 100}%`;
    button.style.top = `${marker.y * 100}%`;
    console.info('[map-marker][user] render marker', {
      sectorId: marker.sectorId,
      normalized: { x: marker.x, y: marker.y },
      rendered: {
        leftPercent: `${marker.x * 100}%`,
        topPercent: `${marker.y * 100}%`,
      }
    });
    const markerLabel = typeof markerLabelBuilder === 'function'
      ? markerLabelBuilder(marker)
      : marker.sectorName || marker.sectorId;
    const safeLabel = String(markerLabel || marker.sectorId || '').trim() || marker.sectorId;
    button.title = safeLabel;
    button.setAttribute('aria-label', safeLabel);
    button.dataset.sectorId = marker.sectorId;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSector3D(open3DFn, gymId, marker.sectorId, { entryMode: 'map', initialVisibility: 'none' });
    });
    overlay.appendChild(button);
  });

  floorMapLinkEl.appendChild(overlay);
  window.requestAnimationFrame(() => {
    const overlayRect = overlay.getBoundingClientRect();
    overlay.querySelectorAll('.gym-floor-map-marker').forEach((markerEl) => {
      const left = Number.parseFloat(markerEl.style.left || '0');
      const top = Number.parseFloat(markerEl.style.top || '0');
      console.info('[map-marker][user] rendered marker final position', {
        sectorId: markerEl.dataset.sectorId,
        rendered: {
          leftPercent: markerEl.style.left,
          topPercent: markerEl.style.top,
          leftPx: Number(((left / 100) * overlayRect.width).toFixed(2)),
          topPx: Number(((top / 100) * overlayRect.height).toFixed(2)),
        },
        overlayRect: toRectLog(overlayRect),
      });
    });
  });
}
