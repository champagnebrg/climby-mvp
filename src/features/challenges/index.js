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
  normalizeChallengeRecord,
  buildChallengePayload,
  normalizeChallengeScreenConfig,
} from './challenge-model.js';

export {
  listChallenges,
  saveChallenge,
  updateChallengeLifecycle,
  deleteChallengeIfSafe,
  listTemplates,
  getChallengeScreenConfig,
  saveChallengeScreenConfig,
} from './challenge-repository.js';

export {
  computeChallengeProgress,
  renderChallengesHubDynamic,
  renderSuperadminChallengeManager,
  renderGymAdminChallengeManager,
} from './challenge-ui.js';
