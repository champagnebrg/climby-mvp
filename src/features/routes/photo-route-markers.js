import { isNormalizedMarker } from '../maps/map-validation.js';
import { getRenderedImageContentRect } from '../maps/map-render-geometry.js';
import { getRoutePhoto2DAnchor } from './route-anchor-model.js';

const OVERLAY_SELECTOR = '[data-photo-route-overlay="1"]';
const OVERLAY_CLEANUP_KEY = '__climbyPhotoRouteOverlayCleanup';
const STAGE_CLICK_KEY = '__climbyPhotoRouteStageClick';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function clearStageClick(viewportEl) {
  if (!viewportEl) return;
  if (typeof viewportEl[STAGE_CLICK_KEY] === 'function') {
    viewportEl.removeEventListener('click', viewportEl[STAGE_CLICK_KEY]);
    viewportEl[STAGE_CLICK_KEY] = null;
  }
}

export function clearPhotoRouteOverlay(viewportEl) {
  if (!viewportEl) return;
  if (typeof viewportEl[OVERLAY_CLEANUP_KEY] === 'function') viewportEl[OVERLAY_CLEANUP_KEY]();
  clearStageClick(viewportEl);
  viewportEl.querySelectorAll(OVERLAY_SELECTOR).forEach((node) => node.remove());
}

function syncOverlayRect({ overlayEl, viewportEl, imageEl } = {}) {
  if (!overlayEl || !viewportEl || !imageEl) return null;
  const geometry = getRenderedImageContentRect({ containerEl: viewportEl, imageEl });
  if (!geometry) return null;
  const { overlayLeft, overlayTop, width, height } = geometry;
  overlayEl.style.left = `${overlayLeft}px`;
  overlayEl.style.top = `${overlayTop}px`;
  overlayEl.style.width = `${width}px`;
  overlayEl.style.height = `${height}px`;
  return geometry;
}

function setupOverlaySync({ overlayEl, viewportEl, imageEl } = {}) {
  if (!overlayEl || !viewportEl || !imageEl) return () => {};
  const sync = () => syncOverlayRect({ overlayEl, viewportEl, imageEl });
  const onLoad = () => sync();
  imageEl.addEventListener('load', onLoad);
  window.addEventListener('resize', sync);
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => sync())
    : null;
  resizeObserver?.observe(viewportEl);
  resizeObserver?.observe(imageEl);
  const raf = window.requestAnimationFrame(sync);
  return () => {
    window.cancelAnimationFrame(raf);
    imageEl.removeEventListener('load', onLoad);
    window.removeEventListener('resize', sync);
    resizeObserver?.disconnect();
  };
}

export function syncPhotoRouteOverlay(viewportEl) {
  if (!viewportEl) return;
  const overlay = viewportEl.querySelector(OVERLAY_SELECTOR);
  const imageEl = viewportEl.querySelector('#sector-photo-image');
  if (!overlay || !imageEl) return;
  syncOverlayRect({ overlayEl: overlay, viewportEl, imageEl });
}

