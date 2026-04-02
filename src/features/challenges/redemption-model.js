import { normalizeNullableText, normalizeText } from '../../utils/normalize.js';
import { toSafeDate } from '../../utils/format.js';

export const REDEMPTION_STATUS_LOCKED = 'locked';
export const REDEMPTION_STATUS_UNLOCKED = 'unlocked';
export const REDEMPTION_STATUS_CLAIMED = 'claimed';
export const REDEMPTION_STATUS_REDEEMED = 'redeemed';
export const REDEMPTION_STATUS_EXPIRED = 'expired';
export const REDEMPTION_STATUS_REJECTED = 'rejected';

export const REDEMPTION_STATUSES = Object.freeze([
  REDEMPTION_STATUS_LOCKED,
  REDEMPTION_STATUS_UNLOCKED,
  REDEMPTION_STATUS_CLAIMED,
  REDEMPTION_STATUS_REDEEMED,
  REDEMPTION_STATUS_EXPIRED,
  REDEMPTION_STATUS_REJECTED,
]);

function toIsoOrNull(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}

const TRANSITIONS = Object.freeze({
  [REDEMPTION_STATUS_LOCKED]: [REDEMPTION_STATUS_UNLOCKED],
  [REDEMPTION_STATUS_UNLOCKED]: [REDEMPTION_STATUS_CLAIMED, REDEMPTION_STATUS_EXPIRED],
  [REDEMPTION_STATUS_CLAIMED]: [REDEMPTION_STATUS_REDEEMED, REDEMPTION_STATUS_EXPIRED, REDEMPTION_STATUS_REJECTED],
  [REDEMPTION_STATUS_REDEEMED]: [],
  [REDEMPTION_STATUS_EXPIRED]: [],
  [REDEMPTION_STATUS_REJECTED]: [],
});

export function canTransitionRedemption(fromStatus, toStatus) {
  const from = normalizeText(fromStatus).toLowerCase();
  const to = normalizeText(toStatus).toLowerCase();
  if (!REDEMPTION_STATUSES.includes(from)) return false;
  if (!REDEMPTION_STATUSES.includes(to)) return false;
  return (TRANSITIONS[from] || []).includes(to);
}

export function normalizeRedemption(record = {}) {
  const status = normalizeText(record.status).toLowerCase();
  const nowIso = new Date().toISOString();
  return {
    id: normalizeNullableText(record.id),
    userId: normalizeNullableText(record.userId),
    gymId: normalizeNullableText(record.gymId),
    challengeInstanceId: normalizeNullableText(record.challengeInstanceId),
    rewardId: normalizeNullableText(record.rewardId),
    status: REDEMPTION_STATUSES.includes(status) ? status : REDEMPTION_STATUS_LOCKED,
    unlockAt: toIsoOrNull(record.unlockAt),
    claimedAt: toIsoOrNull(record.claimedAt),
    redeemedAt: toIsoOrNull(record.redeemedAt),
    expireAt: toIsoOrNull(record.expireAt),
    claimMode: normalizeNullableText(record.claimMode) || 'manual',
    verificationData: record.verificationData && typeof record.verificationData === 'object' ? record.verificationData : null,
    createdAt: toIsoOrNull(record.createdAt) || nowIso,
    updatedAt: toIsoOrNull(record.updatedAt) || nowIso,
  };
}
