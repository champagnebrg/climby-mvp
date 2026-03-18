export function isNormalizedCoordinate(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1;
}

export function isNormalizedMarker(marker) {
  if (!marker || typeof marker !== 'object') return false;
  return isNormalizedCoordinate(marker.x) && isNormalizedCoordinate(marker.y);
}
