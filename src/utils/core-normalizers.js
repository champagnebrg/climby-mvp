import { formatPersonName } from "./format.js";

export function isValidPersonName(value) {
    const normalized = formatPersonName(value);
    return /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,}$/.test(normalized);
}

export function normalizeGymIdSeed(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function normalizeUserRole(rawRole) {
    if (rawRole === 'superadmin') return 'superadmin';
    if (rawRole === 'gym_admin' || rawRole === 'admin') return 'gym_admin';
    return 'user';
}

export function isPermissionDeniedError(err) {
    const msg = String(err?.message || '').toLowerCase();
    return err?.code === 'permission-denied' || msg.includes('insufficient permissions') || msg.includes('permission-denied');
}

export function normalizeLevelValue(v) {
    return String(v || '').trim();
}

export function normalizeProgressValue(localRank, scaleSize) {
    if (localRank < 0 || !scaleSize || scaleSize <= 1) return 0;
    return localRank / (scaleSize - 1);
}

export function areConsecutiveDays(prevYmd, nextYmd) {
    if (!prevYmd || !nextYmd) return false;
    const p = new Date(`${prevYmd}T00:00:00`);
    const n = new Date(`${nextYmd}T00:00:00`);
    if (Number.isNaN(p.getTime()) || Number.isNaN(n.getTime())) return false;
    const diff = Math.round((n - p) / 86400000);
    return diff === 1;
}
