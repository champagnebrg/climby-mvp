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

export function isSupportedEventType(value) {
  return EVENT_TYPES.includes(value);
}

export function isSupportedEventStatus(value) {
  return EVENT_STATUSES.includes(value);
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

export function normalizeEventRecord(input = {}) {
  return buildEventPayload(input, {
    now: input.updatedAt || input.createdAt || new Date(),
    userId: input.updatedBy || input.createdBy || null,
  });
}

export function normalizeDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : '';
}

export function isEventVisibleToUsers(event = {}) {
  const status = normalizeText(event.status).toLowerCase();
  return status === EVENT_STATUS_PUBLISHED || status === 'live' || status === EVENT_STATUS_ENDED;
}
