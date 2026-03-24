import { getFloorMapVersion, getSectorMarkerPayload, isMarkerLinkedToVersion } from './map-model.js';
import { isNormalizedMarker } from './map-validation.js';
import { getRenderedImageContentRect, toRectLog } from './map-render-geometry.js';

const ADMIN_OVERLAY_SELECTOR = '[data-admin-map-overlay="1"]';
const ADMIN_CLICK_HANDLER_KEY = '__climbyAdminMapClickHandler';
const ADMIN_OVERLAY_CLEANUP_KEY = '__climbyAdminMapOverlayCleanup';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function alignOverlayToImage({ overlayEl, containerEl, imageEl, debugLabel = 'admin', extra = {} } = {}) {
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

function setupOverlaySync({ overlayEl, containerEl, imageEl, debugLabel = 'admin', getExtra = () => ({}) } = {}) {
  if (!overlayEl || !containerEl || !imageEl) return;
  if (typeof containerEl[ADMIN_OVERLAY_CLEANUP_KEY] === 'function') {
    containerEl[ADMIN_OVERLAY_CLEANUP_KEY]();
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
  containerEl[ADMIN_OVERLAY_CLEANUP_KEY] = () => {
    window.cancelAnimationFrame(rafId);
    imageEl.removeEventListener('load', handleLoad);
    window.removeEventListener('resize', sync);
    resizeObserver?.disconnect();
    if (containerEl[ADMIN_OVERLAY_CLEANUP_KEY]) containerEl[ADMIN_OVERLAY_CLEANUP_KEY] = null;
  };
}

function clearAdminOverlay(stageEl) {
  if (!stageEl) return;
  if (typeof stageEl[ADMIN_OVERLAY_CLEANUP_KEY] === 'function') {
    stageEl[ADMIN_OVERLAY_CLEANUP_KEY]();
  }
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
  setupOverlaySync({
    overlayEl: overlay,
    containerEl: stageEl,
    imageEl: floorMapEl,
    debugLabel: 'admin',
    getExtra: () => ({ gymId, selectedSectorId, floorMapVersion })
  });

  sectors.forEach((sector) => {
    const sectorId = sector?.sectorId || null;
    const sectorName = sector?.sectorName || sector?.name || sectorId || '';
    const { marker } = getSectorMarkerPayload(sector);
    const linked = hasFloorMap && isNormalizedMarker(marker) && isMarkerLinkedToVersion(sector, floorMapVersion);

    console.info('[map-marker][admin] marker data from DB', {
      sectorId,
      marker,
      mapMarkerVersion: sector?.mapMarkerVersion,
      floorMapVersion,
      linked,
    });

    if (linked) {
      const markerEl = document.createElement('button');
      markerEl.type = 'button';
      markerEl.className = `gym-floor-map-marker admin-floor-map-marker${selectedSectorId === sectorId ? ' selected' : ''}`;
      markerEl.style.left = `${Number(marker.x) * 100}%`;
      markerEl.style.top = `${Number(marker.y) * 100}%`;
      markerEl.title = sectorName;
      markerEl.setAttribute('aria-label', sectorName);
      console.info('[map-marker][admin] render marker', {
        sectorId,
        normalized: { x: Number(marker.x), y: Number(marker.y) },
        rendered: {
          leftPercent: `${Number(marker.x) * 100}%`,
          topPercent: `${Number(marker.y) * 100}%`,
        }
      });
      markerEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onSelectSector === 'function') onSelectSector(sectorId);
      });
      overlay.appendChild(markerEl);
    }
  });

  stageEl.appendChild(overlay);
  window.requestAnimationFrame(() => {
    const overlayRect = overlay.getBoundingClientRect();
    overlay.querySelectorAll('.gym-floor-map-marker').forEach((markerEl) => {
      const left = Number.parseFloat(markerEl.style.left || '0');
      const top = Number.parseFloat(markerEl.style.top || '0');
      console.info('[map-marker][admin] rendered marker final position', {
        sectorId: markerEl.getAttribute('aria-label'),
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
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const overlayRect = overlay.getBoundingClientRect();
    const rect = geometry?.renderedRect;
    const imageRect = geometry?.imageRect;
    if (!rect?.width || !rect?.height) return;
    const rawX = (event.clientX - rect.left) / rect.width;
    const rawY = (event.clientY - rect.top) / rect.height;
    if (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1) return;
    const x = clamp01(rawX);
    const y = clamp01(rawY);
    console.info('[map-marker][admin] click normalized', {
      sectorId: selectedSectorId,
      imageRect: toRectLog(imageRect),
      renderedRect: toRectLog(rect),
      overlayRect: toRectLog(overlayRect),
      normalized: { x, y },
      rendered: {
        leftPx: Number((x * rect.width).toFixed(2)),
        topPx: Number((y * rect.height).toFixed(2)),
      },
      floorMapVersion
    });
    if (typeof onSaveMarker === 'function') {
      await onSaveMarker(selectedSectorId, { x, y, floorMapVersion });
    }
  });
}
