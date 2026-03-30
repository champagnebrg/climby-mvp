import { getFloorMapVersion, getSectorHotspotPayload, getSectorMarkerPayload, isMarkerLinkedToVersion } from './map-model.js';
import { isNormalizedMarker, isNormalizedRect } from './map-validation.js';
import { getRenderedImageContentRect, toRectLog } from './map-render-geometry.js';

const ADMIN_OVERLAY_SELECTOR = '[data-admin-map-overlay="1"]';
const ADMIN_STAGE_POINTER_CLEANUP_KEY = '__climbyAdminMapPointerCleanup';
const ADMIN_OVERLAY_CLEANUP_KEY = '__climbyAdminMapOverlayCleanup';
const DEFAULT_RECT_SIZE = 0.18;
const MIN_RECT_SIZE = 0.03;

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

function clampRectToBounds(rect = {}, minSize = MIN_RECT_SIZE) {
  const width = Math.max(minSize, Math.min(1, Number(rect.w) || 0));
  const height = Math.max(minSize, Math.min(1, Number(rect.h) || 0));
  const x = clamp01(Math.min(1 - width, Math.max(0, Number(rect.x) || 0)));
  const y = clamp01(Math.min(1 - height, Math.max(0, Number(rect.y) || 0)));
  return { x, y, w: width, h: height };
}

