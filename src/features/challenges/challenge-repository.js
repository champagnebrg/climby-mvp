import {
  CHALLENGE_SCOPE_GYM,
  CHALLENGE_STATUS_PUBLISHED,
  CHALLENGE_STATUS_DELETED,
  CHALLENGE_STATUS_ARCHIVED,
  CHALLENGE_STATUS_INACTIVE,
  buildChallengePayload,
  normalizeChallengeRecord,
  normalizeChallengeScreenConfig,
  normalizeTemplateRecord,
} from './challenge-model.js';

function ensureDeps(options = {}) {
  const { db, collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc } = options;
  if (!db) throw new Error('Challenges repository requires db');
  if (typeof collection !== 'function') throw new Error('Challenges repository requires collection()');
  if (typeof doc !== 'function') throw new Error('Challenges repository requires doc()');
  if (typeof getDoc !== 'function') throw new Error('Challenges repository requires getDoc()');
  if (typeof getDocs !== 'function') throw new Error('Challenges repository requires getDocs()');
  if (typeof setDoc !== 'function') throw new Error('Challenges repository requires setDoc()');
  if (typeof addDoc !== 'function') throw new Error('Challenges repository requires addDoc()');
  if (deleteDoc && typeof deleteDoc !== 'function') throw new Error('Challenges repository deleteDoc must be function');
}

function getCollectionRef(options = {}, name) {
  ensureDeps(options);
  return options.collection(options.db, name);
}

function getDocRef(options = {}, name, id) {
  ensureDeps(options);
  return options.doc(options.db, name, id);
}

function isChallengeActive(challenge = {}, now = new Date()) {
  if (!challenge.isActive) return false;
  if (challenge.lifecycleStatus !== CHALLENGE_STATUS_PUBLISHED && challenge.status !== CHALLENGE_STATUS_PUBLISHED) return false;
  const nowMs = now.getTime();
  const startMs = Date.parse(challenge.startsAt || '') || 0;
  const endMs = Date.parse(challenge.endsAt || '') || Number.MAX_SAFE_INTEGER;
  return nowMs >= startMs && nowMs <= endMs;
}

function canUserSeeChallenge(challenge = {}, context = {}) {
  if (!isChallengeActive(challenge, context.now || new Date())) return false;
  if (challenge.scope === CHALLENGE_SCOPE_GYM) {
    const gymIds = Array.isArray(context.gymIds) ? context.gymIds.filter(Boolean) : [];
    if (context.gymId) gymIds.push(context.gymId);
    if (!gymIds.length) return false;
    return gymIds.some((gymId) => (challenge.gymIds || []).includes(gymId) || challenge.gymId === gymId);
  }
  return true;
}

function normalizeForAction(payload = {}) {
  const normalized = normalizeChallengeRecord(payload);
  return {
    ...normalized,
    status: normalized.lifecycleStatus,
    lifecycleStatus: normalized.lifecycleStatus,
    isActive: normalized.lifecycleStatus === CHALLENGE_STATUS_PUBLISHED,
  };
}

function canHardDelete(challenge = {}) {
  return (Number(challenge.progressCount) || 0) === 0 && (Number(challenge.dependencyCount) || 0) === 0;
}

