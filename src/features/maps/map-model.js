export const DEFAULT_FLOOR_MAP_VERSION = 1;
const SUPPORTED_HOTSPOT_TYPES = new Set(['marker', 'rect', 'polygon']);

export function getFloorMapVersion(gymData = {}) {
  const raw = gymData?.floorMapVersion;
  const version = Number(raw);
  if (!Number.isFinite(version) || version <= 0) return DEFAULT_FLOOR_MAP_VERSION;
  return Math.floor(version);
}

export function getSectorMarkerPayload(sector = {}) {
  const hotspot = getSectorHotspotPayload(sector);
  const marker = hotspot?.type === 'marker'
    ? (hotspot.marker || null)
    : (sector?.mapMarker || null);
  const markerVersion = hotspot?.type === 'marker'
    ? Number(hotspot.version)
    : Number(sector?.mapMarkerVersion);
  return {
    marker,
    markerVersion: Number.isFinite(markerVersion) ? Math.floor(markerVersion) : null,
  };
}

export function getSectorHotspotPayload(sector = {}) {
  const raw = sector?.mapHotspot;
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw.type || '').trim().toLowerCase();
  if (!SUPPORTED_HOTSPOT_TYPES.has(type)) return null;
  const version = Number(raw.version);
  return {
    type,
    version: Number.isFinite(version) ? Math.floor(version) : null,
    marker: raw?.marker || null,
    rect: raw?.rect || null,
    polygon: raw?.polygon || null,
  };
}

export function isMarkerLinkedToVersion(sector = {}, floorMapVersion) {
  const { markerVersion } = getSectorMarkerPayload(sector);
  return Number.isFinite(markerVersion) && markerVersion === getFloorMapVersion({ floorMapVersion });
}
