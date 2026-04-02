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

export const CHALLENGE_KIND_STANDARD = 'standard';
export const CHALLENGE_KIND_COMPETITION = 'competition';
export const CHALLENGE_KIND_DISCOVERY = 'discovery';

export const CHALLENGE_KINDS = Object.freeze([
  CHALLENGE_KIND_STANDARD,
  CHALLENGE_KIND_COMPETITION,
  CHALLENGE_KIND_DISCOVERY,
]);

export const CHALLENGE_PROGRESS_MODE_SINGLE_TARGET = 'single_target';
export const CHALLENGE_PROGRESS_MODE_TIERED = 'tiered';

export const CHALLENGE_PROGRESS_MODES = Object.freeze([
  CHALLENGE_PROGRESS_MODE_SINGLE_TARGET,
  CHALLENGE_PROGRESS_MODE_TIERED,
]);

export const CHALLENGE_STATUS_DRAFT = 'draft';
export const CHALLENGE_STATUS_PUBLISHED = 'published';
export const CHALLENGE_STATUS_INACTIVE = 'inactive';
export const CHALLENGE_STATUS_ARCHIVED = 'archived';
export const CHALLENGE_STATUS_DELETED = 'deleted';

export const CHALLENGE_STATUSES = Object.freeze([
  CHALLENGE_STATUS_DRAFT,
  CHALLENGE_STATUS_PUBLISHED,
  CHALLENGE_STATUS_INACTIVE,
  CHALLENGE_STATUS_ARCHIVED,
  CHALLENGE_STATUS_DELETED,
]);

export const TEMPLATE_TYPES = Object.freeze([
  'weekly_routes',
  'weekly_streak',
  'monthly_routes',
  'monthly_exploration',
  'sponsor_campaign',
  'gym_local',
  'event_competition',
]);

export const DISPLAY_SECTIONS = Object.freeze([
  'weekly',
  'monthly',
  'exploration',
  'local_gym',
  'sponsor',
  'events',
]);

export const DURATION_PRESETS = Object.freeze([
  '7d',
  '14d',
  '30d',
  'seasonal',
  'custom',
]);

export const CLIMBY_POINTS_LABEL = 'CP';

export const POINTS_POLICY_PRESETS = Object.freeze({
  small: 50,
  medium: 120,
  large: 250,
});

export const REWARD_CONFIG_MODES = Object.freeze([
  'none',
  'single',
]);

export const TEMPLATE_FAMILIES = Object.freeze([
  'standard',
  'sponsor',
  'gym',
  'event',
]);

export const TEMPLATE_STATUSES = Object.freeze([
  'draft',
  'published',
  'inactive',
]);

const TEMPLATE_OVERRIDE_FIELDS = Object.freeze([
  'title',
  'description',
  'dates',
  'rewardLabel',
  'target',
  'displaySectionId',
]);

const TEMPLATE_PRESETS = Object.freeze({
  weekly_routes: { metric: 'routes', target: 8, pointsTier: 'small', durationPreset: '7d', displaySectionIds: ['weekly'] },
  weekly_streak: { metric: 'streak', target: 4, pointsTier: 'medium', durationPreset: '7d', displaySectionIds: ['weekly'] },
  monthly_routes: { metric: 'routes', target: 30, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['monthly'] },
  monthly_exploration: { metric: 'gyms', target: 3, pointsTier: 'large', durationPreset: '30d', displaySectionIds: ['exploration'] },
  sponsor_campaign: { metric: 'routes', target: 20, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['sponsor'] },
  gym_local: { metric: 'routes', target: 10, pointsTier: 'small', durationPreset: '14d', displaySectionIds: ['local_gym'] },
  event_competition: { metric: 'routes', target: 12, pointsTier: 'large', durationPreset: 'custom', displaySectionIds: ['events'] },
});

function toIsoOrNull(value) {
  const safe = toSafeDate(value);
  return safe ? safe.toISOString() : null;
}

function normalizeMetric(value) {
  const metric = normalizeText(value).toLowerCase();
  return ['routes', 'days', 'streak', 'sectors', 'gyms'].includes(metric) ? metric : 'routes';
}

function normalizeDisplaySectionIds(value = [], templateType = null) {
  const rows = Array.isArray(value) ? value : [];
  const explicit = rows.map((item) => normalizeText(item)).filter((item) => DISPLAY_SECTIONS.includes(item));
  if (explicit.length) return [...new Set(explicit)];

  const preset = templateType ? TEMPLATE_PRESETS[templateType] : null;
  if (preset?.displaySectionIds?.length) return preset.displaySectionIds;
  return ['weekly'];
}

