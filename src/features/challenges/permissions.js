import { normalizeText } from '../../utils/normalize.js';

export const ROLE_SUPERADMIN = 'superadmin';
export const ROLE_GYM_ADMIN = 'gym_admin';
export const ROLE_USER = 'user';

export function canonicalizeRole(rawRole) {
  const role = normalizeText(rawRole).toLowerCase();
  if (role === ROLE_SUPERADMIN) return ROLE_SUPERADMIN;
  if (role === ROLE_GYM_ADMIN || role === 'admin') return ROLE_GYM_ADMIN;
  return ROLE_USER;
}

export function canManageGymChallenges(user = {}, gymId = null) {
  const role = canonicalizeRole(user.role);
  if (role === ROLE_SUPERADMIN) return true;
  if (role !== ROLE_GYM_ADMIN) return false;
  if (!gymId) return false;
  return normalizeText(user.gymManaged) === normalizeText(gymId);
}

export function canPublishGymChallenges(user = {}, gymId = null) {
  return canManageGymChallenges(user, gymId);
}

export function canManageGlobalTemplates(user = {}) {
  return canonicalizeRole(user.role) === ROLE_SUPERADMIN;
}

export function canManageSponsorChallenges(user = {}) {
  return canonicalizeRole(user.role) === ROLE_SUPERADMIN;
}

export function canManageRewards(user = {}, scope = 'gym') {
  const role = canonicalizeRole(user.role);
  const normalizedScope = normalizeText(scope).toLowerCase() || 'gym';
  if (role === ROLE_SUPERADMIN) return true;
  if (role !== ROLE_GYM_ADMIN) return false;
  return normalizedScope === 'gym';
}

export function isGymAdminRole(role) {
  return canonicalizeRole(role) === ROLE_GYM_ADMIN;
}

