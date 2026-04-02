export function buildRedemptionDocId(uid, seasonId, challengeId, rewardId) {
  return `${uid}_${seasonId}_${challengeId}_${rewardId}`;
}

export function buildUnlockedRedemptionPayload({ uid, seasonId, challengeId, rewardId, gymId = null, nowIso, claimMode = 'manual' } = {}) {
  return {
    userId: uid,
    seasonId,
    gymId,
    challengeInstanceId: challengeId,
    rewardId,
    status: 'unlocked',
    unlockAt: nowIso,
    claimMode,
    verificationData: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function buildUnlockedRedemptionCandidate({ uid, seasonId, challengeId, completed, rewardId, gymId = null, nowIso, claimMode = 'manual' } = {}) {
  if (!completed) return null;
  if (!uid || !seasonId || !challengeId || !rewardId) return null;

  return {
    redemptionId: buildRedemptionDocId(uid, seasonId, challengeId, rewardId),
    payload: buildUnlockedRedemptionPayload({ uid, seasonId, challengeId, rewardId, gymId, nowIso, claimMode }),
  };
}
