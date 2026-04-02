const test = require('node:test');
const assert = require('node:assert/strict');

function createInMemoryDeps() {
  const store = new Map();

  const keyFor = (id) => `rewardRedemptions/${id}`;

  return {
    db: {},
    collection: (_db, name) => ({ name }),
    doc: (_db, name, id) => ({ name, id }),
    getDoc: async (ref) => {
      const value = store.get(keyFor(ref.id));
      return {
        id: ref.id,
        exists: () => Boolean(value),
        data: () => (value ? { ...value } : undefined),
      };
    },
    setDoc: async (ref, payload, options = {}) => {
      const current = store.get(keyFor(ref.id)) || {};
      store.set(keyFor(ref.id), options.merge ? { ...current, ...payload } : { ...payload });
    },
    addDoc: async (_collectionRef, payload) => {
      const id = `redemption-${store.size + 1}`;
      store.set(keyFor(id), { ...payload });
      return { id };
    },
    getDocs: async () => ({
      docs: [...store.entries()].map(([path, data]) => ({
        id: path.split('/')[1],
        data: () => ({ ...data }),
      })),
    }),
    query: (ref) => ref,
    where: () => ({}),
  };
}

test('createRedemption enforces required fields and defaults', async () => {
  const { createRedemption } = await import('../src/features/challenges/redemption-repository.js');
  const deps = createInMemoryDeps();

  await assert.rejects(() => createRedemption({ ...deps, data: { userId: 'u1' } }), /required/);

  const created = await createRedemption({
    ...deps,
    data: { userId: 'u1', challengeInstanceId: 'c1', rewardId: 'r1' },
  });

  assert.equal(created.status, 'locked');
  assert.equal(created.id, 'redemption-1');
});

test('updateRedemptionStatus accepts valid transitions and rejects invalid ones', async () => {
  const { createRedemption, updateRedemptionStatus } = await import('../src/features/challenges/redemption-repository.js');
  const deps = createInMemoryDeps();

  const created = await createRedemption({
    ...deps,
    data: { id: 'rr-1', userId: 'u1', challengeInstanceId: 'c1', rewardId: 'r1', status: 'unlocked' },
  });

  assert.equal(created.id, 'rr-1');

  const claimed = await updateRedemptionStatus({ ...deps, id: 'rr-1', newStatus: 'claimed' });
  assert.equal(claimed.status, 'claimed');
  assert.ok(claimed.claimedAt);

  const redeemed = await updateRedemptionStatus({ ...deps, id: 'rr-1', newStatus: 'redeemed' });
  assert.equal(redeemed.status, 'redeemed');
  assert.ok(redeemed.redeemedAt);

  await assert.rejects(
    () => updateRedemptionStatus({ ...deps, id: 'rr-1', newStatus: 'claimed' }),
    /invalid redemption transition/
  );
});

test('updateRedemptionStatus supports claimed to rejected transition for admin queue flow', async () => {
  const { createRedemption, updateRedemptionStatus } = await import('../src/features/challenges/redemption-repository.js');
  const deps = createInMemoryDeps();
  await createRedemption({
    ...deps,
    data: { id: 'rr-2', userId: 'u2', challengeInstanceId: 'c2', rewardId: 'r2', status: 'claimed' },
  });

  const rejected = await updateRedemptionStatus({ ...deps, id: 'rr-2', newStatus: 'rejected' });
  assert.equal(rejected.status, 'rejected');
});

test('getClaimedRedemptions sorts queue by claimedAt or updatedAt descending', async () => {
  const { createRedemption, getClaimedRedemptions } = await import('../src/features/challenges/redemption-repository.js');
  const deps = createInMemoryDeps();
  await createRedemption({
    ...deps,
    data: {
      id: 'old-claimed',
      userId: 'u1',
      challengeInstanceId: 'c1',
      rewardId: 'r1',
      status: 'claimed',
      claimedAt: '2026-04-01T08:00:00.000Z',
    },
  });
  await createRedemption({
    ...deps,
    data: {
      id: 'latest-updated',
      userId: 'u2',
      challengeInstanceId: 'c2',
      rewardId: 'r2',
      status: 'claimed',
      updatedAt: '2026-04-01T12:00:00.000Z',
    },
  });
  await createRedemption({
    ...deps,
    data: {
      id: 'newest-claimed',
      userId: 'u3',
      challengeInstanceId: 'c3',
      rewardId: 'r3',
      status: 'claimed',
      claimedAt: '2026-04-01T10:00:00.000Z',
    },
  });

  const rows = await getClaimedRedemptions(deps);
  assert.deepEqual(rows.map((row) => row.id), ['latest-updated', 'newest-claimed', 'old-claimed']);
});
