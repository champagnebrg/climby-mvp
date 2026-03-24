import { toSafeDate } from '../../utils/format.js';
import { normalizeNullableText, normalizeText } from '../../utils/normalize.js';

export const EVENT_REGISTRATION_STATUS_REGISTERED = 'registered';
export const EVENT_REGISTRATION_STATUS_CHECKED_IN = 'checked_in';
export const EVENT_REGISTRATION_STATUS_CANCELLED = 'cancelled';

export const EVENT_REGISTRATION_STATUSES = Object.freeze([
  EVENT_REGISTRATION_STATUS_REGISTERED,
  EVENT_REGISTRATION_STATUS_CHECKED_IN,
  EVENT_REGISTRATION_STATUS_CANCELLED,
]);

function ensureDb(options = {}) {
  if (!options.db) throw new Error('Event registration repository requires db');
}

function ensureDoc(options = {}) {
  ensureDb(options);
  if (typeof options.doc !== 'function') throw new Error('Event registration repository requires doc()');
}

function ensureCollection(options = {}) {
  ensureDb(options);
  if (typeof options.collection !== 'function') throw new Error('Event registration repository requires collection()');
}

function ensureGetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.getDoc !== 'function') throw new Error('Event registration repository requires getDoc()');
}

function ensureGetDocs(options = {}) {
  ensureCollection(options);
  if (typeof options.getDocs !== 'function') throw new Error('Event registration repository requires getDocs()');
}

function ensureSetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.setDoc !== 'function') throw new Error('Event registration repository requires setDoc()');
}

function normalizeDateValue(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : '';
}

function normalizeRegistrationStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return EVENT_REGISTRATION_STATUSES.includes(status) ? status : '';
}

function getRegistrationsCollectionRef(options = {}, gymId, eventId) {
  ensureCollection(options);
  return options.collection(options.db, 'gyms', gymId, 'events', eventId, 'registrations');
}

function getRegistrationDocRef(options = {}, gymId, eventId, userId) {
  ensureDoc(options);
  return options.doc(options.db, 'gyms', gymId, 'events', eventId, 'registrations', userId);
}

function buildRegistrationPayload(input = {}, context = {}) {
  const now = normalizeDateValue(context.now || new Date());
  const existing = context.existing || null;

  return {
    userId: normalizeText(input.userId || context.userId),
    gymId: normalizeText(input.gymId || context.gymId),
    eventId: normalizeText(input.eventId || context.eventId),
    status: normalizeRegistrationStatus(input.status) || EVENT_REGISTRATION_STATUS_REGISTERED,
    displayName: normalizeText(input.displayName),
    username: normalizeNullableText(input.username),
    avatarUrl: normalizeNullableText(input.avatarUrl),
    registeredAt: normalizeDateValue(input.registeredAt) || existing?.registeredAt || now,
    updatedAt: now,
  };
}

function normalizeRegistrationRecord(id, input = {}) {
  return {
    id,
    userId: normalizeText(input.userId),
    gymId: normalizeText(input.gymId),
    eventId: normalizeText(input.eventId),
    status: normalizeRegistrationStatus(input.status),
    displayName: normalizeText(input.displayName),
    username: normalizeNullableText(input.username),
    avatarUrl: normalizeNullableText(input.avatarUrl),
    registeredAt: normalizeDateValue(input.registeredAt),
    updatedAt: normalizeDateValue(input.updatedAt),
  };
}

export function hasAdminConfirmedEventCheckIn(registration = null) {
  return normalizeRegistrationStatus(registration?.status) === EVENT_REGISTRATION_STATUS_CHECKED_IN;
}

export async function getCurrentUserRegistration(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) return null;

  ensureGetDoc(options);
  const snap = await options.getDoc(getRegistrationDocRef(options, gymId, eventId, userId));
  if (!snap.exists()) return null;
  return normalizeRegistrationRecord(snap.id, snap.data() || {});
}

export async function registerUserToEvent(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) {
    throw new Error('registerUserToEvent requires gymId, eventId, and userId');
  }

  ensureSetDoc(options);
  const existing = await getCurrentUserRegistration(options);

  const payload = buildRegistrationPayload({
    ...existing,
    ...options.data,
    gymId,
    eventId,
    userId,
    status: EVENT_REGISTRATION_STATUS_REGISTERED,
  }, {
    existing,
    gymId,
    eventId,
    userId,
    now: options.now,
  });

  if (!payload.displayName) throw new Error('registerUserToEvent requires displayName');

  await options.setDoc(getRegistrationDocRef(options, gymId, eventId, userId), payload, { merge: true });
  return payload;
}

export async function cancelRegistration(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) {
    throw new Error('cancelRegistration requires gymId, eventId, and userId');
  }

  ensureSetDoc(options);
  const existing = await getCurrentUserRegistration(options);
  if (!existing) throw new Error('Registration not found');

  const payload = buildRegistrationPayload({
    ...existing,
    ...options.data,
    gymId,
    eventId,
    userId,
    status: EVENT_REGISTRATION_STATUS_CANCELLED,
  }, {
    existing,
    gymId,
    eventId,
    userId,
    now: options.now,
  });

  await options.setDoc(getRegistrationDocRef(options, gymId, eventId, userId), payload, { merge: true });
  return payload;
}



export async function updateRegistrationStatus(options = {}) {
  const { gymId, eventId, userId, status } = options;
  if (!gymId || !eventId || !userId) {
    throw new Error('updateRegistrationStatus requires gymId, eventId, and userId');
  }

  const nextStatus = normalizeRegistrationStatus(status);
  if (!nextStatus) throw new Error('Invalid registration status');

  ensureSetDoc(options);
  const existing = await getCurrentUserRegistration(options);
  if (!existing) throw new Error('Registration not found');

  const allowedTransitions = {
    [EVENT_REGISTRATION_STATUS_REGISTERED]: [EVENT_REGISTRATION_STATUS_CHECKED_IN, EVENT_REGISTRATION_STATUS_CANCELLED],
    [EVENT_REGISTRATION_STATUS_CHECKED_IN]: [EVENT_REGISTRATION_STATUS_REGISTERED],
  };

  if (existing.status === nextStatus) return existing;
  if (!(allowedTransitions[existing.status] || []).includes(nextStatus)) {
    throw new Error(`Invalid registration status transition: ${existing.status} -> ${nextStatus}`);
  }

  const payload = buildRegistrationPayload({
    ...existing,
    ...options.data,
    gymId,
    eventId,
    userId,
    status: nextStatus,
  }, {
    existing,
    gymId,
    eventId,
    userId,
    now: options.now,
  });

  await options.setDoc(getRegistrationDocRef(options, gymId, eventId, userId), payload, { merge: true });
  return payload;
}

export async function listRegistrationsForEvent(options = {}) {
  const { gymId, eventId } = options;
  if (!gymId || !eventId) return [];

  ensureGetDocs(options);
  const snap = await options.getDocs(getRegistrationsCollectionRef(options, gymId, eventId));
  return snap.docs
    .map((row) => normalizeRegistrationRecord(row.id, row.data() || {}))
    .sort((a, b) => {
      const aTime = Date.parse(a.registeredAt || '') || 0;
      const bTime = Date.parse(b.registeredAt || '') || 0;
      return aTime - bTime;
    });
}

export async function countActiveRegistrationsForEvent(options = {}) {
  const registrations = await listRegistrationsForEvent(options);
  return registrations.filter((registration) => [EVENT_REGISTRATION_STATUS_REGISTERED, EVENT_REGISTRATION_STATUS_CHECKED_IN].includes(registration.status)).length;
}
