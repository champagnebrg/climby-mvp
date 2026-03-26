import { normalizeLevelValue } from "./core-normalizers.js";
import { toYYYYMMDD } from "./format.js";

export function gradeSystemArrayToMap(gradeSystem) {
  const map = new Map();
  (Array.isArray(gradeSystem) ? gradeSystem : []).forEach(item => {
    const label = normalizeLevelValue(item?.label);
    const order = Number(item?.order);
    if (label && Number.isFinite(order)) map.set(label, order);
  });
  return map;
}

export function gradeOrderForEntry(entry, orderMap) {
  if (Number.isFinite(entry?.gradeOrder)) return Number(entry.gradeOrder);
  if (!orderMap) return -1;
  const val = normalizeLevelValue(entry?.grade);
  return orderMap.has(val) ? orderMap.get(val) : -1;
}

export function getDateKeyFromAnyValue(value) {
  if (!value) return '';
  let d = null;
  if (value instanceof Date) d = value;
  else if (typeof value?.toDate === 'function') d = value.toDate();
  else if (typeof value === 'string' || typeof value === 'number') d = new Date(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return toYYYYMMDD(d);
}

export function computeTrackerSummary(trackerAll = []) {
  const climbed = trackerAll.filter(v => v.state === 'climbed');
  const total = climbed.length;
  const grades = climbed.filter(v => v.finalGrade).map(v => ({ label: v.finalGrade, order: Number.isFinite(v.finalGradeOrder) ? v.finalGradeOrder : -1 }));
  const max = grades.length ? grades.slice().sort((a,b)=>b.order-a.order)[0] : null;
  const avgOrder = grades.length ? (grades.reduce((a,g)=>a+Math.max(0,g.order),0) / grades.length) : 0;
  const distByGym = new Map();
  climbed.forEach(v => {
    const gym = v.gymName || v.gymId || '-';
    const grade = v.finalGrade || '-';
    if (!distByGym.has(gym)) distByGym.set(gym, new Map());
    const m = distByGym.get(gym);
    m.set(grade, (m.get(grade) || 0) + 1);
  });
  const topHard = climbed.slice().sort((a,b) => (Number(b.finalGradeOrder||-1)-Number(a.finalGradeOrder||-1))).slice(0,5);
  return { total, maxLabel: max?.label || '-', avgOrder: Math.round(avgOrder*10)/10, distributionByGym: Array.from(distByGym.entries()).map(([gym, m]) => ({ gym, rows: Array.from(m.entries()).sort((a,b)=>b[1]-a[1]) })), topHard };
}

export function computeUserChallengesFeature(ctx, trackerAll = []) {
  const climbedEntries = trackerAll.filter(v => v.state === 'climbed');
  const daysInGym = new Set();
  const sectors = new Set();
  const gyms = new Set();

  trackerAll.forEach(v => {
    const dayKey = ctx.getDateKeyFromAnyValue(v.eventDate || v.completionDate || v.updatedAt || v.createdAt);
    if (dayKey) daysInGym.add(dayKey);
    const sectorKey = String(v.sectorId || v.sectorName || '').trim();
    if (sectorKey) sectors.add(sectorKey);
    const gymKey = String(v.gymId || v.gymName || '').trim();
    if (gymKey) gyms.add(gymKey);
  });

  const sortedDays = Array.from(daysInGym).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let prev = null;
  sortedDays.forEach(day => {
    if (!prev) currentStreak = 1;
    else currentStreak = ctx.areConsecutiveDays(prev, day) ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    prev = day;
  });

  const metrics = [
    { key: 'routes', label: ctx.t('ui.totalClosedRoutes'), value: climbedEntries.length, available: trackerAll.some(v => Object.prototype.hasOwnProperty.call(v || {}, 'state')) },
    { key: 'days', label: ctx.t('ui.gymDays'), value: daysInGym.size, available: trackerAll.some(v => ctx.getDateKeyFromAnyValue(v.eventDate || v.completionDate || v.updatedAt || v.createdAt)) },
    { key: 'streak', label: ctx.t('ui.consecutiveDays'), value: longestStreak, available: daysInGym.size > 0 },
    { key: 'sectors', label: ctx.t('challenges.sectorsTried'), value: sectors.size, available: trackerAll.some(v => !!(v.sectorId || v.sectorName)) },
    { key: 'gyms', label: ctx.t('ui.gymsTried'), value: gyms.size, available: trackerAll.some(v => !!(v.gymId || v.gymName)) }
  ];
  return metrics.filter(m => m.available);
}
