import {
  EVENT_STATUS_CANCELLED,
  EVENT_STATUS_DRAFT,
  EVENT_STATUS_ENDED,
  EVENT_STATUS_PUBLISHED,
  EVENT_TYPE_STANDARD,
  EVENT_TYPES,
  buildEventPayload,
  isSupportedEventStatus,
  normalizeDateValue,
} from './event-model.js';

export function validateStandardEventInput(input = {}) {
  const payload = buildEventPayload(input, {
    now: input.updatedAt || new Date(),
    userId: input.updatedBy || input.createdBy || null,
  });
  const errors = [];

  if (!payload.gymId) errors.push('gymId');
  if (payload.type !== EVENT_TYPE_STANDARD || !EVENT_TYPES.includes(payload.type)) errors.push('type');
  if (!isSupportedEventStatus(payload.status)) errors.push('status');
  if (!payload.title) errors.push('title');
  if (!payload.summary) errors.push('summary');
  if (!payload.description) errors.push('description');
  if (!payload.startsAt) errors.push('startsAt');
  if (!payload.endsAt) errors.push('endsAt');
  if (!payload.createdAt) errors.push('createdAt');
  if (!payload.updatedAt) errors.push('updatedAt');
  if (!payload.createdBy) errors.push('createdBy');
  if (!payload.updatedBy) errors.push('updatedBy');
  if (payload.startsAt && payload.endsAt && payload.startsAt > payload.endsAt) errors.push('dateRange');

  return {
    valid: errors.length === 0,
    errors,
    payload,
  };
}

export function validateStandardEventUpdate(input = {}, existingEvent = {}) {
  const nextPayload = buildEventPayload({
    ...existingEvent,
    ...input,
    createdAt: normalizeDateValue(existingEvent.createdAt || input.createdAt),
    createdBy: existingEvent.createdBy || input.createdBy,
  }, {
    now: input.updatedAt || new Date(),
    userId: input.updatedBy || null,
  });

  const result = validateStandardEventInput(nextPayload);
  result.payload.createdAt = normalizeDateValue(existingEvent.createdAt || result.payload.createdAt);
  result.payload.createdBy = existingEvent.createdBy || result.payload.createdBy;
  return result;
}

export function canTransitionEventStatus(currentStatus, nextStatus) {
  if (!isSupportedEventStatus(currentStatus) || !isSupportedEventStatus(nextStatus)) return false;
  if (currentStatus === nextStatus) return true;

  const allowedTransitions = {
    [EVENT_STATUS_DRAFT]: [EVENT_STATUS_PUBLISHED, EVENT_STATUS_CANCELLED],
    [EVENT_STATUS_PUBLISHED]: [EVENT_STATUS_ENDED, EVENT_STATUS_CANCELLED],
    [EVENT_STATUS_ENDED]: [],
    [EVENT_STATUS_CANCELLED]: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) || false;
}
