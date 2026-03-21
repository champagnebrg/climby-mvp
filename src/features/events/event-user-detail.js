import { normalizeCompetitionLive } from './event-model.js';
import { hasAdminConfirmedEventCheckIn } from './event-registration.js';

export function renderUserEventDetail({
  container,
  event = null,
  registration = null,
  participantCount = 0,
  registrationLoading = false,
  registrationSaving = false,
  competitionEntry = null,
  competitionEntryLoading = false,
  competitionViewOpen = false,
  availableSectors = [],
  onToggleRegistration = null,
  onOpenCompetitionLive = null,
  onCloseCompetitionLive = null,
  onOpenCompetitionSector = null,
  t = (key) => key,
  formatDateTime = (value) => value || '-',
} = {}) {
  if (!container) return;

  if (!event) {
    container.innerHTML = `<div class="card" style="display:block;">${escapeHtml(t('gym.eventsSelectHint'))}</div>`;
    return;
  }

  const isRegistered = registration?.status === 'registered';
  const isCheckedIn = registration?.status === 'checked_in';
  const isEventClosed = event.status !== 'published';
  const isRegistrationClosed = !event.registrationEnabled;
  const canRegister = !isEventClosed && !isRegistrationClosed && !registrationLoading && !registrationSaving && !isRegistered && !isCheckedIn;
  const statusLabel = isRegistered
    ? t('gym.eventsRegistrationRegistered')
    : (isCheckedIn
      ? t('gym.eventsRegistrationChecked_in')
      : (registration?.status === 'cancelled' ? t('gym.eventsRegistrationCancelled') : t('gym.eventsRegistrationNotRegistered')));
  const buttonLabel = isEventClosed
    ? t('gym.eventsRegistrationEventClosedCta')
    : (isRegistrationClosed
      ? t('gym.eventsRegistrationClosedCta')
      : (isCheckedIn
        ? t('gym.eventsRegistrationCheckInCompleted')
        : (isRegistered ? t('gym.eventsRegistrationRegisteredCta') : t('gym.eventsRegister'))));
  const buttonClass = canRegister ? 'btn-main' : 'btn-sec';
  const registrationAvailabilityMessage = isEventClosed
    ? t('gym.eventsRegistrationClosed')
    : (isRegistrationClosed ? t('gym.eventsRegistrationUnavailable') : '');
  const competitionLive = normalizeCompetitionLive(event.competition_live);
  const hasCompetitionLiveCheckIn = hasAdminConfirmedEventCheckIn(registration);
  const competitionLiveSection = competitionLive.enabled
    ? renderCompetitionLiveSection({ competitionLive, competitionEntry, competitionEntryLoading, competitionViewOpen, availableSectors, formatDateTime, hasCompetitionLiveCheckIn, t })
    : '';

  container.innerHTML = `
    <div class="gym-info-block">
      <h4 class="gym-info-heading">${escapeHtml(event.title || t('gym.eventsUntitled'))}</h4>
      <div class="gym-about-content">
        <div class="gym-about-row"><span class="gym-about-label">🗓 ${escapeHtml(t('gym.eventsWhen'))}</span><span class="gym-about-value">${escapeHtml(formatDateTime(event.startsAt))} → ${escapeHtml(formatDateTime(event.endsAt))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">🏷 ${escapeHtml(t('gym.eventsStatusLabel'))}</span><span class="gym-about-value">${escapeHtml(t(`gym.eventsStatus${capitalize(event.status || 'published')}`))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">👥 ${escapeHtml(t('gym.eventsParticipantsLabel'))}</span><span class="gym-about-value">${escapeHtml(String(participantCount || 0))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">✍️ ${escapeHtml(t('gym.eventsRegistrationLabel'))}</span><span class="gym-about-value">${escapeHtml(statusLabel)}</span></div>
      </div>
      ${event.summary ? `<p class="profile-subtitle" style="margin-top:12px;">${escapeHtml(event.summary)}</p>` : ''}
      <div style="margin-top:10px; white-space:pre-wrap; line-height:1.5;">${escapeHtml(event.description || '')}</div>
      ${competitionLiveSection}
      <div style="margin-top:16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button type="button" class="${buttonClass}" data-event-registration-toggle ${canRegister ? '' : 'disabled'}>${escapeHtml(registrationSaving ? t('gym.eventsRegistrationUpdating') : buttonLabel)}</button>
      </div>
      ${registrationAvailabilityMessage && !isRegistered && !isCheckedIn ? `<div class="profile-subtitle" style="margin-top:8px;">${escapeHtml(registrationAvailabilityMessage)}</div>` : ''}
    </div>
  `;

  container.querySelector('[data-event-registration-toggle]')?.addEventListener('click', () => {
    if (!canRegister) return;
    onToggleRegistration?.(event, registration);
  });
  container.querySelector('[data-open-competition-live]')?.addEventListener('click', () => {
    onOpenCompetitionLive?.(event, competitionEntry);
  });
  container.querySelector('[data-close-competition-live]')?.addEventListener('click', () => {
    onCloseCompetitionLive?.(event, competitionEntry);
  });
  container.querySelectorAll('[data-open-competition-sector]').forEach((button) => {
    button.addEventListener('click', () => {
      onOpenCompetitionSector?.(event, button.dataset.sectorId || '');
    });
  });
}