export async function listChallenges(options = {}, context = {}) {
  const snap = await options.getDocs(getCollectionRef(options, 'challenges'));
  return snap.docs
    .map((row) => ({ id: row.id, ...normalizeChallengeRecord(row.data() || {}) }))
    .filter((challenge) => {
      if (challenge.lifecycleStatus === CHALLENGE_STATUS_DELETED && !context.includeDrafts) return false;
      if (context.includeDrafts) return true;
      return canUserSeeChallenge(challenge, context);
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

function applyProgressFilter(options = {}, field, value) {
  const baseRef = getCollectionRef(options, 'userChallengeProgress');
  if (typeof options.query === 'function' && typeof options.where === 'function') {
    return options.query(baseRef, options.where(field, '==', value));
  }
  return baseRef;
}

export async function getUserChallengeProgress(options = {}, userId) {
  if (!userId) throw new Error('userId is required');
  const snap = await options.getDocs(applyProgressFilter(options, 'userId', userId));
  return snap.docs
    .map((row) => ({ id: row.id, ...(row.data() || {}) }))
    .filter((row) => row.userId === userId)
    .sort((a, b) => String(a.challengeId || '').localeCompare(String(b.challengeId || '')));
}

export function mergeChallengesWithProgress(challenges = [], progressRows = []) {
  const progressByChallengeId = new Map();
  progressRows.forEach((row) => {
    const challengeId = String(row.challengeId || '').trim();
    if (!challengeId) return;
    progressByChallengeId.set(challengeId, row);
  });
  return challenges.map((challenge) => {
    const progress = progressByChallengeId.get(challenge.id) || null;
    return {
      ...challenge,
      canonicalProgress: progress,
    };
  });
}

export async function saveChallenge(options = {}) {
  const payload = buildChallengePayload(options.data || {}, {
    now: options.now,
    userId: options.userId,
  });
  if (!payload.title) throw new Error('Challenge title is required');

  if (options.challengeId) {
    await options.setDoc(getDocRef(options, 'challenges', options.challengeId), payload, { merge: true });
    return { id: options.challengeId, ...payload };
  }

  const ref = await options.addDoc(getCollectionRef(options, 'challenges'), payload);
  return { id: ref.id, ...payload };
}

export async function updateChallengeLifecycle(options = {}) {
  if (!options.challengeId) throw new Error('challengeId is required');
  const nextStatus = options.lifecycleStatus;
  if (![CHALLENGE_STATUS_PUBLISHED, CHALLENGE_STATUS_INACTIVE, CHALLENGE_STATUS_ARCHIVED, CHALLENGE_STATUS_DELETED].includes(nextStatus)) {
    throw new Error('invalid lifecycle status');
  }
  const payload = normalizeForAction({ lifecycleStatus: nextStatus });
  await options.setDoc(getDocRef(options, 'challenges', options.challengeId), {
    lifecycleStatus: payload.lifecycleStatus,
    status: payload.status,
    isActive: payload.isActive,
    updatedAt: new Date().toISOString(),
    updatedBy: options.userId || null,
  }, { merge: true });
  return { id: options.challengeId, ...payload };
}

export async function deleteChallengeIfSafe(options = {}) {
  if (!options.challengeId) throw new Error('challengeId is required');
  const snap = await options.getDoc(getDocRef(options, 'challenges', options.challengeId));
  if (!snap.exists()) return { id: options.challengeId, deleted: false, reason: 'not_found' };
  const current = normalizeChallengeRecord(snap.data() || {});

  if (canHardDelete(current) && typeof options.deleteDoc === 'function') {
    await options.deleteDoc(getDocRef(options, 'challenges', options.challengeId));
    return { id: options.challengeId, deleted: true, mode: 'hard' };
  }

  await updateChallengeLifecycle({ ...options, lifecycleStatus: CHALLENGE_STATUS_ARCHIVED });
  return { id: options.challengeId, deleted: false, mode: 'soft_archive' };
}

export async function listTemplates(options = {}) {
  const snap = await options.getDocs(getCollectionRef(options, 'challengeTemplates'));
  return snap.docs.map((row) => normalizeTemplateRecord({ id: row.id, ...(row.data() || {}) }));
}

export async function getTemplateById(options = {}, templateId) {
  if (!templateId) throw new Error('templateId is required');
  const snap = await options.getDoc(getDocRef(options, 'challengeTemplates', templateId));
  if (!snap.exists()) return null;
  return normalizeTemplateRecord({ id: snap.id, ...(snap.data() || {}) });
}

export async function saveTemplate(options = {}) {
  const payload = normalizeTemplateRecord({
    ...(options.data || {}),
    updatedAt: options.now || new Date(),
    createdAt: options.createdAt || options.now || new Date(),
  });
  if (!payload.name) throw new Error('Template name is required');
  if (options.templateId) {
    await options.setDoc(getDocRef(options, 'challengeTemplates', options.templateId), payload, { merge: true });
    return { ...payload, id: options.templateId };
  }
  const ref = await options.addDoc(getCollectionRef(options, 'challengeTemplates'), payload);
  return { ...payload, id: ref.id };
}

export async function saveChallengeScreenConfig(options = {}) {
  const configId = options.configId || 'default';
  const payload = normalizeChallengeScreenConfig({
    ...(options.data || {}),
    updatedAt: options.now || new Date(),
    updatedBy: options.userId || null,
  });
  await options.setDoc(getDocRef(options, 'challengeScreenConfig', configId), payload, { merge: true });
  return { id: configId, ...payload };
}

export async function getChallengeScreenConfig(options = {}, configId = 'default') {
  const snap = await options.getDoc(getDocRef(options, 'challengeScreenConfig', configId));
  if (!snap.exists()) {
    return normalizeChallengeScreenConfig({
      title: 'Sfide',
      sections: [
        { id: 'weekly', title: 'Sfide settimanali', order: 0, isActive: true },
        { id: 'monthly', title: 'Sfide mensili', order: 1, isActive: true },
        { id: 'local_gym', title: 'Dalle tue palestre', order: 2, isActive: true },
        { id: 'sponsor', title: 'Sponsor', order: 3, isActive: true },
        { id: 'exploration', title: 'Esplorazione', order: 4, isActive: true },
      ],
    });
  }
  return normalizeChallengeScreenConfig(snap.data() || {});
}
