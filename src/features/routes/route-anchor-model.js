import { isNormalizedCoordinate } from '../maps/map-validation.js';

function asNonEmptyString(value) {
  const text = String(value || '').trim();
  return text || null;
}

export function getRoute3DAnchor(route = {}) {
  const nested = route?.anchors?.model3d || null;
  const nestedPosition = asNonEmptyString(nested?.position);
  const nestedNormal = asNonEmptyString(nested?.normal);
  if (nestedPosition && nestedNormal) {
    return { position: nestedPosition, normal: nestedNormal, source: 'anchors.model3d' };
  }

  const legacyPosition = asNonEmptyString(route?.position);
  const legacyNormal = asNonEmptyString(route?.normal);
  if (legacyPosition && legacyNormal) {
    return { position: legacyPosition, normal: legacyNormal, source: 'legacy' };
  }

  return null;
}

export function withRoute3DAnchor(basePayload = {}, { position, normal, writeLegacy = true } = {}) {
  const normalizedPosition = asNonEmptyString(position);
  const normalizedNormal = asNonEmptyString(normal);
  if (!normalizedPosition || !normalizedNormal) return { ...(basePayload || {}) };

  const anchors = {
    ...((basePayload && basePayload.anchors) || {}),
    model3d: {
      position: normalizedPosition,
      normal: normalizedNormal
    }
  };

  return {
    ...(basePayload || {}),
    anchors,
    ...(writeLegacy ? { position: normalizedPosition, normal: normalizedNormal } : {})
  };
}

export function getRoutePhoto2DAnchor(route = {}) {
  const anchor = route?.anchors?.photo2d || null;
  if (!anchor || typeof anchor !== 'object') return null;
  const x = Number(anchor.x);
  const y = Number(anchor.y);
  if (!isNormalizedCoordinate(x) || !isNormalizedCoordinate(y)) return null;
  const version = Number(anchor.version);
  return {
    x,
    y,
    ...(Number.isFinite(version) && version > 0 ? { version: Math.floor(version) } : {})
  };
}

export function withRoutePhoto2DAnchor(basePayload = {}, { x, y, version = null } = {}) {
  const normalizedX = Number(x);
  const normalizedY = Number(y);
  if (!isNormalizedCoordinate(normalizedX) || !isNormalizedCoordinate(normalizedY)) {
    return { ...(basePayload || {}) };
  }

  const normalizedVersion = Number(version);
  const nextPhoto2d = {
    x: normalizedX,
    y: normalizedY,
    ...(Number.isFinite(normalizedVersion) && normalizedVersion > 0
      ? { version: Math.floor(normalizedVersion) }
      : {})
  };

  return {
    ...(basePayload || {}),
    anchors: {
      ...((basePayload && basePayload.anchors) || {}),
      photo2d: nextPhoto2d
    }
  };
}
