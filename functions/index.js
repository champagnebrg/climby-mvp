import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { buildUnlockedRedemptionCandidate } from './redemption-utils.js';

initializeApp();

const POINTS_BY_TIER = Object.freeze({
  small: 50,
  medium: 120,
  large: 250,
});

const DEFAULT_LEVELS = Object.freeze([
  { level: 1, pointsRequired: 0 },
  { level: 2, pointsRequired: 200 },
  { level: 3, pointsRequired: 500 },
  { level: 4, pointsRequired: 900 },
  { level: 5, pointsRequired: 1400 },
]);

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

async function resolveActiveSeason(db) {
  const activeSnap = await db.collection('seasons').where('status', '==', 'active').limit(1).get();
  if (!activeSnap.empty) {
    const doc = activeSnap.docs[0];
    return { id: doc.id, ...(doc.data() || {}) };
  }
  const nowIso = new Date().toISOString();
  const fallback = {
    name: 'Season 1',
    status: 'active',
    startsAt: nowIso,
    endsAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await db.collection('seasons').doc('default').set(fallback, { merge: true });
  return { id: 'default', ...fallback };
}

function getLevelFromThresholds(points = 0, levels = []) {
  const rows = Array.isArray(levels) && levels.length ? levels : DEFAULT_LEVELS;
  const sorted = [...rows].sort((a, b) => Number(a.pointsRequired || 0) - Number(b.pointsRequired || 0));
  let current = sorted[0] || { level: 1, pointsRequired: 0 };
  for (const row of sorted) {
    if (points >= Number(row.pointsRequired || 0)) current = row;
  }
  const next = sorted.find((row) => Number(row.pointsRequired || 0) > points) || null;
  return {
    currentLevel: Number(current.level || 1),
    currentLevelMinPoints: Number(current.pointsRequired || 0),
    nextLevel: next ? Number(next.level || current.level || 1) : null,
    pointsToNextLevel: next ? Math.max(0, Number(next.pointsRequired || 0) - points) : 0,
  };
}

function evaluateTieredMilestones(challenge = {}, current = 0) {
  const tiers = Array.isArray(challenge?.progression?.tiers) ? challenge.progression.tiers : [];
  return tiers
    .map((tier, index) => ({
      id: String(tier?.id || `tier_${index + 1}`),
      threshold: Math.max(1, Number(tier?.threshold) || 1),
      points: Math.max(0, Number(tier?.pointsValue) || 0),
    }))
    .filter((tier) => current >= tier.threshold && tier.points > 0);
}

export const onRouteProgressWriteAwardChallenges = onDocumentWritten('users/{uid}/routeProgress/{progressId}', async (event) => {
  const uid = event.params.uid;
  if (!uid) return;
  const db = getFirestore();
  const nowIso = new Date().toISOString();

  const [season, progressSnap, challengesSnap, levelConfigSnap] = await Promise.all([
    resolveActiveSeason(db),
    db.collection('users').doc(uid).collection('routeProgress').get(),
    db.collection('challenges').where('status', '==', 'published').where('isActive', '==', true).get(),
    db.collection('levelConfig').doc('default').get(),
  ]);

  const progressRows = progressSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  const metrics = getProgressMetric(progressRows);
  const levels = levelConfigSnap.exists ? (levelConfigSnap.data()?.levels || DEFAULT_LEVELS) : DEFAULT_LEVELS;

  const batch = db.batch();
  let pointsDelta = 0;
  const ledgerCandidates = [];
  const redemptionCandidates = [];

  for (const challengeDoc of challengesSnap.docs) {
    const challenge = { id: challengeDoc.id, ...(challengeDoc.data() || {}) };
    const metricKey = String(challenge?.rules?.metric || 'routes');
    const target = Math.max(1, Number(challenge?.rules?.target) || 1);
    const current = Number(metrics[metricKey] || 0);
    const completed = current >= target;
    const progressRef = db.collection('userChallengeProgress').doc(`${uid}_${challenge.id}`);
    const progressMode = challenge?.progressMode === 'tiered' ? 'tiered' : 'single_target';

    batch.set(progressRef, {
      userId: uid,
      challengeId: challenge.id,
      seasonId: season.id,
      status: completed ? 'completed' : 'in_progress',
      metric: metricKey,
      value: current,
      target,
      progressMode,
      updatedAt: nowIso,
    }, { merge: true });

    const awardCandidates = [];
    if (progressMode === 'tiered') {
      for (const tier of evaluateTieredMilestones(challenge, current)) {
        awardCandidates.push({
          awardKey: `${uid}_${season.id}_${challenge.id}_${tier.id}`,
          points: tier.points,
          tierId: tier.id,
        });
      }
    } else if (completed) {
      const points = Number.isFinite(Number(challenge.pointsValue))
        ? Math.max(0, Number(challenge.pointsValue))
        : (POINTS_BY_TIER[challenge.pointsTier] || 0);
      if (points > 0) {
        awardCandidates.push({
          awardKey: `${uid}_${season.id}_${challenge.id}_completion`,
          points,
          tierId: null,
        });
      }
    }

    const rewardCandidate = buildUnlockedRedemptionCandidate({
      uid,
      seasonId: season.id,
      challengeId: challenge.id,
      completed,
      rewardId: challenge?.rewardConfig?.rewardId || null,
      gymId: challenge?.gymId || (Array.isArray(challenge?.gymIds) ? challenge.gymIds[0] : null) || null,
      nowIso,
      claimMode: 'manual',
    });
    if (rewardCandidate) redemptionCandidates.push(rewardCandidate);

    for (const candidate of awardCandidates) {
      ledgerCandidates.push({
        ...candidate,
        challengeId: challenge.id,
      });
    }
  }

  if (ledgerCandidates.length) {
    const refs = ledgerCandidates.map((candidate) => db.collection('pointsLedger').doc(candidate.awardKey));
    const existing = await db.getAll(...refs);
    ledgerCandidates.forEach((candidate, index) => {
      if (existing[index]?.exists) return;
      const ledgerRef = refs[index];
      batch.create(ledgerRef, {
        userId: uid,
        seasonId: season.id,
        challengeId: candidate.challengeId,
        milestoneId: candidate.tierId,
        points: candidate.points,
        pointType: 'CP',
        awardedAt: nowIso,
      });
      pointsDelta += candidate.points;
    });
  }

  if (redemptionCandidates.length) {
    const refs = redemptionCandidates.map((candidate) => db.collection('rewardRedemptions').doc(candidate.redemptionId));
    const existing = await db.getAll(...refs);
    redemptionCandidates.forEach((candidate, index) => {
      if (existing[index]?.exists) return;
      batch.create(refs[index], candidate.payload);
    });
  }

  if (pointsDelta > 0) {
    const statsRef = db.collection('userSeasonStats').doc(`${uid}_${season.id}`);
    const statsSnap = await statsRef.get();
    const currentPoints = statsSnap.exists ? Math.max(0, Number(statsSnap.data()?.totalPoints || 0)) : 0;
    const nextPoints = currentPoints + pointsDelta;
    const levelMeta = getLevelFromThresholds(nextPoints, levels);
    batch.set(statsRef, {
      userId: uid,
      seasonId: season.id,
      pointType: 'CP',
      totalPoints: FieldValue.increment(pointsDelta),
      currentLevel: levelMeta.currentLevel,
      nextLevel: levelMeta.nextLevel,
      pointsToNextLevel: levelMeta.pointsToNextLevel,
      updatedAt: nowIso,
      createdAt: statsSnap.exists ? (statsSnap.data()?.createdAt || nowIso) : nowIso,
    }, { merge: true });
  }

  await batch.commit();
});
