import {
  REDEMPTION_STATUS_CLAIMED,
  REDEMPTION_STATUS_EXPIRED,
  REDEMPTION_STATUS_REDEEMED,
  canTransitionRedemption,
  normalizeRedemption,
} from './redemption-model.js';

function ensureDeps(options = {}) {
  const { db, collection, doc, query, where, getDoc, getDocs, setDoc, addDoc } = options;
  if (!db) throw new Error('Redemption repository requires db');
  if (typeof collection !== 'function') throw new Error('Redemption repository requires collection()');
  if (typeof doc !== 'function') throw new Error('Redemption repository requires doc()');
  if (typeof getDoc !== 'function') throw new Error('Redemption repository requires getDoc()');
  if (typeof getDocs !== 'function') throw new Error('Redemption repository requires getDocs()');
  if (typeof setDoc !== 'function') throw new Error('Redemption repository requires setDoc()');
  if (typeof addDoc !== 'function') throw new Error('Redemption repository requires addDoc()');
  if (query && typeof query !== 'function') throw new Error('Redemption repository query must be function');
  if (where && typeof where !== 'function') throw new Error('Redemption repository where must be function');
}

function getCollectionRef(options = {}, name) {
  ensureDeps(options);
  return options.collection(options.db, name);
}

function getDocRef(options = {}, name, id) {
  ensureDeps(options);
  return options.doc(options.db, name, id);
}

export async function createRedemption(options = {}) {
  const payload = normalizeRedemption(options.data || {});
  if (!payload.userId || !payload.challengeInstanceId || !payload.rewardId) {
    throw new Error('userId, challengeInstanceId and rewardId are required');
  }
  if (payload.id) {
    await options.setDoc(getDocRef(options, 'rewardRedemptions', payload.id), payload, { merge: true });
    return payload;
  }
  const ref = await options.addDoc(getCollectionRef(options, 'rewardRedemptions'), payload);
  return { ...payload, id: ref.id };
}

function applySimpleFilter(options = {}, field, value) {
  const baseRef = getCollectionRef(options, 'rewardRedemptions');
  if (typeof options.query === 'function' && typeof options.where === 'function') {
    return options.query(baseRef, options.where(field, '==', value));
  }
  return baseRef;
}

function applyFilters(options = {}, filters = []) {
  const baseRef = getCollectionRef(options, 'rewardRedemptions');
  if (typeof options.query === 'function' && typeof options.where === 'function' && filters.length) {
    return options.query(baseRef, ...filters.map((entry) => options.where(entry.field, '==', entry.value)));
  }
  return baseRef;
}

export async function getUserRedemptions(options = {}, userId) {
  if (!userId) throw new Error('userId is required');
  const snap = await options.getDocs(applySimpleFilter(options, 'userId', userId));
  return snap.docs
    .map((row) => normalizeRedemption({ id: row.id, ...(row.data() || {}) }))
    .filter((row) => row.userId === userId);
}

export async function getChallengeRedemptions(options = {}, challengeInstanceId) {
  if (!challengeInstanceId) throw new Error('challengeInstanceId is required');
  const snap = await options.getDocs(applySimpleFilter(options, 'challengeInstanceId', challengeInstanceId));
  return snap.docs
    .map((row) => normalizeRedemption({ id: row.id, ...(row.data() || {}) }))
    .filter((row) => row.challengeInstanceId === challengeInstanceId);
}

export async function getClaimedRedemptions(options = {}) {
  const filters = [{ field: 'status', value: 'claimed' }];
  if (options.gymId) filters.push({ field: 'gymId', value: options.gymId });
  const snap = await options.getDocs(applyFilters(options, filters));
  return snap.docs
    .map((row) => normalizeRedemption({ id: row.id, ...(row.data() || {}) }))
    .filter((row) => row.status === 'claimed' && (!options.gymId || row.gymId === options.gymId))
    .sort((a, b) => new Date(b.claimedAt || b.updatedAt || 0).getTime() - new Date(a.claimedAt || a.updatedAt || 0).getTime());
}

export async function updateRedemptionStatus(options = {}) {
  const redemptionId = options.id;
  if (!redemptionId) throw new Error('id is required');
  const newStatus = options.newStatus;
  const extraData = options.extraData || {};
  const snap = await options.getDoc(getDocRef(options, 'rewardRedemptions', redemptionId));
  if (!snap.exists()) throw new Error('redemption not found');
  const current = normalizeRedemption({ id: snap.id, ...(snap.data() || {}) });
  if (!canTransitionRedemption(current.status, newStatus)) {
    throw new Error(`invalid redemption transition ${current.status} -> ${newStatus}`);
  }

  const nowIso = new Date().toISOString();
  const payload = {
    status: newStatus,
    updatedAt: nowIso,
    verificationData: extraData.verificationData || current.verificationData || null,
  };
  if (newStatus === REDEMPTION_STATUS_CLAIMED) payload.claimedAt = nowIso;
  if (newStatus === REDEMPTION_STATUS_REDEEMED) payload.redeemedAt = nowIso;
  if (newStatus === REDEMPTION_STATUS_EXPIRED) payload.expireAt = nowIso;

  await options.setDoc(getDocRef(options, 'rewardRedemptions', redemptionId), payload, { merge: true });
  return normalizeRedemption({ ...current, ...payload });
}
