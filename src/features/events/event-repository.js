import {
  EVENT_STATUS_CANCELLED,
  EVENT_STATUS_DRAFT,
  EVENT_STATUS_ENDED,
  EVENT_STATUS_PUBLISHED,
  buildEventPayload,
  isEventVisibleToUsers,
  normalizeEventRecord,
} from './event-model.js';
import { canTransitionEventStatus, validateStandardEventInput, validateStandardEventUpdate } from './event-validation.js';

function ensureFirestoreDependencies(options = {}) {
  const { db, collection, doc, addDoc, getDoc, getDocs, setDoc } = options;
  if (!db) throw new Error('Events repository requires db');
  if (typeof collection !== 'function') throw new Error('Events repository requires collection()');
  if (typeof doc !== 'function') throw new Error('Events repository requires doc()');
  if (typeof getDoc !== 'function') throw new Error('Events repository requires getDoc()');
  if (typeof getDocs !== 'function') throw new Error('Events repository requires getDocs()');
  if (typeof setDoc !== 'function') throw new Error('Events repository requires setDoc()');
  if (typeof addDoc !== 'function') throw new Error('Events repository requires addDoc()');
}

function getEventsCollectionRef(options = {}, gymId) {
  ensureFirestoreDependencies(options);
  return options.collection(options.db, 'gyms', gymId, 'events');
}

function getEventDocRef(options = {}, gymId, eventId) {
  ensureFirestoreDependencies(options);
  return options.doc(options.db, 'gyms', gymId, 'events', eventId);
}

export async function createEvent(options = {}) {
  const validation = validateStandardEventInput(buildEventPayload(options.data, {
    now: options.now || new Date(),
    userId: options.userId || null,
  }));
  if (!validation.valid) throw new Error(`Invalid standard event: ${validation.errors.join(', ')}`);

  const ref = await options.addDoc(getEventsCollectionRef(options, validation.payload.gymId), validation.payload);
  return { id: ref.id, ...validation.payload };
}

export async function updateEvent(options = {}) {
  const { gymId, eventId } = options;
  if (!gymId || !eventId) throw new Error('updateEvent requires gymId and eventId');

  const existing = await getEventById(options);
  if (!existing) throw new Error('Event not found');

  const validation = validateStandardEventUpdate(options.data, existing);
  if (!validation.valid) throw new Error(`Invalid standard event: ${validation.errors.join(', ')}`);

  await options.setDoc(getEventDocRef(options, gymId, eventId), validation.payload, { merge: true });
  return { id: eventId, ...validation.payload };
}

export async function listGymEvents(options = {}) {
  const { gymId, includeHidden = false } = options;
  if (!gymId) return [];
  const snap = await options.getDocs(getEventsCollectionRef(options, gymId));
  return snap.docs
    .map((row) => ({ id: row.id, ...normalizeEventRecord(row.data() || {}) }))
    .filter((event) => includeHidden || isEventVisibleToUsers(event))
    .sort((a, b) => {
      const aStart = Date.parse(a.startsAt || '') || 0;
      const bStart = Date.parse(b.startsAt || '') || 0;
      return aStart - bStart;
    });
}

export async function getEventById(options = {}) {
  const { gymId, eventId } = options;
  if (!gymId || !eventId) return null;
  const snap = await options.getDoc(getEventDocRef(options, gymId, eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normalizeEventRecord(snap.data() || {}) };
}

async function updateEventStatus(options = {}, nextStatus) {
  const existing = await getEventById(options);
  if (!existing) throw new Error('Event not found');
  if (!canTransitionEventStatus(existing.status, nextStatus)) {
    throw new Error(`Invalid event status transition: ${existing.status} -> ${nextStatus}`);
  }

  return updateEvent({
    ...options,
    data: {
      ...existing,
      status: nextStatus,
    },
  });
}

export async function publishEvent(options = {}) {
  return updateEventStatus(options, EVENT_STATUS_PUBLISHED);
}

export async function cancelEvent(options = {}) {
  return updateEventStatus(options, EVENT_STATUS_CANCELLED);
}

export async function endEvent(options = {}) {
  return updateEventStatus(options, EVENT_STATUS_ENDED);
}

export function createDraftEvent(input = {}, context = {}) {
  return buildEventPayload({
    ...input,
    status: EVENT_STATUS_DRAFT,
  }, {
    now: context.now || new Date(),
    userId: context.userId || null,
  });
}
