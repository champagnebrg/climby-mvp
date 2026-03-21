import {
  buildCompetitionLiveEntryPayload,
  getDefaultCompetitionLiveEntry,
  normalizeCompetitionLiveEntryRecord,
} from './event-competition-live-entry-model.js';
import { COMPETITION_LIVE_STATUS_CLOSED, normalizeCompetitionLive } from './event-model.js';

function ensureDb(options = {}) {
  if (!options.db) throw new Error('Competition live entry repository requires db');
}

function ensureDoc(options = {}) {
  ensureDb(options);
  if (typeof options.doc !== 'function') throw new Error('Competition live entry repository requires doc()');
}

function ensureCollection(options = {}) {
  ensureDb(options);
  if (typeof options.collection !== 'function') throw new Error('Competition live entry repository requires collection()');
}

function ensureGetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.getDoc !== 'function') throw new Error('Competition live entry repository requires getDoc()');
}

function ensureGetDocs(options = {}) {
  ensureCollection(options);
  if (typeof options.getDocs !== 'function') throw new Error('Competition live entry repository requires getDocs()');
}

function ensureSetDoc(options = {}) {
  ensureDoc(options);
  if (typeof options.setDoc !== 'function') throw new Error('Competition live entry repository requires setDoc()');
}

export function getCompetitionLiveEntryDocRef(options = {}, gymId, eventId, userId) {
  ensureDoc(options);
  return options.doc(options.db, 'gyms', gymId, 'events', eventId, 'competitionLiveEntries', userId);
}

export function getCompetitionLiveEntriesCollectionRef(options = {}, gymId, eventId) {
  ensureCollection(options);
  return options.collection(options.db, 'gyms', gymId, 'events', eventId, 'competitionLiveEntries');
}

export async function getCompetitionLiveEntry(options = {}) {
  const { gymId, eventId, userId } = options;
  if (!gymId || !eventId || !userId) return null;

  ensureGetDoc(options);
  const snap = await options.getDoc(getCompetitionLiveEntryDocRef(options, gymId, eventId, userId));
  if (!snap.exists()) return null;
  return normalizeCompetitionLiveEntryRecord(snap.id, snap.data() || {});
}

export async function listCompetitionLiveEntries(options = {}) {
  const { gymId, eventId } = options;
  if (!gymId || !eventId) return [];

  ensureGetDocs(options);
  const snap = await options.getDocs(getCompetitionLiveEntriesCollectionRef(options, gymId, eventId));
  return snap.docs
    .map((docSnap) => normalizeCompetitionLiveEntryRecord(docSnap.id, docSnap.data() || {}))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
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

  const competitionLive = await getCompetitionLiveState(options);
  if (competitionLive.status === COMPETITION_LIVE_STATUS_CLOSED) {
    return getCompetitionLiveEntry(options);
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

async function getCompetitionLiveState(options = {}) {
  if (options.event?.competition_live) {
    return normalizeCompetitionLive(options.event.competition_live);
  }

  if (options.competitionLive) {
    return normalizeCompetitionLive(options.competitionLive);
  }

  const { gymId, eventId } = options;
  if (!gymId || !eventId) return normalizeCompetitionLive();

  ensureGetDoc(options);
  const eventSnap = await options.getDoc(options.doc(options.db, 'gyms', gymId, 'events', eventId));
  if (!eventSnap.exists()) return normalizeCompetitionLive();
  return normalizeCompetitionLive(eventSnap.data()?.competition_live);
}
