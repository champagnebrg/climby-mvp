import { getFloorMapVersion, getSectorHotspotPayload, getSectorMarkerPayload } from './map-model.js';
import { isNormalizedMarker, isNormalizedRect } from './map-validation.js';
import { openSector3D } from './map-routing.js';
import { getRenderedImageContentRect, toRectLog } from './map-render-geometry.js';

const OVERLAY_SELECTOR = '[data-floor-map-overlay="1"]';
const OVERLAY_CLEANUP_KEY = '__climbyUserMapOverlayCleanup';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function normalizeRect(rect = {}) {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);
  const right = clamp01(Number(rect.x) + Number(rect.w));
  const bottom = clamp01(Number(rect.y) + Number(rect.h));
  const left = Math.min(x, right);
  const top = Math.min(y, bottom);
  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

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
  const validHotspots = sectors
    .map((sector) => {
      const hotspot = getSectorHotspotPayload(sector);
      const { marker, markerVersion } = getSectorMarkerPayload(sector);
      console.info('[map-marker][user] hotspot data from DB', {
        sectorId: sector?.sectorId,
        hotspot,
        marker,
        markerVersion,
        floorMapVersion,
      });
      const base = {
        sectorId: sector?.sectorId,
        sectorName: sector?.sectorName || sector?.name || sector?.sectorId || '',
      };
      if (!base.sectorId) return null;

      if (hotspot?.type === 'rect') {
        if (!isNormalizedRect(hotspot.rect)) return null;
        if (!Number.isFinite(hotspot.version) || hotspot.version !== floorMapVersion) return null;
        const rect = normalizeRect(hotspot.rect);
        if (!rect.w || !rect.h) return null;
        return {
          ...base,
          type: 'rect',
          rect,
        };
      }

      if (!isNormalizedMarker(marker)) return null;
      if (!Number.isFinite(markerVersion) || markerVersion !== floorMapVersion) return null;
      return {
        ...base,
        type: 'marker',
        marker: {
          x: Number(marker.x),
          y: Number(marker.y),
        }
      };
    })
    .filter((row) => !!row?.sectorId);

  if (!validHotspots.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'gym-floor-map-overlay';
  overlay.dataset.floorMapOverlay = '1';
  setupOverlaySync({
    overlayEl: overlay,
    containerEl: floorMapLinkEl,
    imageEl: floorMapEl,
    debugLabel: 'user',
    getExtra: () => ({ gymId, floorMapVersion, hotspotCount: validHotspots.length })
  });

  validHotspots.forEach((hotspot) => {
    const button = document.createElement('button');
    button.type = 'button';
    const markerLabel = typeof markerLabelBuilder === 'function'
      ? markerLabelBuilder(hotspot)
      : hotspot.sectorName || hotspot.sectorId;
    const safeLabel = String(markerLabel || hotspot.sectorId || '').trim() || hotspot.sectorId;
    button.title = safeLabel;
    button.setAttribute('aria-label', safeLabel);
    button.dataset.sectorId = hotspot.sectorId;
    button.dataset.hotspotType = hotspot.type;

    if (hotspot.type === 'rect') {
      button.className = 'gym-floor-map-hotspot gym-floor-map-hotspot-rect';
      button.style.left = `${hotspot.rect.x * 100}%`;
      button.style.top = `${hotspot.rect.y * 100}%`;
      button.style.width = `${hotspot.rect.w * 100}%`;
      button.style.height = `${hotspot.rect.h * 100}%`;
      console.info('[map-marker][user] render rect hotspot', {
        sectorId: hotspot.sectorId,
        normalized: hotspot.rect,
      });
    } else {
      const marker = hotspot.marker || {};
      button.className = 'gym-floor-map-marker';
      button.style.left = `${Number(marker.x) * 100}%`;
      button.style.top = `${Number(marker.y) * 100}%`;
      console.info('[map-marker][user] render marker', {
        sectorId: hotspot.sectorId,
        normalized: { x: Number(marker.x), y: Number(marker.y) },
        rendered: {
          leftPercent: `${Number(marker.x) * 100}%`,
          topPercent: `${Number(marker.y) * 100}%`,
        }
      });
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSector3D(open3DFn, gymId, hotspot.sectorId, { entryMode: 'map', initialVisibility: 'none' });
    });
    overlay.appendChild(button);
  });

  floorMapLinkEl.appendChild(overlay);
  window.requestAnimationFrame(() => {
    const overlayRect = overlay.getBoundingClientRect();
    overlay.querySelectorAll('.gym-floor-map-marker, .gym-floor-map-hotspot-rect').forEach((hotspotEl) => {
      const left = Number.parseFloat(hotspotEl.style.left || '0');
      const top = Number.parseFloat(hotspotEl.style.top || '0');
      console.info('[map-marker][user] rendered hotspot final position', {
        sectorId: hotspotEl.dataset.sectorId,
        hotspotType: hotspotEl.dataset.hotspotType || 'marker',
        rendered: {
          leftPercent: hotspotEl.style.left,
          topPercent: hotspotEl.style.top,
          widthPercent: hotspotEl.style.width || null,
          heightPercent: hotspotEl.style.height || null,
          leftPx: Number(((left / 100) * overlayRect.width).toFixed(2)),
          topPx: Number(((top / 100) * overlayRect.height).toFixed(2)),
        },
        overlayRect: toRectLog(overlayRect),
      });
    });
  });
}