function createDefaultRectFromPoint(point = {}, defaultSize = DEFAULT_RECT_SIZE) {
  const size = Math.max(MIN_RECT_SIZE, Math.min(1, Number(defaultSize) || DEFAULT_RECT_SIZE));
  const half = size / 2;
  return clampRectToBounds({
    x: clamp01(Number(point.x) - half),
    y: clamp01(Number(point.y) - half),
    w: size,
    h: size,
  });
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

function toNormalizedPoint(event, renderedRect, { allowOutOfBounds = false } = {}) {
  if (!renderedRect?.width || !renderedRect?.height) return null;
  const rawX = (event.clientX - renderedRect.left) / renderedRect.width;
  const rawY = (event.clientY - renderedRect.top) / renderedRect.height;
  if (!allowOutOfBounds && (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1)) return null;
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
  const activeRect = isNormalizedRect(draftRect)
    ? draftRect
    : (selectedSectorHotspot?.type === 'rect' ? selectedSectorHotspot.rect : null);
  const hasSelectedRect = isNormalizedRect(activeRect);

  floorMapEl.src = floorMapUrl;
  floorMapEl.alt = labels.floorMapAlt || 'floor map';
  wrapEl.style.display = 'block';
  stageEl.style.display = hasFloorMap ? 'block' : 'none';
  hintEl.textContent = !hasFloorMap
    ? (labels.noFloorMap || '')
    : !selectedSectorId
      ? (labels.selectSectorHint || '')
      : selectedHotspotType === 'rect'
        ? (hasSelectedRect
          ? (labels.rectEditHint || labels.rectClickToCreate || labels.dragToDraw || '')
          : (labels.rectClickToCreate || labels.dragToDraw || ''))
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
    const rect = activeRect;
    if (rect) {
      const draftEl = document.createElement('div');
      draftEl.className = 'admin-floor-map-rect-draft selected';
      draftEl.style.left = `${Number(rect.x) * 100}%`;
      draftEl.style.top = `${Number(rect.y) * 100}%`;
      draftEl.style.width = `${Number(rect.w) * 100}%`;
      draftEl.style.height = `${Number(rect.h) * 100}%`;
      draftEl.dataset.rectDrag = 'move';
      draftEl.title = labels.rectDragArea || 'Drag to move';
      ['nw', 'ne', 'se', 'sw'].forEach((corner) => {
        const handleEl = document.createElement('button');
        handleEl.type = 'button';
        handleEl.className = `admin-floor-map-rect-handle handle-${corner}`;
        handleEl.dataset.rectHandle = corner;
        handleEl.title = labels.rectResizeHandle || 'Drag corner to resize';
        handleEl.setAttribute('aria-label', `${labels.rectResizeHandle || 'Resize corner'} (${corner.toUpperCase()})`);
        draftEl.appendChild(handleEl);
      });
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

  const createRectFromClick = (event) => {
    if (hasSelectedRect) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const point = toNormalizedPoint(event, geometry?.renderedRect);
    if (!point) return;
    const rect = createDefaultRectFromPoint(point);
    if (typeof onDraftRectChange === 'function') onDraftRectChange(rect);
    event.preventDefault();
  };

  stageEl.addEventListener('click', createRectFromClick);

  const draftEl = overlay.querySelector('.admin-floor-map-rect-draft');
  let activeInteraction = null;
  let suppressNextCreateClick = false;
  const POINTER_MOVE_TOLERANCE = 0.002;
  const applyRectStyles = (rect) => {
    if (!draftEl || !isNormalizedRect(rect)) return;
    draftEl.style.left = `${Number(rect.x) * 100}%`;
    draftEl.style.top = `${Number(rect.y) * 100}%`;
    draftEl.style.width = `${Number(rect.w) * 100}%`;
    draftEl.style.height = `${Number(rect.h) * 100}%`;
  };
  const onDraftPointerDown = (event) => {
    if (!draftEl || event.button !== 0) return;
    if (!isNormalizedRect(activeRect)) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const point = toNormalizedPoint(event, geometry?.renderedRect);
    if (!point) return;
    const handle = event.target?.dataset?.rectHandle || null;
    activeInteraction = {
      pointerId: event.pointerId,
      mode: handle ? 'resize' : 'move',
      handle,
      startPoint: point,
      startRect: { ...activeRect },
      lastRect: { ...activeRect },
      hasMoved: false,
    };
    draftEl.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };
  const onDraftPointerMove = (event) => {
    if (!draftEl || !activeInteraction || event.pointerId !== activeInteraction.pointerId) return;
    const geometry = getRenderedImageContentRect({ containerEl: stageEl, imageEl: floorMapEl });
    const point = toNormalizedPoint(event, geometry?.renderedRect, { allowOutOfBounds: true });
    if (!point) return;
    const dx = point.x - activeInteraction.startPoint.x;
    const dy = point.y - activeInteraction.startPoint.y;
    let nextRect = null;
    if (activeInteraction.mode === 'move') {
      nextRect = clampRectToBounds({
        x: Number(activeInteraction.startRect.x) + dx,
        y: Number(activeInteraction.startRect.y) + dy,
        w: activeInteraction.startRect.w,
        h: activeInteraction.startRect.h,
      });
    } else {
      const { startRect, handle } = activeInteraction;
      const startLeft = Number(startRect.x);
      const startTop = Number(startRect.y);
      const startRight = startLeft + Number(startRect.w);
      const startBottom = startTop + Number(startRect.h);
      const cornerMap = {
        nw: { anchorX: startRight, anchorY: startBottom },
        ne: { anchorX: startLeft, anchorY: startBottom },
        se: { anchorX: startLeft, anchorY: startTop },
        sw: { anchorX: startRight, anchorY: startTop },
      };
      const anchor = cornerMap[handle] || cornerMap.se;
      nextRect = normalizeRectFromCorners({ x: anchor.anchorX, y: anchor.anchorY }, point);
      nextRect = clampRectToBounds(nextRect, MIN_RECT_SIZE);
    }
    if (!isNormalizedRect(nextRect)) return;
    activeInteraction.lastRect = nextRect;
    const movedX = Math.abs(point.x - activeInteraction.startPoint.x);
    const movedY = Math.abs(point.y - activeInteraction.startPoint.y);
    activeInteraction.hasMoved = activeInteraction.hasMoved || movedX > POINTER_MOVE_TOLERANCE || movedY > POINTER_MOVE_TOLERANCE;
    applyRectStyles(nextRect);
    event.preventDefault();
    event.stopPropagation();
  };
  const onDraftPointerUp = (event) => {
    if (!draftEl || !activeInteraction || event.pointerId !== activeInteraction.pointerId) return;
    draftEl.releasePointerCapture?.(event.pointerId);
    if (activeInteraction.hasMoved && isNormalizedRect(activeInteraction.lastRect) && typeof onDraftRectChange === 'function') {
      onDraftRectChange(activeInteraction.lastRect);
    }
    suppressNextCreateClick = !!activeInteraction.hasMoved;
    activeInteraction = null;
    event.preventDefault();
    event.stopPropagation();
  };
  const preventCreateAfterDrag = (event) => {
    if (!suppressNextCreateClick) return;
    suppressNextCreateClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  if (draftEl) {
    draftEl.style.touchAction = 'none';
    draftEl.addEventListener('pointerdown', onDraftPointerDown);
    draftEl.addEventListener('pointermove', onDraftPointerMove);
    draftEl.addEventListener('pointerup', onDraftPointerUp);
    draftEl.addEventListener('pointercancel', onDraftPointerUp);
    stageEl.addEventListener('pointerup', onDraftPointerUp);
    stageEl.addEventListener('pointercancel', onDraftPointerUp);
    stageEl.addEventListener('click', preventCreateAfterDrag, true);
  }

  stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = () => {
    stageEl.removeEventListener('click', createRectFromClick);
    if (draftEl) {
      draftEl.removeEventListener('pointerdown', onDraftPointerDown);
      draftEl.removeEventListener('pointermove', onDraftPointerMove);
      draftEl.removeEventListener('pointerup', onDraftPointerUp);
      draftEl.removeEventListener('pointercancel', onDraftPointerUp);
      stageEl.removeEventListener('pointerup', onDraftPointerUp);
      stageEl.removeEventListener('pointercancel', onDraftPointerUp);
      stageEl.removeEventListener('click', preventCreateAfterDrag, true);
    }
    stageEl[ADMIN_STAGE_POINTER_CLEANUP_KEY] = null;
  };
}