function normalizeGymIds(input = {}, scope = CHALLENGE_SCOPE_GLOBAL) {
  const gymIds = Array.isArray(input.gymIds)
    ? input.gymIds.map((v) => normalizeText(v)).filter(Boolean)
    : [];
  const gymId = normalizeNullableText(input.gymId);
  if (gymId && !gymIds.includes(gymId)) gymIds.unshift(gymId);
  if (scope !== CHALLENGE_SCOPE_GYM) return [];
  return [...new Set(gymIds)];
}


const DEFAULT_PROGRESS_TIERS = Object.freeze([
  { id: 'bronze', label: 'Bronzo', threshold: 10, badge: '🥉', pointsValue: 50 },
  { id: 'silver', label: 'Argento', threshold: 20, badge: '🥈', pointsValue: 75 },
  { id: 'gold', label: 'Oro', threshold: 50, badge: '🥇', pointsValue: 125 },
  { id: 'platinum', label: 'Platino', threshold: 100, badge: '🏆', pointsValue: 250 },
]);

function normalizeProgressMode(value) {
  const mode = normalizeText(value).toLowerCase();
  return CHALLENGE_PROGRESS_MODES.includes(mode) ? mode : CHALLENGE_PROGRESS_MODE_SINGLE_TARGET;
}

function normalizeProgressTiers(value = []) {
  const rows = Array.isArray(value) && value.length ? value : DEFAULT_PROGRESS_TIERS;
  return rows
    .map((item, index) => ({
      id: normalizeText(item?.id) || `tier_${index + 1}`,
      label: normalizeText(item?.label) || `Livello ${index + 1}`,
      threshold: Math.max(1, Number(item?.threshold) || (index + 1) * 10),
      badge: normalizeNullableText(item?.badge),
      rewardLabel: normalizeNullableText(item?.rewardLabel),
      pointsValue: Number.isFinite(Number(item?.pointsValue))
        ? Math.max(0, Number(item?.pointsValue))
        : Math.max(0, Number(DEFAULT_PROGRESS_TIERS[index]?.pointsValue || 0)),
    }))
    .sort((a, b) => a.threshold - b.threshold);
}

function normalizeLifecycleStatus(value, fallbackStatus = CHALLENGE_STATUS_DRAFT, activeFlag = false) {
  const normalized = normalizeText(value).toLowerCase();
  if (CHALLENGE_STATUSES.includes(normalized)) return normalized;
  if (CHALLENGE_STATUSES.includes(fallbackStatus)) return fallbackStatus;
  return activeFlag ? CHALLENGE_STATUS_PUBLISHED : CHALLENGE_STATUS_DRAFT;
}

function normalizeRewardConfig(input = {}) {
  const rewardConfig = input?.rewardConfig || {};
  const mode = normalizeText(rewardConfig.mode).toLowerCase();
  const rewardId = normalizeNullableText(rewardConfig.rewardId)
    || normalizeNullableText(input.reward?.rewardId)
    || null;
  const legacyLabel = normalizeNullableText(input.reward?.label);

  const normalizedMode = REWARD_CONFIG_MODES.includes(mode)
    ? mode
    : (rewardId || legacyLabel ? 'single' : 'none');

  return {
    mode: normalizedMode,
    rewardId,
    legacyLabel,
  };
}