function renderCompetitionLiveSection({ competitionLive = {}, competitionEntry = null, competitionEntryLoading = false, competitionViewOpen = false, availableSectors = [], formatDateTime = (value) => value || '-', hasCompetitionLiveCheckIn = false, t = (key) => key } = {}) {
  const includedSectors = getCompetitionLiveIncludedSectors(competitionLive, availableSectors);
  const completedCount = Array.isArray(competitionEntry?.completedRouteIds) ? competitionEntry.completedRouteIds.length : 0;
  const isClosed = isCompetitionLiveClosed(competitionLive);
  const accessLabel = getCompetitionAccessLabel({ competitionEntryLoading, hasCompetitionLiveCheckIn, competitionEntry, competitionViewOpen, isClosed, t });
  const actionLabel = getCompetitionActionLabel({ competitionEntryLoading, hasCompetitionLiveCheckIn, competitionEntry, competitionViewOpen, isClosed, t });
  const canOpenCompetitionLive = hasCompetitionLiveCheckIn && !competitionEntryLoading && !competitionViewOpen && !isClosed;
  const helperMessage = isClosed
    ? t('gym.eventsCompetitionClosedMessage')
    : (hasCompetitionLiveCheckIn ? t('gym.eventsCompetitionLiveReadyHint') : t('gym.eventsCompetitionLiveCheckInRequired'));
  const competitionViewSection = competitionViewOpen
    ? renderCompetitionLiveViewSection({ includedSectors, competitionEntry, t })
    : '';

  return `
    <div style="margin-top:16px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px; background:rgba(255,255,255,0.02);">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
        <div style="display:grid; gap:4px;">
          <h5 style="margin:0; font-size:1rem;">${escapeHtml(t('gym.eventsCompetitionLiveTitle'))}</h5>
          <div style="color:var(--muted); font-size:0.84rem;">${escapeHtml(t('gym.eventsCompetitionLiveSubtitle'))}</div>
        </div>
        <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:0.78rem; font-weight:700; ${getCompetitionAccessBadgeStyle({ hasCompetitionLiveCheckIn, competitionViewOpen, isClosed })}">${escapeHtml(accessLabel)}</span>
      </div>
      ${competitionLive.label ? `<div style="margin-top:10px; font-weight:600;">${escapeHtml(competitionLive.label)}</div>` : ''}
      <div class="gym-about-content" style="margin-top:10px;">
        ${competitionLive.startsAt ? `<div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionLiveStartsLabel'))}</span><span class="gym-about-value">${escapeHtml(formatDateTime(competitionLive.startsAt))}</span></div>` : ''}
        ${competitionLive.endsAt ? `<div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionLiveEndsLabel'))}</span><span class="gym-about-value">${escapeHtml(formatDateTime(competitionLive.endsAt))}</span></div>` : ''}
        <div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionAccessLabel'))}</span><span class="gym-about-value">${escapeHtml(accessLabel)}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionCompletedLabel'))}</span><span class="gym-about-value">${escapeHtml(String(completedCount))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionSectorsLabel'))}</span><span class="gym-about-value">${escapeHtml(formatCompetitionSectorCount(includedSectors.length, t))}</span></div>
      </div>
      <div class="profile-subtitle" style="margin-top:10px;">${escapeHtml(helperMessage)}</div>
      <div style="margin-top:12px; display:grid; gap:8px;">
        <button type="button" class="btn-sec" data-open-competition-live ${canOpenCompetitionLive ? '' : 'disabled'}>${escapeHtml(actionLabel)}</button>
      </div>
      ${competitionViewSection}
    </div>
  `;
}

function renderCompetitionLiveViewSection({ includedSectors = [], competitionEntry = null, t = (key) => key } = {}) {
  return `
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); display:grid; gap:10px;">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
        <div>
          <div style="font-size:0.92rem; font-weight:700;">${escapeHtml(t('gym.eventsCompetitionSectorListTitle'))}</div>
          <div style="color:var(--muted); font-size:0.82rem; margin-top:4px;">${escapeHtml(t('gym.eventsCompetitionSectorListHint'))}</div>
        </div>
        <button type="button" class="btn-sec" data-close-competition-live>${escapeHtml(t('gym.eventsCompetitionCloseCta'))}</button>
      </div>
      ${includedSectors.length ? `
        <div style="display:grid; gap:8px;">
          ${includedSectors.map((sector, index) => renderCompetitionLiveSectorRow(sector, index, competitionEntry, t)).join('')}
        </div>
      ` : `<div class="profile-subtitle">${escapeHtml(t('gym.eventsCompetitionNoSectors'))}</div>`}
    </div>
  `;
}

function renderCompetitionLiveSectorRow(sector = {}, index = 0, competitionEntry = null, t = (key) => key) {
  const label = sector.sectorName || sector.sectorId || '-';
  const completedCount = getCompetitionSectorCompletedCount(sector.sectorId, competitionEntry);
  const progressLabel = completedCount > 0
    ? formatCompetitionSectorCompletedLabel(completedCount, t)
    : t('gym.eventsCompetitionSectorNoProgress');
  const progressStyle = completedCount > 0
    ? 'color:#62f29b; font-weight:700;'
    : 'color:var(--muted);';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:10px; background:rgba(255,255,255,0.02);">
      <div style="display:grid; gap:4px;">
        <span style="font-weight:600;">${escapeHtml(label)}</span>
        <span style="color:var(--muted); font-size:0.8rem;">${escapeHtml(formatCompetitionSectorItemHint(index + 1, t))}</span>
        <span style="font-size:0.82rem; ${progressStyle}">${escapeHtml(progressLabel)}</span>
      </div>
      <button type="button" class="btn-sec" data-open-competition-sector data-sector-id="${escapeHtml(sector.sectorId || '')}">${escapeHtml(t('gym.eventsCompetitionOpenSectorCta'))}</button>
    </div>
  `;
}

