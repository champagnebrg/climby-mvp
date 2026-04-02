const test = require('node:test');
const assert = require('node:assert/strict');

test('global challenge keeps explicit display section and does not default by scope', async () => {
  const { normalizeChallengeRecord } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeRecord({
    title: 'Global monthly',
    scope: 'global',
    templateType: 'monthly_routes',
    displaySectionIds: ['monthly'],
  });

  assert.equal(row.scope, 'global');
  assert.deepEqual(row.displaySectionIds, ['monthly']);
});

test('lifecycle supports inactive and deleted states', async () => {
  const { buildChallengePayload } = await import('../src/features/challenges/challenge-model.js');
  const row = buildChallengePayload({
    title: 'Lifecycle',
    lifecycleStatus: 'inactive',
  }, { userId: 'sa1', now: new Date('2026-03-01T00:00:00.000Z') });

  assert.equal(row.status, 'inactive');
  assert.equal(row.lifecycleStatus, 'inactive');
  assert.equal(row.isActive, false);
});

test('tiered challenge mode normalizes milestones and target coherently', async () => {
  const { normalizeChallengeRecord } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeRecord({
    title: 'Tiered challenge',
    progressMode: 'tiered',
    progression: {
      tiers: [
        { id: 'silver', label: 'Argento', threshold: 20 },
        { id: 'bronze', label: 'Bronzo', threshold: 10 },
        { id: 'gold', label: 'Oro', threshold: 50 },
      ],
    },
  });

  assert.equal(row.progressMode, 'tiered');
  assert.deepEqual(row.progression.tiers.map((t) => t.id), ['bronze', 'silver', 'gold']);
  assert.equal(row.rules.target, 50);
  assert.equal(row.progression.tiers[0].pointsValue, 75);
});

test('single target challenge resolves CP from policy tier', async () => {
  const { normalizeChallengeRecord } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeRecord({
    title: 'Single',
    pointsTier: 'medium',
  });
  assert.equal(row.pointsValue, 120);
});

test('screen config keeps guided flags', async () => {
  const { normalizeChallengeScreenConfig } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeScreenConfig({
    title: 'Hub sfide',
    showEmptySections: false,
    sections: [{ id: 'weekly', title: 'Settimanali', isActive: true }],
  });

  assert.equal(row.showEmptySections, false);
  assert.equal(row.sections[0].id, 'weekly');
  assert.equal(row.season.isActive, true);
  assert.equal(row.rewards.badgeLabel, 'Badge Challenger');
});

test('legacy admin role is canonicalized to gym_admin', async () => {
  const { normalizeUserRole } = await import('../src/utils/core-normalizers.js');
  assert.equal(normalizeUserRole('admin'), 'gym_admin');
  assert.equal(normalizeUserRole('gym_admin'), 'gym_admin');
});

test('challenge rewardConfig falls back from legacy reward.label', async () => {
  const { normalizeChallengeRecord } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeRecord({
    title: 'Reward fallback',
    reward: { label: 'Birra gratis' },
  });
  assert.equal(row.rewardConfig.mode, 'single');
  assert.equal(row.rewardConfig.rewardId, null);
  assert.equal(row.rewardConfig.legacyLabel, 'Birra gratis');
});

test('superadmin inherits gym admin capability for gym challenges', async () => {
  const { canManageGymChallenges } = await import('../src/features/challenges/permissions.js');
  assert.equal(canManageGymChallenges({ role: 'superadmin' }, 'gym1'), true);
  assert.equal(canManageGymChallenges({ role: 'gym_admin', gymManaged: 'gym1' }, 'gym1'), true);
  assert.equal(canManageGymChallenges({ role: 'admin', gymManaged: 'gym1' }, 'gym1'), true);
  assert.equal(canManageGymChallenges({ role: 'gym_admin', gymManaged: 'gym2' }, 'gym1'), false);
});

test('reward model normalizes typed reward payload', async () => {
  const { normalizeRewardRecord } = await import('../src/features/challenges/reward-model.js');
  const row = normalizeRewardRecord({
    type: 'gym_beer',
    providerType: 'gym',
    providerId: 'gym1',
    claimMode: 'qr',
    title: 'Birra gratis',
    description: 'Una birra al bar',
  });
  assert.equal(row.type, 'gym_beer');
  assert.equal(row.providerType, 'gym');
  assert.equal(row.providerId, 'gym1');
  assert.equal(row.claimMode, 'qr');
  assert.equal(row.title, 'Birra gratis');
  assert.equal(row.status, 'active');
});


test('challenge rewardConfig keeps explicit rewardId and legacy label compatibility', async () => {
  const { normalizeChallengeRecord } = await import('../src/features/challenges/challenge-model.js');
  const row = normalizeChallengeRecord({
    title: 'Reward id support',
    rewardConfig: { rewardId: 'reward_abc' },
    reward: { label: 'Premio legacy' },
  });
  assert.equal(row.rewardConfig.mode, 'single');
  assert.equal(row.rewardConfig.rewardId, 'reward_abc');
  assert.equal(row.rewardConfig.legacyLabel, 'Premio legacy');
});

test('computeChallengeProgress prefers canonical backend progress when available', async () => {
  const { computeChallengeProgress } = await import('../src/features/challenges/challenge-ui.js');
  const progress = computeChallengeProgress({
    rules: { metric: 'routes', target: 20 },
    canonicalProgress: { value: 12, target: 30, status: 'in_progress' },
  }, { routes: 99 });
  assert.equal(progress.value, 12);
  assert.equal(progress.target, 30);
});

test('computeChallengeProgress falls back to client metric map when canonical progress is absent', async () => {
  const { computeChallengeProgress } = await import('../src/features/challenges/challenge-ui.js');
  const progress = computeChallengeProgress({
    rules: { metric: 'routes', target: 20 },
  }, { routes: 7 });
  assert.equal(progress.value, 7);
  assert.equal(progress.target, 20);
});

test('permissions canonicalize legacy admin to gym_admin role', async () => {
  const { canonicalizeRole, canManageGymChallenges } = await import('../src/features/challenges/permissions.js');
  assert.equal(canonicalizeRole('admin'), 'gym_admin');
  assert.equal(canManageGymChallenges({ role: 'admin', gymManaged: 'gym1' }, 'gym1'), true);
});
