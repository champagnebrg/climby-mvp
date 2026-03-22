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
    displayName: null,
    username: null,
    firstName: null,
    lastName: null,
    status: COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
    score: 0,
    completedBlockNumbers: [],
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
  const completedBlockNumbers = normalizeCompletedBlockNumbers(input.completedBlockNumbers);
  const completedRouteIds = normalizeRouteIds(input.completedRouteIds);

  return {
    eventId: normalizeText(input.eventId),
    gymId: normalizeText(input.gymId),
    userId: normalizeText(input.userId),
    displayName: normalizeNullableText(input.displayName) || existing?.displayName || null,
    username: normalizeNullableText(input.username) || existing?.username || null,
    firstName: normalizeNullableText(input.firstName) || existing?.firstName || null,
    lastName: normalizeNullableText(input.lastName) || existing?.lastName || null,
    status: normalizeCompetitionLiveEntryStatus(input.status) || existing?.status || defaults.status,
    score: computeCompetitionLiveEntryScore({
      completedBlockNumbers,
      completedRouteIds,
    }),
    completedBlockNumbers,
    completedRouteIds,
    completedBySector: normalizeCompletedBySector(input.completedBySector),
    createdAt,
    updatedAt,
  };
}

export function normalizeCompetitionLiveEntryRecord(id, input = {}) {
  const completedBlockNumbers = normalizeCompletedBlockNumbers(input.completedBlockNumbers);
  const completedRouteIds = normalizeRouteIds(input.completedRouteIds);

  return {
    id: normalizeText(id || input.userId),
    eventId: normalizeText(input.eventId),
    gymId: normalizeText(input.gymId),
    userId: normalizeText(input.userId),
    displayName: normalizeNullableText(input.displayName),
    username: normalizeNullableText(input.username),
    firstName: normalizeNullableText(input.firstName),
    lastName: normalizeNullableText(input.lastName),
    status: normalizeCompetitionLiveEntryStatus(input.status) || COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
    score: computeCompetitionLiveEntryScore({
      completedBlockNumbers,
      completedRouteIds,
      fallbackScore: input.score,
    }),
    completedBlockNumbers,
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

export function normalizeCompletedBlockNumbers(input = []) {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(
    input
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )).sort((a, b) => a - b);
}

export function computeCompetitionLiveEntryScore({
  completedBlockNumbers = [],
  completedRouteIds = [],
  fallbackScore = null,
} = {}) {
  if (completedBlockNumbers.length) return completedBlockNumbers.length;
  if (completedRouteIds.length) return completedRouteIds.length;
  if (Number.isFinite(fallbackScore)) return fallbackScore;
  return 0;
}

function normalizeOptionalDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}
