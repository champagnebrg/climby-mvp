const test = require('node:test');
const assert = require('node:assert/strict');

function createInMemoryDeps(rows = []) {
  const docs = rows.map((row) => ({ id: row.id, data: () => ({ ...row }) }));
  return {
    db: {},
    collection: (_db, name) => ({ name }),
    doc: (_db, name, id) => ({ name, id }),
    query: (ref) => ref,
    where: () => ({}),
    getDoc: async () => ({ exists: () => false, data: () => null }),
    getDocs: async () => ({ docs }),
    setDoc: async () => undefined,
    addDoc: async () => ({ id: 'x1' }),
  };
}

test('getUserChallengeProgress returns rows for selected user', async () => {
  const { getUserChallengeProgress } = await import('../src/features/challenges/challenge-repository.js');
  const deps = createInMemoryDeps([
    { id: 'p1', userId: 'u1', challengeId: 'c1', value: 4 },
    { id: 'p2', userId: 'u2', challengeId: 'c2', value: 8 },
  ]);
  const rows = await getUserChallengeProgress(deps, 'u1');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].challengeId, 'c1');
});

test('mergeChallengesWithProgress attaches canonical progress to matching challenge', async () => {
  const { mergeChallengesWithProgress } = await import('../src/features/challenges/challenge-repository.js');
  const merged = mergeChallengesWithProgress(
    [{ id: 'c1', title: 'Challenge 1' }, { id: 'c2', title: 'Challenge 2' }],
    [{ challengeId: 'c2', value: 9, target: 12, status: 'in_progress' }]
  );

  assert.equal(merged[0].canonicalProgress, null);
  assert.equal(merged[1].canonicalProgress.value, 9);
});
