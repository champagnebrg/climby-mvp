import { normalizeText } from '../../utils/normalize.js';
import { toSafeDate } from '../../utils/format.js';

export const EVENT_TYPE_STANDARD = 'standard';

export const EVENT_STATUS_DRAFT = 'draft';
export const EVENT_STATUS_PUBLISHED = 'published';
export const EVENT_STATUS_ENDED = 'ended';
export const EVENT_STATUS_CANCELLED = 'cancelled';

export const EVENT_TYPES = Object.freeze([EVENT_TYPE_STANDARD]);
export const EVENT_STATUSES = Object.freeze([
  EVENT_STATUS_DRAFT,
  EVENT_STATUS_PUBLISHED,
  EVENT_STATUS_ENDED,
  EVENT_STATUS_CANCELLED,
]);

export const COMPETITION_LIVE_STATUS_DRAFT = 'draft';
export const COMPETITION_LIVE_STATUS_LIVE = 'live';
export const COMPETITION_LIVE_STATUS_CLOSED = 'closed';

export const COMPETITION_LIVE_STATUSES = Object.freeze([
  COMPETITION_LIVE_STATUS_DRAFT,
  COMPETITION_LIVE_STATUS_LIVE,
  COMPETITION_LIVE_STATUS_CLOSED,
]);

export function isSupportedEventType(value) {
  return EVENT_TYPES.includes(value);
}

export function isSupportedEventStatus(value) {
  return EVENT_STATUSES.includes(value);
}

export function getDefaultCompetitionLive() {
  return {
    enabled: false,
    status: COMPETITION_LIVE_STATUS_DRAFT,
    format: '',
    label: '',
    startsAt: null,
    endsAt: null,
    notes: '',
    updatedAt: null,
  };
}

export function normalizeCompetitionLive(input = {}) {
  const defaults = getDefaultCompetitionLive();
  const source = input && typeof input === 'object' ? input : {};

  return {
    enabled: Boolean(source.enabled),
    status: normalizeCompetitionLiveStatus(source.status) || defaults.status,
    format: normalizeText(source.format),
    label: normalizeText(source.label),
    startsAt: normalizeOptionalDateValue(source.startsAt),
    endsAt: normalizeOptionalDateValue(source.endsAt),
    notes: normalizeText(source.notes),
    updatedAt: normalizeOptionalDateValue(source.updatedAt),
  };
}

export function buildEventPayload(input = {}, { now = new Date(), userId = null } = {}) {
  const createdAt = normalizeDateValue(input.createdAt) || normalizeDateValue(now);
  const updatedAt = normalizeDateValue(now);
  const createdBy = normalizeText(input.createdBy || userId);
  const updatedBy = normalizeText(userId || input.updatedBy || createdBy);

  return {
    gymId: normalizeText(input.gymId),
    type: EVENT_TYPE_STANDARD,
    status: normalizeEventStatus(input.status) || EVENT_STATUS_DRAFT,
    title: normalizeText(input.title),
    summary: normalizeText(input.summary),
    description: normalizeText(input.description),
    startsAt: normalizeDateValue(input.startsAt),
    endsAt: normalizeDateValue(input.endsAt),
    registrationEnabled: Boolean(input.registrationEnabled),
    competition_live: normalizeCompetitionLive(input.competition_live),
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
  };
}

export function normalizeEventStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  return isSupportedEventStatus(normalized) ? normalized : '';
}

export function normalizeCompetitionLiveStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  return COMPETITION_LIVE_STATUSES.includes(normalized) ? normalized : '';
}

export function normalizeEventRecord(input = {}) {
  return {
    ...buildEventPayload(input, {
      now: input.updatedAt || input.createdAt || new Date(),
      userId: input.updatedBy || input.createdBy || null,
    }),
    competition_live: normalizeCompetitionLive(input.competition_live),
  };
}

export function normalizeDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : '';
}

export function normalizeOptionalDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}

export function isEventVisibleToUsers(event = {}) {
  const status = normalizeText(event.status).toLowerCase();
  return status === EVENT_STATUS_PUBLISHED || status === 'live' || status === EVENT_STATUS_ENDED;
}
