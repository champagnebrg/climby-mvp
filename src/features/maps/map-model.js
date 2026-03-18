export const DEFAULT_FLOOR_MAP_VERSION = 1;

export function getFloorMapVersion(gymData = {}) {
  const raw = gymData?.floorMapVersion;
  const version = Number(raw);
  if (!Number.isFinite(version) || version <= 0) return DEFAULT_FLOOR_MAP_VERSION;
  return Math.floor(version);
}

export function getSectorMarkerPayload(sector = {}) {
  const marker = sector?.mapMarker || null;
  const markerVersion = Number(sector?.mapMarkerVersion);
  return {
    marker,
    markerVersion: Number.isFinite(markerVersion) ? Math.floor(markerVersion) : null,
  };
}

export function isMarkerLinkedToVersion(sector = {}, floorMapVersion) {
  const { markerVersion } = getSectorMarkerPayload(sector);
  return Number.isFinite(markerVersion) && markerVersion === getFloorMapVersion({ floorMapVersion });
}
