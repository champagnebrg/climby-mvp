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
