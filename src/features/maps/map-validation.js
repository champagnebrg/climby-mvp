export function isNormalizedCoordinate(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1;
}

export function isNormalizedMarker(marker) {
  if (!marker || typeof marker !== 'object') return false;
  return isNormalizedCoordinate(marker.x) && isNormalizedCoordinate(marker.y);
}

export function isNormalizedRect(rect) {
  if (!rect || typeof rect !== 'object') return false;
  const x = Number(rect.x);
  const y = Number(rect.y);
  const w = Number(rect.w);
  const h = Number(rect.h);
  return isNormalizedCoordinate(x)
    && isNormalizedCoordinate(y)
    && Number.isFinite(w)
    && Number.isFinite(h)
    && w > 0
    && h > 0
    && (x + w) <= 1
    && (y + h) <= 1;
}
