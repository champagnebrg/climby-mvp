import { normalizeNullableText, normalizeText } from '../../utils/normalize.js';

export const REWARD_TYPES = Object.freeze([
  'climby_points',
  'gym_beer',
  'gym_free_entry',
  'gym_gadget',
  'sponsor_discount_code',
  'sponsor_coupon',
  'physical_prize',
  'digital_prize',
  'custom',
]);

export const REWARD_PROVIDER_TYPES = Object.freeze([
  'global',
  'gym',
  'sponsor',
]);

export const REWARD_CLAIM_MODES = Object.freeze([
  'auto',
  'qr',
  'code',
  'manual',
]);

export const REWARD_STATUSES = Object.freeze([
  'active',
  'inactive',
  'archived',
]);

export function normalizeRewardRecord(input = {}) {
  const type = normalizeText(input.type).toLowerCase();
  const providerType = normalizeText(input.providerType).toLowerCase();
  const claimMode = normalizeText(input.claimMode).toLowerCase();
  const status = normalizeText(input.status).toLowerCase();

  const normalizedProviderType = REWARD_PROVIDER_TYPES.includes(providerType) ? providerType : 'gym';
  return {
    type: REWARD_TYPES.includes(type) ? type : 'custom',
    providerType: normalizedProviderType,
    providerId: normalizedProviderType === 'global' ? null : normalizeNullableText(input.providerId),
    claimMode: REWARD_CLAIM_MODES.includes(claimMode) ? claimMode : 'manual',
    title: normalizeText(input.title),
    description: normalizeNullableText(input.description),
    status: REWARD_STATUSES.includes(status) ? status : 'active',
  };
}