export function renderPhotoRouteHotspots({
  viewportEl,
  imageEl,
  routes = [],
  draftHotspot = null,
  draftHotspotColor = '#ffffff',
  selectedRouteId = null,
  interactive = true,
  editable = false,
  onHotspotClick,
  onStageClick
} = {}) {
  if (!viewportEl || !imageEl) return { hotspotCount: 0 };
  clearPhotoRouteOverlay(viewportEl);

  const overlay = document.createElement('div');
  overlay.className = 'photo-route-overlay';
  overlay.dataset.photoRouteOverlay = '1';

  const validRoutes = routes.map((route) => {
    const routeId = String(route?.id || route?.routeId || '').trim();
    if (!routeId) return null;
    const anchor = getRoutePhoto2DAnchor(route);
    if (!isNormalizedMarker(anchor)) return { routeId, route, anchor: null };
    return { routeId, route, anchor };
  }).filter(Boolean);

  const overlapCount = new Map();
  validRoutes.forEach((row) => {
    if (!isNormalizedMarker(row.anchor)) return;
    const key = `${row.anchor.x.toFixed(3)}:${row.anchor.y.toFixed(3)}`;
    overlapCount.set(key, Number(overlapCount.get(key) || 0) + 1);
  });
  const overlapIndex = new Map();

  validRoutes.forEach(({ routeId, route, anchor }) => {
    if (!anchor) return;
    const key = `${anchor.x.toFixed(3)}:${anchor.y.toFixed(3)}`;
    const bucketSize = Number(overlapCount.get(key) || 1);
    const idx = Number(overlapIndex.get(key) || 0);
    overlapIndex.set(key, idx + 1);
    const angle = bucketSize > 1 ? ((Math.PI * 2) / bucketSize) * idx : 0;
    const radiusPx = bucketSize > 1 ? 12 : 0;
    const dx = Math.cos(angle) * radiusPx;
    const dy = Math.sin(angle) * radiusPx;
    const hotspotBtn = document.createElement('button');
    hotspotBtn.type = 'button';
    hotspotBtn.className = `gym-floor-map-marker photo-route-marker${selectedRouteId && String(selectedRouteId) === String(routeId) ? ' selected' : ''}`;
    hotspotBtn.style.left = `${anchor.x * 100}%`;
    hotspotBtn.style.top = `${anchor.y * 100}%`;
    hotspotBtn.style.setProperty('--marker-offset-x', `${dx.toFixed(2)}px`);
    hotspotBtn.style.setProperty('--marker-offset-y', `${dy.toFixed(2)}px`);
    const markerColor = String(route?.color || '#ffffff').trim() || '#ffffff';
    hotspotBtn.style.setProperty('--route-color', markerColor);
    hotspotBtn.style.borderColor = markerColor;
    hotspotBtn.dataset.routeId = routeId;
    hotspotBtn.title = route?.grade || routeId;
    hotspotBtn.setAttribute('aria-label', `Route hotspot ${route?.grade || routeId}`);
    if (!interactive) hotspotBtn.disabled = true;
    hotspotBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onHotspotClick === 'function') onHotspotClick({ routeId, route, anchor });
    });
    overlay.appendChild(hotspotBtn);
  });

  if (isNormalizedMarker(draftHotspot)) {
    const draftHotspotEl = document.createElement('button');
    draftHotspotEl.type = 'button';
    draftHotspotEl.className = 'gym-floor-map-marker photo-route-marker photo-route-draft-hotspot';
    draftHotspotEl.style.left = `${Number(draftHotspot.x) * 100}%`;
    draftHotspotEl.style.top = `${Number(draftHotspot.y) * 100}%`;
    const draftColor = String(draftHotspotColor || '#ffffff').trim() || '#ffffff';
    draftHotspotEl.style.setProperty('--route-color', draftColor);
    draftHotspotEl.style.borderColor = draftColor;
    draftHotspotEl.title = 'Route hotspot draft';
    draftHotspotEl.setAttribute('aria-label', 'Route hotspot draft');
    draftHotspotEl.disabled = true;
    overlay.appendChild(draftHotspotEl);
  }

  viewportEl.appendChild(overlay);
  const cleanupOverlaySync = setupOverlaySync({ overlayEl: overlay, viewportEl, imageEl });
  viewportEl[OVERLAY_CLEANUP_KEY] = () => {
    cleanupOverlaySync();
    clearStageClick(viewportEl);
    if (viewportEl[OVERLAY_CLEANUP_KEY]) viewportEl[OVERLAY_CLEANUP_KEY] = null;
  };

  if (editable) {
    clearStageClick(viewportEl);
    const stageHandler = (event) => {
      const geometry = getRenderedImageContentRect({ containerEl: viewportEl, imageEl });
      const rect = geometry?.renderedRect;
      if (!rect?.width || !rect?.height) return;
      const rawX = (event.clientX - rect.left) / rect.width;
      const rawY = (event.clientY - rect.top) / rect.height;
      if (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1) return;
      if (typeof onStageClick === 'function') {
        onStageClick({
          x: clamp01(rawX),
          y: clamp01(rawY)
        });
      }
    };
    viewportEl[STAGE_CLICK_KEY] = stageHandler;
    viewportEl.addEventListener('click', stageHandler);
  }

  return {
    hotspotCount: validRoutes.filter((row) => isNormalizedMarker(row.anchor)).length
  };
}

export function renderPhotoRouteMarkers(options = {}) {
  return renderPhotoRouteHotspots({
    ...options,
    draftHotspot: options?.draftHotspot ?? options?.draftMarker ?? null,
    onHotspotClick: options?.onHotspotClick ?? options?.onMarkerClick
  });
}
