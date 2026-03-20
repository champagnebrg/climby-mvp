import {
  buildCompetitionLiveEntryPayload,
  getDefaultCompetitionLiveEntry,
  normalizeCompetitionLiveEntryRecord,
} from './event-competition-live-entry-model.js';

function ensureDb(options = {}) {
  if (!options.db) throw new Error('Competition live entry repository requires db');
}

function ensureDoc(options = {}) {
  ensureDb(options);
  if (typeof options.doc !== 'function') throw new Error('Competition live entry repository requires doc()');
}

function ensureGetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.getDoc !== 'function') throw new Error('Competition live entry repository requires getDoc()');
}

function ensureSetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.setDoc !== 'function') throw new Error('Competition live entry repository requires setDoc()');
}

export function getCompetitionLiveEntryDocRef(options = {}, gymId, eventId, userId) {
  ensureDoc(options);
  return options.doc(options.db, 'gyms', gymId, 'events', eventId, 'competitionLiveEntries', userId);
}

export async function getCompetitionLiveEntry(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) return null;

  ensureGetDoc(options);
  const snap = await options.getDoc(getCompetitionLiveEntryDocRef(options, gymId, eventId, userId));
  if (!snap.exists()) return null;
  return normalizeCompetitionLiveEntryRecord(snap.id, snap.data() || {});
}

export async function getOrCreateCompetitionLiveEntry(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) {
    throw new Error('getOrCreateCompetitionLiveEntry requires gymId, eventId, and userId');
  }

  ensureSetDoc(options);
  const existing = await getCompetitionLiveEntry(options);
  if (existing) return existing;

  const payload = buildCompetitionLiveEntryPayload({
    ...getDefaultCompetitionLiveEntry(),
    gymId,
    eventId,
    userId,
    ...(options.data || {}),
  }, {
    now: options.now,
  });

  await options.setDoc(getCompetitionLiveEntryDocRef(options, gymId, eventId, userId), payload, { merge: false });
  return normalizeCompetitionLiveEntryRecord(userId, payload);
}

export async function saveCompetitionLiveCompletedRoutes(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) {
    throw new Error('saveCompetitionLiveCompletedRoutes requires gymId, eventId, and userId');
  }

  ensureSetDoc(options);
  const existing = await getOrCreateCompetitionLiveEntry(options);
  const payload = buildCompetitionLiveEntryPayload({
    ...existing,
    ...options.data,
    gymId,
    eventId,
    userId,
    createdAt: existing.createdAt,
  }, {
    now: options.now,
    existing,
  });

  await options.setDoc(getCompetitionLiveEntryDocRef(options, gymId, eventId, userId), payload, { merge: true });
  return normalizeCompetitionLiveEntryRecord(userId, payload);
}