function getCompetitionLiveIncludedSectors(competitionLive = {}, availableSectors = []) {
  const sectorIds = Array.isArray(competitionLive?.sectorIds) ? competitionLive.sectorIds : [];
  if (!sectorIds.length) return [];

  const sectorNameById = new Map((Array.isArray(availableSectors) ? availableSectors : [])
    .map((sector) => [String(sector?.sectorId || '').trim(), String(sector?.sectorName || sector?.name || sector?.sectorId || '').trim()]));

  return sectorIds
    .map((sectorId) => {
      const normalizedId = String(sectorId || '').trim();
      if (!normalizedId) return null;
      return {
        sectorId: normalizedId,
        sectorName: sectorNameById.get(normalizedId) || normalizedId,
      };
    })
    .filter(Boolean);
}


function getCompetitionSectorCompletedCount(sectorId = '', competitionEntry = null) {
  const completedBySector = competitionEntry?.completedBySector || {};
  const routeIds = Array.isArray(completedBySector?.[sectorId]) ? completedBySector[sectorId] : [];
  return routeIds.length;
}

function formatCompetitionSectorCompletedLabel(count = 0, t = (key) => key) {
  return `${count} ${t(count === 1 ? 'gym.eventsCompetitionSectorCompletedSingle' : 'gym.eventsCompetitionSectorCompletedPlural')}`;
}

