import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

const POINTS_BY_TIER = Object.freeze({
  small: 50,
  medium: 120,
  large: 250,
});

function getProgressMetric(routeProgressDocs = []) {
  const climbed = routeProgressDocs.filter((row) => row.state === 'climbed');
  const days = new Set();
  const sectors = new Set();
  const gyms = new Set();

  routeProgressDocs.forEach((row) => {
    const dt = new Date(row.eventDate || row.updatedAt || row.createdAt || Date.now());
    if (!Number.isNaN(dt.getTime())) days.add(dt.toISOString().slice(0, 10));
    if (row.sectorId) sectors.add(String(row.sectorId));
    if (row.gymId) gyms.add(String(row.gymId));
  });

  return {
    routes: climbed.length,
    days: days.size,
    sectors: sectors.size,
    gyms: gyms.size,
  };
}

export const onRouteProgressWriteAwardChallenges = onDocumentWritten('users/{uid}/routeProgress/{progressId}', async (event) => {
  const uid = event.params.uid;
  if (!uid) return;
  const db = getFirestore();

  const [progressSnap, challengesSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('routeProgress').get(),
    db.collection('challenges').where('status', '==', 'published').where('isActive', '==', true).get(),
  ]);

  const progressRows = progressSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  const metrics = getProgressMetric(progressRows);

  const batch = db.batch();
  for (const challengeDoc of challengesSnap.docs) {
    const challenge = { id: challengeDoc.id, ...(challengeDoc.data() || {}) };
    const metricKey = String(challenge?.rules?.metric || 'routes');
    const target = Math.max(1, Number(challenge?.rules?.target) || 1);
    const current = Number(metrics[metricKey] || 0);
    const completed = current >= target;
    const points = completed ? (POINTS_BY_TIER[challenge.pointsTier] || 0) : 0;

    const progressRef = db.collection('userChallengeProgress').doc(`${uid}_${challenge.id}`);
    batch.set(progressRef, {
      userId: uid,
      challengeId: challenge.id,
      status: completed ? 'completed' : 'in_progress',
      metric: metricKey,
      value: current,
      target,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (completed && points > 0) {
      const ledgerRef = db.collection('pointsLedger').doc(`${uid}_${challenge.id}`);
      batch.set(ledgerRef, {
        userId: uid,
        challengeId: challenge.id,
        points,
        pointsTier: challenge.pointsTier || 'small',
        awardedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  await batch.commit();
});
