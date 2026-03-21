import { toSafeDate } from '../../utils/format.js';
import { normalizeText } from '../../utils/normalize.js';

export const COMPETITION_LIVE_ENTRY_STATUS_ACTIVE = 'active';

export const COMPETITION_LIVE_ENTRY_STATUSES = Object.freeze([
  COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
]);

export function getDefaultCompetitionLiveEntry() {
  return {
    eventId: '',
    gymId: '',
    userId: '',
    status: COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
    score: 0,
    completedRouteIds: [],
    completedBySector: {},
    createdAt: null,
    updatedAt: null,
  };
}

export function normalizeCompetitionLiveEntryStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  return COMPETITION_LIVE_ENTRY_STATUSES.includes(normalized) ? normalized : '';
}

export function buildCompetitionLiveEntryPayload(input = {}, { now = new Date(), existing = null } = {}) {
  const defaults = getDefaultCompetitionLiveEntry();
  const createdAt = normalizeOptionalDateValue(input.createdAt) || existing?.createdAt || normalizeOptionalDateValue(now);
  const updatedAt = normalizeOptionalDateValue(now);
  const completedRouteIds = normalizeRouteIds(input.completedRouteIds);

  return {
    eventId: normalizeText(input.eventId),
    gymId: normalizeText(input.gymId),
    userId: normalizeText(input.userId),
    status: normalizeCompetitionLiveEntryStatus(input.status) || existing?.status || defaults.status,
    score: completedRouteIds.length,
    completedRouteIds,
    completedBySector: normalizeCompletedBySector(input.completedBySector),
    createdAt,
    updatedAt,
  };
}

export function normalizeCompetitionLiveEntryRecord(id, input = {}) {
  const completedRouteIds = normalizeRouteIds(input.completedRouteIds);

  return {
    id: normalizeText(id || input.userId),
    eventId: normalizeText(input.eventId),
    gymId: normalizeText(input.gymId),
    userId: normalizeText(input.userId),
    status: normalizeCompetitionLiveEntryStatus(input.status) || COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
    score: Number.isFinite(input.score) ? input.score : completedRouteIds.length,
    completedRouteIds,
    completedBySector: normalizeCompletedBySector(input.completedBySector),
    createdAt: normalizeOptionalDateValue(input.createdAt),
    updatedAt: normalizeOptionalDateValue(input.updatedAt),
  };
}

export function normalizeCompletedBySector(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  return Object.fromEntries(
    Object.entries(input)
      .map(([sectorId, routeIds]) => [normalizeText(sectorId), normalizeRouteIds(routeIds)])
      .filter(([sectorId, routeIds]) => sectorId && routeIds.length)
  );
}

export function normalizeRouteIds(input = []) {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.map((routeId) => normalizeText(routeId)).filter(Boolean)));
}

function normalizeOptionalDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}
