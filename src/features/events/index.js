import {
  saveCompetitionLiveCategorySelection as saveCompetitionLiveCategorySelectionForDebug,
} from './event-competition-live-entry-repository.js';

console.info('[events/index] module loaded 2026-03-23T00:00:00Z', {
  hasSaveCompetitionLiveCategorySelection: typeof saveCompetitionLiveCategorySelectionForDebug === 'function',
});

export {
  EVENT_TYPE_STANDARD,
  EVENT_STATUS_DRAFT,
  EVENT_STATUS_PUBLISHED,
  EVENT_STATUS_ENDED,
  EVENT_STATUS_CANCELLED,
  EVENT_TYPES,
  EVENT_STATUSES,
  COMPETITION_LIVE_STATUS_DRAFT,
  COMPETITION_LIVE_STATUS_LIVE,
  COMPETITION_LIVE_STATUS_CLOSED,
  COMPETITION_LIVE_STATUSES,
  COMPETITION_LIVE_ROUTE_SELECTION_MODE_ALL,
  COMPETITION_LIVE_ROUTE_SELECTION_MODE_MANUAL,
  COMPETITION_LIVE_ROUTE_SELECTION_MODES,
  buildEventPayload,
  getDefaultCompetitionLive,
  normalizeCompetitionLive,
  normalizeCompetitionLiveCategories,
  normalizeCompetitionLiveCategory,
  normalizeCompetitionLiveCategoryOrder,
  normalizeCompetitionLiveBlocksCount,
  normalizeCompetitionLiveStatus,
  normalizeCompetitionLiveRouteSelectionMode,
  normalizeEventRecord,
  isEventVisibleToUsers,
} from './event-model.js';

export {
  validateStandardEventInput,
  validateStandardEventUpdate,
  canTransitionEventStatus,
} from './event-validation.js';

export {
  createDraftEvent,
  createEvent,
  updateEvent,
  listGymEvents,
  getEventById,
  publishEvent,
  cancelEvent,
  endEvent,
} from './event-repository.js';

export {
  EVENT_REGISTRATION_STATUS_REGISTERED,
  EVENT_REGISTRATION_STATUS_CHECKED_IN,
  EVENT_REGISTRATION_STATUS_CANCELLED,
  EVENT_REGISTRATION_STATUSES,
  hasAdminConfirmedEventCheckIn,
  registerUserToEvent,
  cancelRegistration,
  updateRegistrationStatus,
  getCurrentUserRegistration,
  listRegistrationsForEvent,
  countActiveRegistrationsForEvent,
} from './event-registration.js';

export {
  COMPETITION_LIVE_ENTRY_STATUS_ACTIVE,
  COMPETITION_LIVE_ENTRY_STATUSES,
  getDefaultCompetitionLiveEntry,
  normalizeCompetitionLiveEntryStatus,
  buildCompetitionLiveEntryPayload,
  computeCompetitionLiveEntryScore,
  normalizeCompletedBlockNumbers,
  normalizeCompetitionLiveEntryCategoryId,
  normalizeCompetitionLiveEntryRecord,
  normalizeCompletedBySector,
  normalizeRouteIds,
} from './event-competition-live-entry-model.js';

export {
  getCompetitionLiveEntryDocRef,
  getCompetitionLiveEntriesCollectionRef,
  getCompetitionLiveEntry,
  listCompetitionLiveEntries,
  getOrCreateCompetitionLiveEntry,
  saveCompetitionLiveCategorySelection,
  saveCompetitionLiveCompletedBlocks,
  saveCompetitionLiveCompletedRoutes,
} from './event-competition-live-entry-repository.js';
