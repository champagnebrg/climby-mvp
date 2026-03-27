import { formatDate } from "./format.js";

export function formatProfileDate(v, toSafeDate, currentLang) {
    if (!v) return '';
    const d = toSafeDate(v);
    if (!d) return String(v || '');
    return formatDate(d, currentLang === 'it' ? 'it-IT' : 'en-US');
}

export function currentUserInitials(currentUserName) {
    return String(currentUserName || 'U').slice(0, 2).toUpperCase();
}

export function computeProfileStatsFromGymStats(rows = []) {
    const list = Array.isArray(rows) ? rows : [];
    const normalized = list.map((row) => ({
        gymId: row.gym_id || row.gymId || row.id || null,
        gymName: row.gym_name || row.gymName || row.gym_id || row.gymId || '-',
        totalRoutes: Number(row.total_routes ?? row.totalRoutes ?? 0),
        activeDays: Number(row.active_days ?? row.activeDays ?? 0),
        maxGrade: row.max_grade || row.maxGrade || '-',
        maxGradeOrder: Number(row.max_grade_order ?? row.maxGradeOrder ?? -1),
        streakDays: Number(row.streak_days ?? row.streakDays ?? 0)
    }));
    const gymsUnique = new Set(normalized.map((r) => r.gymId).filter(Boolean));
    const totalRoutes = normalized.reduce((sum, r) => sum + r.totalRoutes, 0);
    const activeDays = normalized.reduce((sum, r) => sum + r.activeDays, 0);
    const bestRow = normalized.reduce((best, row) => row.maxGradeOrder > (best?.maxGradeOrder ?? -1) ? row : best, null);
    const nextState = {
        loading: false,
        hasData: normalized.length > 0,
        error: null,
        totalRoutes,
        gymsCount: gymsUnique.size || normalized.length,
        activeDays,
        maxGrade: bestRow?.maxGrade || '-',
        maxGradeOrder: bestRow?.maxGradeOrder ?? -1,
        bestGymName: bestRow?.gymName || '-',
        normalized
    };
    return nextState;
}
