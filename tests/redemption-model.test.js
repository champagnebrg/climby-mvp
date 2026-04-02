const test = require('node:test');
const assert = require('node:assert/strict');

test('normalizeRedemption applies defaults', async () => {
  const { normalizeRedemption } = await import('../src/features/challenges/redemption-model.js');
  const row = normalizeRedemption({
    userId: 'u1',
    challengeInstanceId: 'c1',
    rewardId: 'r1',
  });
  assert.equal(row.status, 'locked');
  assert.equal(row.claimMode, 'manual');
  assert.equal(row.userId, 'u1');
});

test('canTransitionRedemption validates allowed transitions', async () => {
  const { canTransitionRedemption } = await import('../src/features/challenges/redemption-model.js');
  assert.equal(canTransitionRedemption('locked', 'unlocked'), true);
  assert.equal(canTransitionRedemption('unlocked', 'claimed'), true);
  assert.equal(canTransitionRedemption('claimed', 'redeemed'), true);
  assert.equal(canTransitionRedemption('unlocked', 'expired'), true);
  assert.equal(canTransitionRedemption('claimed', 'expired'), true);
  assert.equal(canTransitionRedemption('claimed', 'rejected'), true);

  assert.equal(canTransitionRedemption('locked', 'redeemed'), false);
  assert.equal(canTransitionRedemption('redeemed', 'claimed'), false);
});

