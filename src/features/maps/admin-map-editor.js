import { getFloorMapVersion, getSectorMarkerPayload, isMarkerLinkedToVersion } from './map-model.js';
import { isNormalizedMarker } from './map-validation.js';

const ADMIN_OVERLAY_SELECTOR = '[data-admin-map-overlay="1"]';
const ADMIN_CLICK_HANDLER_KEY = '__climbyAdminMapClickHandler';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

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

function clearAdminOverlay(stageEl) {
  if (!stageEl) return;
  stageEl.querySelectorAll(ADMIN_OVERLAY_SELECTOR).forEach((node) => node.remove());
}

function bindStageClick(stageEl, handler) {
  if (!stageEl) return;
  if (typeof stageEl[ADMIN_CLICK_HANDLER_KEY] === 'function') {
    stageEl.removeEventListener('click', stageEl[ADMIN_CLICK_HANDLER_KEY]);
  }
  stageEl[ADMIN_CLICK_HANDLER_KEY] = handler;
  if (typeof handler === 'function') stageEl.addEventListener('click', handler);
}

export function renderAdminGymMapEditor({
  gymId,
  gymData = {},
  sectors = [],
  selectedSectorId = null,
  wrapEl,
  stageEl,
  floorMapEl,
  sectorListEl,
  hintEl,
  onSelectSector,
  onSaveMarker,
  onRemoveMarker,
  labels = {},
} = {}) {
  if (!wrapEl || !stageEl || !floorMapEl || !sectorListEl || !hintEl) return;

  clearAdminOverlay(stageEl);
  bindStageClick(stageEl, null);

  const floorMapUrl = String(gymData?.floorMapUrl || '').trim();
  const floorMapVersion = getFloorMapVersion(gymData);
  const hasFloorMap = !!floorMapUrl;
  floorMapEl.src = floorMapUrl;
  floorMapEl.alt = labels.floorMapAlt || 'floor map';
  wrapEl.style.display = 'block';
  stageEl.style.display = hasFloorMap ? 'block' : 'none';
  hintEl.textContent = !hasFloorMap
    ? (labels.noFloorMap || '')
    : selectedSectorId
      ? (labels.clickToPlace || '')
      : (labels.selectSectorHint || '');

  const overlay = document.createElement('div');
  overlay.className = 'gym-floor-map-overlay admin-floor-map-overlay';
  overlay.dataset.adminMapOverlay = '1';
  alignOverlayToImage({ overlayEl: overlay, containerEl: stageEl, imageEl: floorMapEl });
  floorMapEl.addEventListener('load', () => alignOverlayToImage({ overlayEl: overlay, containerEl: stageEl, imageEl: floorMapEl }), { once: true });

  sectors.forEach((sector) => {
    const sectorId = sector?.sectorId || null;
    const sectorName = sector?.sectorName || sector?.name || sectorId || '';
    const { marker } = getSectorMarkerPayload(sector);
    const linked = hasFloorMap && isNormalizedMarker(marker) && isMarkerLinkedToVersion(sector, floorMapVersion);

    if (linked) {
      const markerEl = document.createElement('button');
      markerEl.type = 'button';
      markerEl.className = `gym-floor-map-marker admin-floor-map-marker${selectedSectorId === sectorId ? ' selected' : ''}`;
      markerEl.style.left = `${Number(marker.x) * 100}%`;
      markerEl.style.top = `${Number(marker.y) * 100}%`;
      markerEl.title = sectorName;
      markerEl.setAttribute('aria-label', sectorName);
      markerEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onSelectSector === 'function') onSelectSector(sectorId);
      });
      overlay.appendChild(markerEl);
    }
  });

  stageEl.appendChild(overlay);

  sectorListEl.innerHTML = '';
  sectors.forEach((sector) => {
    const sectorId = sector?.sectorId || null;
    if (!sectorId) return;
    const sectorName = sector?.sectorName || sector?.name || sectorId;
    const { marker } = getSectorMarkerPayload(sector);
    const linked = hasFloorMap && isNormalizedMarker(marker) && isMarkerLinkedToVersion(sector, floorMapVersion);
    const row = document.createElement('div');
    row.className = `admin-map-sector-row${selectedSectorId === sectorId ? ' selected' : ''}`;
    const main = document.createElement('div');
    main.className = 'admin-map-sector-main';
    const title = document.createElement('b');
    title.textContent = sectorName;
    const status = document.createElement('span');
    status.className = `admin-map-sector-status ${linked ? 'ok' : 'warn'}`;
    status.textContent = linked ? (labels.linked || 'Linked') : (labels.notLinked || 'Not linked');
    main.appendChild(title);
    main.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'admin-map-sector-actions';
    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'btn-sec';
    selectBtn.dataset.selectSector = '1';
    selectBtn.textContent = selectedSectorId === sectorId ? (labels.selected || 'Selected') : (labels.select || 'Select');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-sec';
    removeBtn.dataset.removeMarker = '1';
    removeBtn.textContent = labels.remove || 'Remove marker';
    removeBtn.disabled = !linked;
    actions.appendChild(selectBtn);
    actions.appendChild(removeBtn);

    row.appendChild(main);
    row.appendChild(actions);

    selectBtn.addEventListener('click', () => {
      if (typeof onSelectSector === 'function') onSelectSector(sectorId);
    });
    removeBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onRemoveMarker === 'function') await onRemoveMarker(sectorId);
    });
    sectorListEl.appendChild(row);
  });

  bindStageClick(stageEl, async (event) => {
    if (!hasFloorMap) return;
    if (!selectedSectorId) return;
    const rect = floorMapEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const rawX = (event.clientX - rect.left) / rect.width;
    const rawY = (event.clientY - rect.top) / rect.height;
    if (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1) return;
    const x = clamp01(rawX);
    const y = clamp01(rawY);
    console.info('[map-marker][admin] click normalized', {
      sectorId: selectedSectorId,
      x,
      y,
      floorMapVersion
    });
    if (typeof onSaveMarker === 'function') {
      await onSaveMarker(selectedSectorId, { x, y, floorMapVersion });
    }
  });
}
