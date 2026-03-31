import { normalizeText, normalizeNullableText } from '../../utils/normalize.js';
import { toSafeDate } from '../../utils/format.js';

export const CHALLENGE_SCOPE_GLOBAL = 'global';
export const CHALLENGE_SCOPE_GYM = 'gym';
export const CHALLENGE_SCOPE_SPONSOR = 'sponsor';
export const CHALLENGE_SCOPE_EXPLORATION = 'exploration';
export const CHALLENGE_SCOPE_EVENT = 'event';

export const CHALLENGE_SCOPES = Object.freeze([
  CHALLENGE_SCOPE_GLOBAL,
  CHALLENGE_SCOPE_GYM,
  CHALLENGE_SCOPE_SPONSOR,
  CHALLENGE_SCOPE_EXPLORATION,
  CHALLENGE_SCOPE_EVENT,
]);

export const CHALLENGE_STATUS_DRAFT = 'draft';
export const CHALLENGE_STATUS_PUBLISHED = 'published';
export const CHALLENGE_STATUS_ARCHIVED = 'archived';

export const CHALLENGE_STATUSES = Object.freeze([
  CHALLENGE_STATUS_DRAFT,
  CHALLENGE_STATUS_PUBLISHED,
  CHALLENGE_STATUS_ARCHIVED,
]);

export const TEMPLATE_TYPES = Object.freeze([
  'weekly',
  'monthly',
  'yearly',
  'exploration',
  'sponsor',
  'gym_event',
  'local_gym',
]);

function toIsoOrNull(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}

function normalizeMetric(value) {
  const metric = normalizeText(value).toLowerCase();
  return ['routes', 'days', 'streak', 'sectors', 'gyms'].includes(metric) ? metric : 'routes';
}

export function normalizeChallengeRecord(input = {}) {
  const status = normalizeText(input.status).toLowerCase();
  const scope = normalizeText(input.scope).toLowerCase();

  return {
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    status: CHALLENGE_STATUSES.includes(status) ? status : CHALLENGE_STATUS_DRAFT,
    scope: CHALLENGE_SCOPES.includes(scope) ? scope : CHALLENGE_SCOPE_GLOBAL,
    templateType: normalizeNullableText(input.templateType),
    type: normalizeText(input.type) || 'standard',
    gymId: normalizeNullableText(input.gymId),
    sponsorId: normalizeNullableText(input.sponsorId),
    visibility: normalizeText(input.visibility) || 'all_authenticated',
    isActive: Boolean(input.isActive),
    isFeatured: Boolean(input.isFeatured),
    featuredOrder: Number.isFinite(Number(input.featuredOrder)) ? Number(input.featuredOrder) : 999,
    startsAt: toIsoOrNull(input.startsAt),
    endsAt: toIsoOrNull(input.endsAt),
    pointsTier: normalizeText(input.pointsTier) || 'small',
    pointsValue: Number.isFinite(Number(input.pointsValue)) ? Number(input.pointsValue) : null,
    rules: {
      metric: normalizeMetric(input.rules?.metric),
      target: Math.max(1, Number(input.rules?.target) || 1),
    },
    reward: {
      rewardId: normalizeNullableText(input.reward?.rewardId),
      label: normalizeNullableText(input.reward?.label),
    },
    tags: Array.isArray(input.tags) ? input.tags.map((v) => normalizeText(v)).filter(Boolean) : [],
    ownerType: normalizeText(input.ownerType) || 'superadmin',
    createdBy: normalizeNullableText(input.createdBy),
    updatedBy: normalizeNullableText(input.updatedBy),
    createdAt: toIsoOrNull(input.createdAt),
    updatedAt: toIsoOrNull(input.updatedAt),
  };
}

export function buildChallengePayload(input = {}, context = {}) {
  const nowIso = toIsoOrNull(context.now || new Date());
  const normalized = normalizeChallengeRecord(input);
  return {
    ...normalized,
    createdAt: normalized.createdAt || nowIso,
    updatedAt: nowIso,
    createdBy: normalized.createdBy || normalizeNullableText(context.userId),
    updatedBy: normalizeNullableText(context.userId),
  };
}

export function normalizeChallengeScreenConfig(input = {}) {
  const sections = Array.isArray(input.sections) ? input.sections : [];
  return {
    title: normalizeText(input.title) || 'Sfide',
    subtitle: normalizeNullableText(input.subtitle),
    layoutMode: normalizeText(input.layoutMode) || 'cards',
    cardStyle: normalizeText(input.cardStyle) || 'default',
    sections: sections
      .map((item, index) => ({
        id: normalizeText(item?.id) || `section_${index + 1}`,
        title: normalizeText(item?.title) || `Section ${index + 1}`,
        subtitle: normalizeNullableText(item?.subtitle),
        filterScope: normalizeNullableText(item?.filterScope),
        featuredOnly: Boolean(item?.featuredOnly),
        order: Number.isFinite(Number(item?.order)) ? Number(item?.order) : index,
        isActive: item?.isActive !== false,
      }))
      .sort((a, b) => a.order - b.order),
    featuredChallengeIds: Array.isArray(input.featuredChallengeIds)
      ? input.featuredChallengeIds.map((v) => normalizeText(v)).filter(Boolean)
      : [],
    updatedAt: toIsoOrNull(input.updatedAt),
    updatedBy: normalizeNullableText(input.updatedBy),
  };
}
