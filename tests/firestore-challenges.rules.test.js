const test = require('node:test');
const fs = require('node:fs/promises');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

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
    await setDoc(doc(db, 'users', 'ga2'), { role: 'gym_admin', gymManaged: 'gym2' });
    await setDoc(doc(db, 'users', 'u1'), { role: 'user' });
    await setDoc(doc(db, 'users', 'u2'), { role: 'user' });
    await setDoc(doc(db, 'gyms', 'gym1'), { owner: 'ga1' });
    await setDoc(doc(db, 'gyms', 'gym2'), { owner: 'ga2' });
    await setDoc(doc(db, 'gyms', 'gym1', 'members', 'u1'), { uid: 'u1', status: 'active' });
  });
}

async function seedRedemptions() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'rewardRedemptions', 'r_u1_unlocked'), {
      userId: 'u1',
      gymId: 'gym1',
      challengeInstanceId: 'c1',
      rewardId: 'reward_1',
      status: 'unlocked',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    });
    await setDoc(doc(db, 'rewardRedemptions', 'r_u1_claimed'), {
      userId: 'u1',
      gymId: 'gym1',
      challengeInstanceId: 'c1',
      rewardId: 'reward_1',
      status: 'claimed',
      claimedAt: '2026-04-02T00:10:00.000Z',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:10:00.000Z',
    });
    await setDoc(doc(db, 'rewardRedemptions', 'r_u2_claimed'), {
      userId: 'u2',
      gymId: 'gym2',
      challengeInstanceId: 'c2',
      rewardId: 'reward_2',
      status: 'claimed',
      claimedAt: '2026-04-02T00:10:00.000Z',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:10:00.000Z',
    });
  });
}

async function seedTemplates() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'challengeTemplates', 'tpl_standard'), {
      name: 'Standard',
      isSponsorTemplate: false,
      status: 'published',
    });
    await setDoc(doc(db, 'challengeTemplates', 'tpl_sponsor'), {
      name: 'Sponsor',
      isSponsorTemplate: true,
      status: 'published',
    });
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
    pointsValue: 50,
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
      pointsValue: 50,
      sponsorId: null,
    });
  });

  await assertSucceeds(getDoc(doc(authedDb('u1'), 'challenges', 'local1')));
});

test('standard user cannot write seasonal stats', async () => {
  await seedUsers();
  await assertFails(setDoc(doc(authedDb('u1'), 'userSeasonStats', 'u1_default'), {
    userId: 'u1',
    seasonId: 'default',
    totalPoints: 9000,
  }));
});

test('superadmin can perform gym challenge writes as superset of gym admin', async () => {
  await seedUsers();
  await assertSucceeds(setDoc(doc(authedDb('sa1'), 'challenges', 'sa_local1'), {
    title: 'SA Local',
    scope: 'gym',
    ownerType: 'gym_admin',
    gymId: 'gym1',
    status: 'published',
    isActive: true,
    rules: { metric: 'routes', target: 8 },
    pointsTier: 'small',
    pointsValue: 50,
    sponsorId: null,
  }));
});

test('user can claim only own unlocked redemption', async () => {
  await seedUsers();
  await seedRedemptions();
  await assertSucceeds(updateDoc(doc(authedDb('u1'), 'rewardRedemptions', 'r_u1_unlocked'), {
    status: 'claimed',
    claimedAt: '2026-04-02T00:20:00.000Z',
    updatedAt: '2026-04-02T00:20:00.000Z',
  }));
  await assertFails(updateDoc(doc(authedDb('u2'), 'rewardRedemptions', 'r_u1_unlocked'), {
    status: 'claimed',
    claimedAt: '2026-04-02T00:20:00.000Z',
    updatedAt: '2026-04-02T00:20:00.000Z',
  }));
});

test('user cannot promote claimed redemption to redeemed', async () => {
  await seedUsers();
  await seedRedemptions();
  await assertFails(updateDoc(doc(authedDb('u1'), 'rewardRedemptions', 'r_u1_claimed'), {
    status: 'redeemed',
    redeemedAt: '2026-04-02T00:30:00.000Z',
    updatedAt: '2026-04-02T00:30:00.000Z',
  }));
});

test('gym admin can act only on claimed redemption in managed gym', async () => {
  await seedUsers();
  await seedRedemptions();
  await assertSucceeds(updateDoc(doc(authedDb('ga1'), 'rewardRedemptions', 'r_u1_claimed'), {
    status: 'redeemed',
    redeemedAt: '2026-04-02T00:40:00.000Z',
    updatedAt: '2026-04-02T00:40:00.000Z',
  }));
  await assertFails(updateDoc(doc(authedDb('ga1'), 'rewardRedemptions', 'r_u2_claimed'), {
    status: 'rejected',
    updatedAt: '2026-04-02T00:40:00.000Z',
  }));
});

test('superadmin can manage claimed redemption across gyms', async () => {
  await seedUsers();
  await seedRedemptions();
  await assertSucceeds(updateDoc(doc(authedDb('sa1'), 'rewardRedemptions', 'r_u2_claimed'), {
    status: 'rejected',
    updatedAt: '2026-04-02T00:50:00.000Z',
  }));
});

test('template access is coherent: sponsor template blocked for standard user', async () => {
  await seedUsers();
  await seedTemplates();
  await assertSucceeds(getDoc(doc(authedDb('u1'), 'challengeTemplates', 'tpl_standard')));
  await assertFails(getDoc(doc(authedDb('u1'), 'challengeTemplates', 'tpl_sponsor')));
  await assertSucceeds(getDoc(doc(authedDb('ga1'), 'challengeTemplates', 'tpl_sponsor')));
});

test('gym challenge write with sponsor templateId is denied for gym admin', async () => {
  await seedUsers();
  await seedTemplates();
  await assertFails(setDoc(doc(authedDb('ga1'), 'challenges', 'local_sponsor_tpl'), {
    title: 'Invalid sponsor template for gym admin',
    scope: 'gym',
    ownerType: 'gym_admin',
    gymId: 'gym1',
    status: 'published',
    isActive: true,
    templateId: 'tpl_sponsor',
    rules: { metric: 'routes', target: 5 },
    pointsTier: 'small',
    pointsValue: 50,
    sponsorId: null,
  }));
});
