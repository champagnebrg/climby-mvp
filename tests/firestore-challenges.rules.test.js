const test = require('node:test');
const fs = require('node:fs/promises');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('firebase/firestore');

const projectId = 'climby-rules-test-challenges';
const rulesPath = new URL('../rules_firestore.txt', `file://${__filename}`).pathname;

let testEnv;

test.before(async () => {
  const rules = await fs.readFile(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

function authedDb(uid, claims = {}) {
  return testEnv.authenticatedContext(uid, { email_verified: true, ...claims }).firestore();
}

async function seedUsers() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'sa1'), { role: 'superadmin' });
    await setDoc(doc(db, 'users', 'ga1'), { role: 'gym_admin', gymManaged: 'gym1' });
    await setDoc(doc(db, 'users', 'u1'), { role: 'user' });
    await setDoc(doc(db, 'gyms', 'gym1'), { owner: 'ga1' });
    await setDoc(doc(db, 'gyms', 'gym1', 'members', 'u1'), { uid: 'u1', status: 'active' });
  });
}

test('superadmin can create global challenge', async () => {
  await seedUsers();
  await assertSucceeds(setDoc(doc(authedDb('sa1'), 'challenges', 'global1'), {
    title: 'Weekly',
    scope: 'global',
    ownerType: 'superadmin',
    status: 'published',
    isActive: true,
    rules: { metric: 'routes', target: 5 },
    pointsTier: 'small',
    pointsValue: 50,
  }));
});

test('gym admin can create only local challenge without arbitrary points', async () => {
  await seedUsers();
  await assertSucceeds(setDoc(doc(authedDb('ga1'), 'challenges', 'local1'), {
    title: 'Local',
    scope: 'gym',
    ownerType: 'gym_admin',
    gymId: 'gym1',
    status: 'published',
    isActive: true,
    rules: { metric: 'routes', target: 5 },
    pointsTier: 'small',
    pointsValue: null,
    sponsorId: null,
  }));

  await assertFails(setDoc(doc(authedDb('ga1'), 'challenges', 'local2'), {
    title: 'Cheat points',
    scope: 'gym',
    ownerType: 'gym_admin',
    gymId: 'gym1',
    status: 'published',
    isActive: true,
    rules: { metric: 'routes', target: 5 },
    pointsTier: 'large',
    pointsValue: 9999,
    sponsorId: null,
  }));
});

test('standard user cannot write points ledger', async () => {
  await seedUsers();
  await assertFails(setDoc(doc(authedDb('u1'), 'pointsLedger', 'x1'), {
    userId: 'u1',
    challengeId: 'c1',
    points: 999,
  }));
});

test('member can read published gym challenge', async () => {
  await seedUsers();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'challenges', 'local1'), {
      title: 'Local',
      scope: 'gym',
      ownerType: 'gym_admin',
      gymId: 'gym1',
      status: 'published',
      isActive: true,
      rules: { metric: 'routes', target: 5 },
      pointsTier: 'small',
      pointsValue: null,
      sponsorId: null,
    });
  });

  await assertSucceeds(getDoc(doc(authedDb('u1'), 'challenges', 'local1')));
});
