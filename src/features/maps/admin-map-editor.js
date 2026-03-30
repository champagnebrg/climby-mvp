import { getFloorMapVersion, getSectorHotspotPayload, getSectorMarkerPayload, isMarkerLinkedToVersion } from './map-model.js';
import { isNormalizedMarker, isNormalizedRect } from './map-validation.js';
import { getRenderedImageContentRect, toRectLog } from './map-render-geometry.js';

const ADMIN_OVERLAY_SELECTOR = '[data-admin-map-overlay="1"]';
const ADMIN_STAGE_POINTER_CLEANUP_KEY = '__climbyAdminMapPointerCleanup';
const ADMIN_OVERLAY_CLEANUP_KEY = '__climbyAdminMapOverlayCleanup';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function normalizeRectFromCorners(start = {}, end = {}) {
  const left = clamp01(Math.min(Number(start.x), Number(end.x)));
  const top = clamp01(Math.min(Number(start.y), Number(end.y)));
  const right = clamp01(Math.max(Number(start.x), Number(end.x)));
  const bottom = clamp01(Math.max(Number(start.y), Number(end.y)));
  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

function getRenderableHotspotForSector(sector = {}, floorMapVersion) {
  const hotspot = getSectorHotspotPayload(sector);
  if (hotspot?.type === 'rect' && isNormalizedRect(hotspot.rect) && hotspot.version === floorMapVersion) {
    return {
      type: 'rect',
      rect: hotspot.rect,
      version: hotspot.version,
    };
  }
  const { marker } = getSectorMarkerPayload(sector);
  const linkedMarker = isNormalizedMarker(marker) && isMarkerLinkedToVersion(sector, floorMapVersion);
  if (!linkedMarker) return null;
  return {
    type: 'marker',
    marker: {
      x: Number(marker.x),
      y: Number(marker.y),
    },
    version: floorMapVersion,
  };
}

function toNormalizedPoint(event, renderedRect) {
  if (!renderedRect?.width || !renderedRect?.height) return null;
  const rawX = (event.clientX - renderedRect.left) / renderedRect.width;
  const rawY = (event.clientY - renderedRect.top) / renderedRect.height;
  if (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1) return null;
  return { x: clamp01(rawX), y: clamp01(rawY) };
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

function clearStageHandlers(stageEl) {
  if (!stageEl) return;
  if (typeof stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] === 'function') {
    stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY]();
  }
}

function clearAdminOverlay(stageEl) {
  if (!stageEl) return;
  if (typeof stageEl[ADMIN_OVERLAY_CLEANUP_KEY] === 'function') {
    stageEl[ADMIN_OVERLAY_CLEANUP_KEY]();
  }
  stageEl.querySelectorAll(ADMIN_OVERLAY_SELECTOR).forEach((node) => node.remove());
}

