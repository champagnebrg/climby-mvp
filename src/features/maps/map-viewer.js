import { getFloorMapVersion, getSectorMarkerPayload } from './map-model.js';
import { isNormalizedMarker } from './map-validation.js';
import { openSector3D } from './map-routing.js';

const OVERLAY_SELECTOR = '[data-floor-map-overlay="1"]';

function alignOverlayToImage({ overlayEl, containerEl, imageEl } = {}) {
  if (!overlayEl || !containerEl || !imageEl) return;
  const containerRect = containerEl.getBoundingClientRect();
  const imageRect = imageEl.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height) return;
  overlayEl.style.left = `${imageRect.left - containerRect.left}px`;
  overlayEl.style.top = `${imageRect.top - containerRect.top}px`;
  overlayEl.style.width = `${imageRect.width}px`;
  overlayEl.style.height = `${imageRect.height}px`;
}

function clearOverlay(floorMapLinkEl) {
  if (!floorMapLinkEl) return;
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
  alignOverlayToImage({ overlayEl: overlay, containerEl: floorMapLinkEl, imageEl: floorMapEl });
  floorMapEl.addEventListener('load', () => alignOverlayToImage({ overlayEl: overlay, containerEl: floorMapLinkEl, imageEl: floorMapEl }), { once: true });

  validMarkers.forEach((marker) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gym-floor-map-marker';
    button.style.left = `${marker.x * 100}%`;
    button.style.top = `${marker.y * 100}%`;
    console.info('[map-marker][user] render marker', {
      sectorId: marker.sectorId,
      x: marker.x,
      y: marker.y
    });
    const markerLabel = typeof markerLabelBuilder === 'function'
      ? markerLabelBuilder(marker)
      : marker.sectorName || marker.sectorId;
    const safeLabel = String(markerLabel || marker.sectorId || '').trim() || marker.sectorId;
    button.title = safeLabel;
    button.setAttribute('aria-label', safeLabel);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSector3D(open3DFn, gymId, marker.sectorId);
    });
    overlay.appendChild(button);
  });

  floorMapLinkEl.appendChild(overlay);
}