export function normalizeTemplateRecord(input = {}) {
  const family = normalizeText(input.templateFamily).toLowerCase();
  const status = normalizeText(input.status).toLowerCase();
  const allowedOverrides = Array.isArray(input.allowedOverrides)
    ? input.allowedOverrides.map((v) => normalizeText(v)).filter((v) => TEMPLATE_OVERRIDE_FIELDS.includes(v))
    : ['title', 'description', 'dates', 'rewardLabel', 'target'];
  const defaultRule = input.defaultRule && typeof input.defaultRule === 'object' ? input.defaultRule : {};
  const defaultPointsPolicy = input.defaultPointsPolicy && typeof input.defaultPointsPolicy === 'object' ? input.defaultPointsPolicy : {};
  const normalizedFamily = TEMPLATE_FAMILIES.includes(family) ? family : 'standard';
  const isSponsorTemplate = Boolean(input.isSponsorTemplate) || normalizedFamily === 'sponsor';

  return {
    id: normalizeNullableText(input.id),
    name: normalizeText(input.name),
    description: normalizeText(input.description),
    templateFamily: normalizedFamily,
    isSponsorTemplate,
    status: TEMPLATE_STATUSES.includes(status) ? status : 'draft',
    defaultRule: {
      metric: normalizeMetric(defaultRule.metric),
      target: Math.max(1, Number(defaultRule.target) || 1),
      progressMode: normalizeProgressMode(defaultRule.progressMode),
    },
    defaultPointsPolicy: {
      pointsTier: ['small', 'medium', 'large'].includes(normalizeText(defaultPointsPolicy.pointsTier))
        ? normalizeText(defaultPointsPolicy.pointsTier)
        : 'small',
      pointsValue: Number.isFinite(Number(defaultPointsPolicy.pointsValue))
        ? Math.max(0, Number(defaultPointsPolicy.pointsValue))
        : null,
    },
    allowedOverrides: [...new Set(allowedOverrides)],
    sponsorId: normalizeNullableText(input.sponsorId),
    createdAt: toIsoOrNull(input.createdAt),
    updatedAt: toIsoOrNull(input.updatedAt),
  };
}

export function buildChallengeDraftFromTemplate(templateInput = {}, overrides = {}, context = {}) {
  const template = normalizeTemplateRecord(templateInput);
  if (template.isSponsorTemplate && !context.allowSponsorTemplate) {
    throw new Error('sponsor templates are not allowed in this flow');
  }
  const allowed = new Set(template.allowedOverrides || []);
  const payload = {
    templateId: template.id,
    templateType: null,
    title: template.name,
    description: template.description,
    progressMode: template.defaultRule.progressMode,
    rules: {
      metric: template.defaultRule.metric,
      target: template.defaultRule.target,
    },
    pointsTier: template.defaultPointsPolicy.pointsTier,
    pointsValue: template.defaultPointsPolicy.pointsValue,
    scope: context.scope || 'gym',
    sponsorId: template.isSponsorTemplate ? (template.sponsorId || context.sponsorId || null) : null,
    displaySectionIds: [context.defaultSectionId || 'local_gym'],
    reward: { label: null, rewardId: null },
  };

  if (allowed.has('title') && normalizeText(overrides.title)) payload.title = normalizeText(overrides.title);
  if (allowed.has('description') && normalizeText(overrides.description)) payload.description = normalizeText(overrides.description);
  if (allowed.has('rewardLabel')) payload.reward = { ...payload.reward, label: normalizeNullableText(overrides.rewardLabel) };
  if (allowed.has('target')) payload.rules.target = Math.max(1, Number(overrides.target) || payload.rules.target);
  if (allowed.has('displaySectionId')) payload.displaySectionIds = [normalizeText(overrides.displaySectionId) || payload.displaySectionIds[0]];
  if (allowed.has('dates')) {
    payload.startsAt = toIsoOrNull(overrides.startsAt);
    payload.endsAt = toIsoOrNull(overrides.endsAt);
  }
  return payload;
}

