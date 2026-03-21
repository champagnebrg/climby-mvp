const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } = require('firebase/firestore');

const projectId = 'climby-rules-test';
const rulesPath = new URL('../rules_firestore.txt', `file://${__filename}`).pathname;

let testEnv;

test.before(async () => {
  const rules = await fs.readFile(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
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

async function seedCompetitionLive({ competitionStatus = 'live' } = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'admin1'), {
      role: 'gym_admin',
      gymManaged: 'gym1',
    });
    await setDoc(doc(db, 'users', 'user1'), {
      role: 'user',
    });
    await setDoc(doc(db, 'users', 'user2'), {
      role: 'user',
    });
    await setDoc(doc(db, 'gyms', 'gym1'), {
      owner: 'owner1',
    });
    await setDoc(doc(db, 'gyms', 'gym1', 'events', 'event1'), {
      competition_live: {
        enabled: true,
        status: competitionStatus,
      },
    });
  });
}

function buildEntryPayload({ userId = 'user1', score = 1, completedRouteIds = ['route-1'] } = {}) {
  return {
    eventId: 'event1',
    gymId: 'gym1',
    userId,
    status: 'active',
    score,
    completedRouteIds,
    completedBySector: {
      sectorA: completedRouteIds,
    },
    createdAt: '2026-03-21T00:00:00.000Z',
    updatedAt: '2026-03-21T00:00:00.000Z',
  };
}

test('admin/manageGym can list competitionLiveEntries', async () => {
  await seedCompetitionLive();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload()
    );
  });

  await assertSucceeds(
    getDocs(collection(authedDb('admin1'), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries'))
  );
});

test('standard user cannot list competitionLiveEntries', async () => {
  await seedCompetitionLive();

  await assertFails(
    getDocs(collection(authedDb('user1'), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries'))
  );
});

test('owner user can read only own competitionLiveEntry', async () => {
  await seedCompetitionLive();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'), buildEntryPayload({ userId: 'user1' }));
    await setDoc(doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user2'), buildEntryPayload({ userId: 'user2' }));
  });

  await assertSucceeds(
    getDoc(doc(authedDb('user1'), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'))
  );
  await assertFails(
    getDoc(doc(authedDb('user1'), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user2'))
  );
});

test('create and update are allowed when competition live is not closed', async () => {
  await seedCompetitionLive({ competitionStatus: 'live' });
  const db = authedDb('user1');

  await assertSucceeds(
    setDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 1, completedRouteIds: ['route-1'] })
    )
  );

  await assertSucceeds(
    updateDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      {
        score: 2,
        completedRouteIds: ['route-1', 'route-2'],
        completedBySector: { sectorA: ['route-1', 'route-2'] },
        updatedAt: '2026-03-21T01:00:00.000Z',
      }
    )
  );
});

test('create and update are rejected when competition live is closed', async () => {
  await seedCompetitionLive({ competitionStatus: 'closed' });
  const db = authedDb('user1');

  await assertFails(
    setDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 1, completedRouteIds: ['route-1'] })
    )
  );

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 1, completedRouteIds: ['route-1'] })
    );
  });

  await assertFails(
    updateDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      {
        score: 2,
        completedRouteIds: ['route-1', 'route-2'],
        completedBySector: { sectorA: ['route-1', 'route-2'] },
        updatedAt: '2026-03-21T01:00:00.000Z',
      }
    )
  );
});

test('create and update are rejected when score does not match completedRouteIds length', async () => {
  await seedCompetitionLive({ competitionStatus: 'live' });
  const db = authedDb('user1');

  await assertFails(
    setDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 99, completedRouteIds: ['route-1'] })
    )
  );

  await assertSucceeds(
    setDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 1, completedRouteIds: ['route-1'] })
    )
  );

  await assertFails(
    updateDoc(
      doc(db, 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      {
        score: 7,
        completedRouteIds: ['route-1', 'route-2'],
        completedBySector: { sectorA: ['route-1', 'route-2'] },
        updatedAt: '2026-03-21T01:00:00.000Z',
      }
    )
  );
});

test('delete is rejected when competition live is closed', async () => {
  await seedCompetitionLive({ competitionStatus: 'closed' });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'),
      buildEntryPayload({ userId: 'user1', score: 1, completedRouteIds: ['route-1'] })
    );
  });

  await assertFails(
    deleteDoc(doc(authedDb('user1'), 'gyms', 'gym1', 'events', 'event1', 'competitionLiveEntries', 'user1'))
  );
});

test('sanity check', () => {
  assert.equal(typeof buildEntryPayload, 'function');
});
