export {
  ROLE_SUPERADMIN,
  ROLE_GYM_ADMIN,
  ROLE_USER,
  canonicalizeRole,
  canManageGymChallenges,
  canPublishGymChallenges,
  canManageGlobalTemplates,
  canManageSponsorChallenges,
  canManageRewards,
  isGymAdminRole,
} from './permissions.js';

export {
  REWARD_TYPES,
  REWARD_PROVIDER_TYPES,
  REWARD_CLAIM_MODES,
  REWARD_STATUSES,
  normalizeRewardRecord,
} from './reward-model.js';

export {
  REDEMPTION_STATUS_LOCKED,
  REDEMPTION_STATUS_UNLOCKED,
  REDEMPTION_STATUS_CLAIMED,
  REDEMPTION_STATUS_REDEEMED,
  REDEMPTION_STATUS_EXPIRED,
  REDEMPTION_STATUS_REJECTED,
  REDEMPTION_STATUSES,
  canTransitionRedemption,
  normalizeRedemption,
} from './redemption-model.js';

export {
  createRedemption,
  getUserRedemptions,
  getChallengeRedemptions,
  getClaimedRedemptions,
  updateRedemptionStatus,
} from './redemption-repository.js';

export {
  CHALLENGE_SCOPE_GLOBAL,
  CHALLENGE_SCOPE_GYM,
  CHALLENGE_SCOPE_SPONSOR,
  CHALLENGE_SCOPE_EXPLORATION,
  CHALLENGE_SCOPE_EVENT,
  CHALLENGE_SCOPES,
  CHALLENGE_KIND_STANDARD,
  CHALLENGE_KIND_COMPETITION,
  CHALLENGE_KIND_DISCOVERY,
  CHALLENGE_KINDS,
  CHALLENGE_PROGRESS_MODE_SINGLE_TARGET,
  CHALLENGE_PROGRESS_MODE_TIERED,
  CHALLENGE_PROGRESS_MODES,
  CHALLENGE_STATUS_DRAFT,
  CHALLENGE_STATUS_PUBLISHED,
  CHALLENGE_STATUS_INACTIVE,
  CHALLENGE_STATUS_ARCHIVED,
  CHALLENGE_STATUS_DELETED,
  CHALLENGE_STATUSES,
  TEMPLATE_TYPES,
  DISPLAY_SECTIONS,
  DURATION_PRESETS,
  CLIMBY_POINTS_LABEL,
  POINTS_POLICY_PRESETS,
  TEMPLATE_FAMILIES,
  TEMPLATE_STATUSES,
  normalizeChallengeRecord,
  normalizeTemplateRecord,
  buildChallengeDraftFromTemplate,
  buildChallengePayload,
  normalizeChallengeScreenConfig,
} from './challenge-model.js';

export {
  listChallenges,
  saveChallenge,
  updateChallengeLifecycle,
  deleteChallengeIfSafe,
  getUserChallengeProgress,
  mergeChallengesWithProgress,
  listTemplates,
  getTemplateById,
  saveTemplate,
  getChallengeScreenConfig,
  saveChallengeScreenConfig,
} from './challenge-repository.js';

export {
  computeChallengeProgress,
  renderChallengesHubDynamic,
  renderSuperadminChallengeManager,
  renderGymAdminChallengeManager,
} from './challenge-ui.js';