export function normalizeChallengeRecord(input = {}) {
  const status = normalizeText(input.status).toLowerCase();
  const scope = normalizeText(input.scope).toLowerCase();
  const templateType = normalizeNullableText(input.templateType);
  const validTemplate = TEMPLATE_TYPES.includes(templateType) ? templateType : null;
  const preset = validTemplate ? TEMPLATE_PRESETS[validTemplate] : null;

  const normalizedScope = CHALLENGE_SCOPES.includes(scope) ? scope : CHALLENGE_SCOPE_GLOBAL;
  const gymIds = normalizeGymIds(input, normalizedScope);
  const lifecycleStatus = normalizeLifecycleStatus(input.lifecycleStatus, status, Boolean(input.isActive));

  const progressMode = normalizeProgressMode(input.progressMode);
  const progressionTiers = normalizeProgressTiers(input?.progression?.tiers);
  const pointsTier = normalizeText(input.pointsTier) || preset?.pointsTier || 'small';
  const rewardConfig = normalizeRewardConfig(input);

  return {
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    status: CHALLENGE_STATUSES.includes(status) ? status : CHALLENGE_STATUS_DRAFT,
    lifecycleStatus,
    scope: normalizedScope,
    challengeKind: CHALLENGE_KINDS.includes(normalizeText(input.challengeKind)) ? normalizeText(input.challengeKind) : CHALLENGE_KIND_STANDARD,
    templateType: validTemplate,
    templateId: normalizeNullableText(input.templateId),
    type: normalizeText(input.type) || 'standard',
    gymId: gymIds[0] || null,
    gymIds,
    sponsorId: normalizeNullableText(input.sponsorId),
    visibility: normalizeText(input.visibility) || 'all_authenticated',
    isActive: lifecycleStatus === CHALLENGE_STATUS_PUBLISHED,
    displaySectionIds: normalizeDisplaySectionIds(input.displaySectionIds, validTemplate),
    durationPreset: DURATION_PRESETS.includes(normalizeText(input.durationPreset)) ? normalizeText(input.durationPreset) : (preset?.durationPreset || '7d'),
    startsAt: toIsoOrNull(input.startsAt),
    endsAt: toIsoOrNull(input.endsAt),
    pointsTier,
    pointsValue: Number.isFinite(Number(input.pointsValue))
      ? Math.max(0, Number(input.pointsValue))
      : POINTS_POLICY_PRESETS[pointsTier] || POINTS_POLICY_PRESETS.small,
    progressMode,
    rules: {
      metric: normalizeMetric(input.rules?.metric || preset?.metric),
      target: Math.max(1, Number(input.rules?.target) || Number(preset?.target) || (progressionTiers[progressionTiers.length - 1]?.threshold || 1)),
    },
    progression: {
      tiers: progressMode === CHALLENGE_PROGRESS_MODE_TIERED ? progressionTiers : [],
    },
    reward: {
      rewardId: normalizeNullableText(input.reward?.rewardId),
      label: normalizeNullableText(input.reward?.label),
    },
    rewardConfig,
    tags: Array.isArray(input.tags) ? input.tags.map((v) => normalizeText(v)).filter(Boolean) : [],
    ownerType: normalizeText(input.ownerType) || 'superadmin',
    createdBy: normalizeNullableText(input.createdBy),
    updatedBy: normalizeNullableText(input.updatedBy),
    createdAt: toIsoOrNull(input.createdAt),
    updatedAt: toIsoOrNull(input.updatedAt),
    progressCount: Math.max(0, Number(input.progressCount) || 0),
    dependencyCount: Math.max(0, Number(input.dependencyCount) || 0),
  };
}

export function buildChallengePayload(input = {}, context = {}) {
  const nowIso = toIsoOrNull(context.now || new Date());
  const normalized = normalizeChallengeRecord(input);
  const lifecycleStatus = normalizeLifecycleStatus(normalized.lifecycleStatus, normalized.status, normalized.isActive);
  return {
    ...normalized,
    status: lifecycleStatus,
    lifecycleStatus,
    isActive: lifecycleStatus === CHALLENGE_STATUS_PUBLISHED,
    createdAt: normalized.createdAt || nowIso,
    updatedAt: nowIso,
    createdBy: normalized.createdBy || normalizeNullableText(context.userId),
    updatedBy: normalizeNullableText(context.userId),
  };
}

export function normalizeChallengeScreenConfig(input = {}) {
  const sections = Array.isArray(input.sections)
    ? input.sections.filter((item) => DISPLAY_SECTIONS.includes(normalizeText(item?.id)))
    : [];
  const season = input.season || {};
  const rewards = input.rewards || {};
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
        order: Number.isFinite(Number(item?.order)) ? Number(item?.order) : index,
        isActive: item?.isActive !== false,
      }))
      .sort((a, b) => a.order - b.order),
    season: {
      seasonId: normalizeText(season.seasonId) || normalizeText(input.seasonId) || 'current',
      label: normalizeText(season.label) || 'Stagione attiva',
      startsAt: toIsoOrNull(season.startsAt || input.seasonStartsAt),
      endsAt: toIsoOrNull(season.endsAt || input.seasonEndsAt),
      isActive: season.isActive !== false,
    },
    rewards: {
      badgeLabel: normalizeText(rewards.badgeLabel) || 'Badge Challenger',
      badgeType: normalizeText(rewards.badgeType) || 'standard',
      profileVisibility: rewards.profileVisibility !== false,
      socialVisibility: rewards.socialVisibility !== false,
    },
    showEmptySections: input.showEmptySections !== false,
    updatedAt: toIsoOrNull(input.updatedAt),
    updatedBy: normalizeNullableText(input.updatedBy),
  };
}
