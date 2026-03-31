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
});