export function renderAdminGymMapEditor({
  gymId,
  gymData = {},
  sectors = [],
  selectedSectorId = null,
  selectedHotspotType = 'marker',
  draftRect = null,
  wrapEl,
  stageEl,
  floorMapEl,
  sectorListEl,
  hintEl,
  onSelectSector,
  onChangeHotspotType,
  onDraftRectChange,
  onSaveMarker,
  onSaveRect,
  onRemoveHotspot,
  labels = {},
} = {}) {
  if (!wrapEl || !stageEl || !floorMapEl || !sectorListEl || !hintEl) return;

  clearAdminOverlay(stageEl);
  clearStageHandlers(stageEl);

  const floorMapUrl = String(gymData?.floorMapUrl || '').trim();
  const floorMapVersion = getFloorMapVersion(gymData);
  const hasFloorMap = !!floorMapUrl;
  const selectedSector = sectors.find((sector) => sector?.sectorId === selectedSectorId) || null;
  const selectedSectorHotspot = selectedSector ? getRenderableHotspotForSector(selectedSector, floorMapVersion) : null;
  const hasSelectedRect = isNormalizedRect(draftRect) || (selectedSectorHotspot?.type === 'rect' && isNormalizedRect(selectedSectorHotspot.rect));

  floorMapEl.src = floorMapUrl;
  floorMapEl.alt = labels.floorMapAlt || 'floor map';
  wrapEl.style.display = 'block';
  stageEl.style.display = hasFloorMap ? 'block' : 'none';
  hintEl.textContent = !hasFloorMap
    ? (labels.noFloorMap || '')
    : !selectedSectorId
      ? (labels.selectSectorHint || '')
      : selectedHotspotType === 'rect'
        ? (labels.dragToDraw || '')
        : (labels.clickToPlace || '');

  const overlay = document.createElement('div');
  overlay.className = 'gym-floor-map-overlay admin-floor-map-overlay';
  overlay.dataset.adminMapOverlay = '1';
  setupOverlaySync({
    overlayEl: overlay,
    containerEl: stageEl,
    imageEl: floorMapEl,
    debugLabel: 'admin',
    getExtra: () => ({ gymId, selectedSectorId, floorMapVersion, selectedHotspotType })
  });

  sectors.forEach((sector) => {
    const sectorId = sector?.sectorId || null;
    if (!sectorId) return;
    const sectorName = sector?.sectorName || sector?.name || sectorId || '';
    const hotspot = getRenderableHotspotForSector(sector, floorMapVersion);
    if (!hotspot) return;

    if (hotspot.type === 'rect') {
      const rectEl = document.createElement('button');
      rectEl.type = 'button';
      rectEl.className = `gym-floor-map-hotspot gym-floor-map-hotspot-rect admin-floor-map-hotspot-rect${selectedSectorId === sectorId ? ' selected' : ''}`;
      rectEl.style.left = `${Number(hotspot.rect.x) * 100}%`;
      rectEl.style.top = `${Number(hotspot.rect.y) * 100}%`;
      rectEl.style.width = `${Number(hotspot.rect.w) * 100}%`;
      rectEl.style.height = `${Number(hotspot.rect.h) * 100}%`;
      if (selectedSectorId === sectorId && selectedHotspotType === 'rect') {
        rectEl.style.pointerEvents = 'none';
      }
      rectEl.title = sectorName;
      rectEl.setAttribute('aria-label', sectorName);
      rectEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onSelectSector === 'function') onSelectSector(sectorId);
      });
      overlay.appendChild(rectEl);
      return;
    }

    const markerEl = document.createElement('button');
    markerEl.type = 'button';
    markerEl.className = `gym-floor-map-marker admin-floor-map-marker${selectedSectorId === sectorId ? ' selected' : ''}`;
    markerEl.style.left = `${Number(hotspot.marker.x) * 100}%`;
    markerEl.style.top = `${Number(hotspot.marker.y) * 100}%`;
    markerEl.title = sectorName;
    markerEl.setAttribute('aria-label', sectorName);
    markerEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onSelectSector === 'function') onSelectSector(sectorId);
    });
    overlay.appendChild(markerEl);
  });

  if (selectedSectorId && selectedHotspotType === 'rect') {
    const rect = isNormalizedRect(draftRect)
      ? draftRect
      : (selectedSectorHotspot?.type === 'rect' ? selectedSectorHotspot.rect : null);
    if (rect) {
      const draftEl = document.createElement('div');
      draftEl.className = 'admin-floor-map-rect-draft';
      draftEl.style.left = `${Number(rect.x) * 100}%`;
      draftEl.style.top = `${Number(rect.y) * 100}%`;
      draftEl.style.width = `${Number(rect.w) * 100}%`;
      draftEl.style.height = `${Number(rect.h) * 100}%`;
      overlay.appendChild(draftEl);
    }
  }

  stageEl.appendChild(overlay);

  sectorListEl.innerHTML = '';
  sectors.forEach((sector) => {
    const sectorId = sector?.sectorId || null;
    if (!sectorId) return;
    const sectorName = sector?.sectorName || sector?.name || sectorId;
    const hotspot = getRenderableHotspotForSector(sector, floorMapVersion);
    const row = document.createElement('div');
    row.className = `admin-map-sector-row${selectedSectorId === sectorId ? ' selected' : ''}`;
    const main = document.createElement('div');
    main.className = 'admin-map-sector-main';
    const title = document.createElement('b');
    title.textContent = sectorName;
    const status = document.createElement('span');
    status.className = `admin-map-sector-status ${hotspot ? 'ok' : 'warn'}`;
    status.textContent = hotspot
      ? `${labels.linked || 'Linked'} · ${hotspot.type === 'rect' ? (labels.typeRect || 'Area') : (labels.typeMarker || 'Marker')}`
      : (labels.notLinked || 'Not linked');
    main.appendChild(title);
    main.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'admin-map-sector-actions';
    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'btn-sec';
    selectBtn.textContent = selectedSectorId === sectorId ? (labels.selected || 'Selected') : (labels.select || 'Select');
    actions.appendChild(selectBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-sec';
    removeBtn.textContent = labels.remove || 'Remove hotspot';
    removeBtn.disabled = !hotspot;
    actions.appendChild(removeBtn);

    row.appendChild(main);
    row.appendChild(actions);

    if (selectedSectorId === sectorId) {
      const tools = document.createElement('div');
      tools.className = 'admin-map-hotspot-tools';

      const typeLabel = document.createElement('span');
      typeLabel.className = 'admin-map-hotspot-tools-label';
      typeLabel.textContent = labels.typeLabel || 'Tipo hotspot';
      tools.appendChild(typeLabel);

      const markerTypeBtn = document.createElement('button');
      markerTypeBtn.type = 'button';
      markerTypeBtn.className = `btn-sec admin-map-hotspot-type-btn${selectedHotspotType === 'marker' ? ' active' : ''}`;
      markerTypeBtn.textContent = labels.typeMarker || 'Marker';
      tools.appendChild(markerTypeBtn);

      const rectTypeBtn = document.createElement('button');
      rectTypeBtn.type = 'button';
      rectTypeBtn.className = `btn-sec admin-map-hotspot-type-btn${selectedHotspotType === 'rect' ? ' active' : ''}`;
      rectTypeBtn.textContent = labels.typeRect || 'Area rettangolare';
      tools.appendChild(rectTypeBtn);

      if (selectedHotspotType === 'rect') {
        const saveRectBtn = document.createElement('button');
        saveRectBtn.type = 'button';
        saveRectBtn.className = 'btn-main';
        saveRectBtn.textContent = labels.saveRect || 'Salva area';
        saveRectBtn.disabled = !hasSelectedRect;
        tools.appendChild(saveRectBtn);
        saveRectBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = isNormalizedRect(draftRect)
            ? draftRect
            : (selectedSectorHotspot?.type === 'rect' ? selectedSectorHotspot.rect : null);
          if (!isNormalizedRect(rect)) return;
          if (typeof onSaveRect === 'function') {
            await onSaveRect(sectorId, { ...rect, floorMapVersion });
          }
        });
      }

      markerTypeBtn.addEventListener('click', () => {
        if (typeof onChangeHotspotType === 'function') onChangeHotspotType(sectorId, 'marker');
      });
      rectTypeBtn.addEventListener('click', () => {
        if (typeof onChangeHotspotType === 'function') onChangeHotspotType(sectorId, 'rect');
      });
      row.appendChild(tools);
    }

    selectBtn.addEventListener('click', () => {
      if (typeof onSelectSector === 'function') onSelectSector(sectorId);
    });
    removeBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onRemoveHotspot === 'function') await onRemoveHotspot(sectorId);
    });

    sectorListEl.appendChild(row);
  });

  if (!hasFloorMap || !selectedSectorId) return;

  if (selectedHotspotType === 'marker') {
    const clickHandler = async (event) => {
      const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
      const normalizedPoint = toNormalizedPoint(event, geometry?.renderedRect);
      if (!normalizedPoint) return;
      if (typeof onSaveMarker === 'function') {
        await onSaveMarker(selectedSectorId, { ...normalizedPoint, floorMapVersion });
      }
    };
    stageEl.addEventListener('click', clickHandler);
    stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = () => {
      stageEl.removeEventListener('click', clickHandler);
      stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = null;
    };
    return;
  }

  let dragStart = null;
  let activePointerId = null;
  const pointerDown = (event) => {
    if (event.button !== 0) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const startPoint = toNormalizedPoint(event, geometry?.renderedRect);
    if (!startPoint) return;
    dragStart = startPoint;
    activePointerId = event.pointerId;
    stageEl.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };
  const pointerMove = (event) => {
    if (!dragStart || activePointerId == null || event.pointerId !== activePointerId) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const endPoint = toNormalizedPoint(event, geometry?.renderedRect);
    if (!endPoint) return;
    const rect = normalizeRectFromCorners(dragStart, endPoint);
    if (!rect.w || !rect.h) return;
    if (typeof onDraftRectChange === 'function') onDraftRectChange(rect);
  };
  const pointerUp = (event) => {
    if (activePointerId == null || event.pointerId !== activePointerId) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const endPoint = toNormalizedPoint(event, geometry?.renderedRect);
    if (dragStart && endPoint) {
      const rect = normalizeRectFromCorners(dragStart, endPoint);
      if (rect.w && rect.h && typeof onDraftRectChange === 'function') onDraftRectChange(rect);
    }
    stageEl.releasePointerCapture?.(event.pointerId);
    dragStart = null;
    activePointerId = null;
  };

  stageEl.addEventListener('pointerdown', pointerDown);
  stageEl.addEventListener('pointermove', pointerMove);
  stageEl.addEventListener('pointerup', pointerUp);
  stageEl.addEventListener('pointercancel', pointerUp);
  stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = () => {
    stageEl.removeEventListener('pointerdown', pointerDown);
    stageEl.removeEventListener('pointermove', pointerMove);
    stageEl.removeEventListener('pointerup', pointerUp);
    stageEl.removeEventListener('pointercancel', pointerUp);
    stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = null;
  };
}
