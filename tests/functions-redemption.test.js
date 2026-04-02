const test = require('node:test');
const assert = require('node:assert/strict');

test('buildUnlockedRedemptionPayload creates unlocked redemption payload', async () => {
  const { buildUnlockedRedemptionPayload } = await import('../functions/redemption-utils.js');
  const payload = buildUnlockedRedemptionPayload({
    uid: 'u1',
    seasonId: 's1',
    challengeId: 'c1',
    rewardId: 'r1',
    gymId: 'gym1',
    nowIso: '2026-04-02T00:00:00.000Z',
    claimMode: 'qr',
  });
  assert.equal(payload.userId, 'u1');
  assert.equal(payload.challengeInstanceId, 'c1');
  assert.equal(payload.rewardId, 'r1');
  assert.equal(payload.gymId, 'gym1');
  assert.equal(payload.status, 'unlocked');
  assert.equal(payload.unlockAt, '2026-04-02T00:00:00.000Z');
  assert.equal(payload.claimMode, 'qr');
});

test('buildRedemptionDocId is deterministic for idempotent upsert behavior', async () => {
  const { buildRedemptionDocId } = await import('../functions/redemption-utils.js');
  const idA = buildRedemptionDocId('u1', 's1', 'c1', 'r1');
  const idB = buildRedemptionDocId('u1', 's1', 'c1', 'r1');
  const idC = buildRedemptionDocId('u1', 's1', 'c1', 'r2');
  assert.equal(idA, idB);
  assert.notEqual(idA, idC);
});

test('buildUnlockedRedemptionCandidate returns candidate only when challenge is completed with rewardId', async () => {
  const { buildUnlockedRedemptionCandidate } = await import('../functions/redemption-utils.js');

  const missingReward = buildUnlockedRedemptionCandidate({
    uid: 'u1',
    seasonId: 's1',
    challengeId: 'c1',
    completed: true,
    rewardId: null,
    nowIso: '2026-04-02T00:00:00.000Z',
  });
  assert.equal(missingReward, null);

  const notCompleted = buildUnlockedRedemptionCandidate({
    uid: 'u1',
    seasonId: 's1',
    challengeId: 'c1',
    completed: false,
    rewardId: 'r1',
    nowIso: '2026-04-02T00:00:00.000Z',
  });
  assert.equal(notCompleted, null);

  const candidate = buildUnlockedRedemptionCandidate({
    uid: 'u1',
    seasonId: 's1',
    challengeId: 'c1',
    completed: true,
    rewardId: 'r1',
    gymId: 'gym1',
    nowIso: '2026-04-02T00:00:00.000Z',
  });

  assert.equal(candidate.redemptionId, 'u1_s1_c1_r1');
  assert.equal(candidate.payload.status, 'unlocked');
  assert.equal(candidate.payload.rewardId, 'r1');
  assert.equal(candidate.payload.gymId, 'gym1');
});