function formatCompetitionSectorCount(count = 0, t = (key) => key) {
  return `${count} ${t(count === 1 ? 'gym.eventsCompetitionSectorCountSingle' : 'gym.eventsCompetitionSectorCountPlural')}`;
}

function formatCompetitionSectorItemHint(index = 1, t = (key) => key) {
  return `${t('gym.eventsCompetitionSectorLabel')} ${index}`;
}
function getCompetitionAccessLabel({ competitionEntryLoading = false, hasCompetitionLiveCheckIn = false, competitionEntry = null, competitionViewOpen = false, isClosed = false, t = (key) => key } = {}) {
  if (competitionEntryLoading) return t('gym.eventsCompetitionLoading');
  if (isClosed) return t('gym.eventsCompetitionAccessClosed');
  if (!hasCompetitionLiveCheckIn) return t('gym.eventsCompetitionAccessLocked');
  if (competitionViewOpen) return t('gym.eventsCompetitionAccessOpen');
  if (competitionEntry?.status === 'active') return t('gym.eventsCompetitionAccessReady');
  return t('gym.eventsCompetitionAccessAvailable');
}

function getCompetitionActionLabel({ competitionEntryLoading = false, hasCompetitionLiveCheckIn = false, competitionEntry = null, competitionViewOpen = false, isClosed = false, t = (key) => key } = {}) {
  if (competitionEntryLoading) return t('gym.eventsCompetitionLoading');
  if (isClosed) return t('gym.eventsCompetitionActionClosed');
  if (!hasCompetitionLiveCheckIn) return t('gym.eventsCompetitionActionLocked');
  if (competitionViewOpen) return t('gym.eventsCompetitionActionOpen');
  if (competitionEntry?.status === 'active') return t('gym.eventsCompetitionActionContinue');
  return t('gym.eventsCompetitionActionStart');
}

function getCompetitionAccessBadgeStyle({ hasCompetitionLiveCheckIn = false, competitionViewOpen = false, isClosed = false } = {}) {
  if (isClosed) {
    return 'background:rgba(255,107,107,0.14); color:#ff9b9b; border:1px solid rgba(255,107,107,0.35);';
  }
  if (competitionViewOpen) {
    return 'background:rgba(111,77,255,0.16); color:#c6b6ff; border:1px solid rgba(111,77,255,0.35);';
  }
  if (hasCompetitionLiveCheckIn) {
    return 'background:rgba(43,224,125,0.14); color:#62f29b; border:1px solid rgba(43,224,125,0.35);';
  }
  return 'background:rgba(255,255,255,0.06); color:var(--muted); border:1px solid rgba(255,255,255,0.12);';
}

function isCompetitionLiveClosed(competitionLive = {}) {
  if ((competitionLive?.status || '') === 'closed') return true;
  const endsAt = Date.parse(competitionLive?.endsAt || '') || 0;
  return endsAt > 0 && endsAt < Date.now();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(value) {
  const raw = String(value || '');
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
}
