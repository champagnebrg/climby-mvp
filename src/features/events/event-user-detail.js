import { normalizeCompetitionLive } from './event-model.js';

export function renderUserEventDetail({
  container,
  event = null,
  registration = null,
  participantCount = 0,
  registrationLoading = false,
  registrationSaving = false,
  onToggleRegistration = null,
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
  const canToggleRegistration = Boolean(event.registrationEnabled) && event.status === 'published' && !registrationLoading && !registrationSaving && !isCheckedIn;
  const statusLabel = isRegistered
    ? t('gym.eventsRegistrationRegistered')
    : (isCheckedIn
      ? t('gym.eventsRegistrationChecked_in')
      : (registration?.status === 'cancelled' ? t('gym.eventsRegistrationCancelled') : t('gym.eventsRegistrationNotRegistered')));
  const buttonLabel = isRegistered ? t('gym.eventsCancelRegistration') : t('gym.eventsRegister');
  const registrationAvailabilityMessage = event.registrationEnabled
    ? (event.status === 'published' ? '' : t('gym.eventsRegistrationClosed'))
    : (event.status === 'published' ? t('gym.eventsRegistrationUnavailable') : t('gym.eventsRegistrationClosed'));
  const competitionLive = normalizeCompetitionLive(event.competition_live);
  const competitionLiveSection = competitionLive.enabled
    ? renderCompetitionLiveSection({ competitionLive, formatDateTime })
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
      ${event.registrationEnabled ? `
        <div style="margin-top:16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button type="button" class="${isRegistered ? 'btn-sec' : 'btn-main'}" data-event-registration-toggle ${canToggleRegistration ? '' : 'disabled'}>${escapeHtml(registrationSaving ? t('gym.eventsRegistrationUpdating') : buttonLabel)}</button>
        </div>
        ${registrationAvailabilityMessage && !isRegistered && !isCheckedIn ? `<div class="profile-subtitle" style="margin-top:8px;">${escapeHtml(registrationAvailabilityMessage)}</div>` : ''}
      ` : `<div class="profile-subtitle" style="margin-top:16px;">${escapeHtml(registrationAvailabilityMessage)}</div>`}
    </div>
  `;

  container.querySelector('[data-event-registration-toggle]')?.addEventListener('click', () => {
    if (!canToggleRegistration) return;
    onToggleRegistration?.(event, registration);
  });
}

function renderCompetitionLiveSection({ competitionLive = {}, formatDateTime = (value) => value || '-' } = {}) {
  return `
    <div style="margin-top:16px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px; background:rgba(255,255,255,0.02);">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
        <h5 style="margin:0; font-size:1rem;">Competition live</h5>
        <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; ${getCompetitionLiveBadgeStyle(competitionLive.status)}">${escapeHtml(competitionLive.status || 'draft')}</span>
      </div>
      <div class="gym-about-content" style="margin-top:10px;">
        ${competitionLive.label ? `<div class="gym-about-row"><span class="gym-about-label">Label</span><span class="gym-about-value">${escapeHtml(competitionLive.label)}</span></div>` : ''}
        ${competitionLive.format ? `<div class="gym-about-row"><span class="gym-about-label">Format</span><span class="gym-about-value">${escapeHtml(competitionLive.format)}</span></div>` : ''}
        ${competitionLive.startsAt ? `<div class="gym-about-row"><span class="gym-about-label">Starts</span><span class="gym-about-value">${escapeHtml(formatDateTime(competitionLive.startsAt))}</span></div>` : ''}
        ${competitionLive.endsAt ? `<div class="gym-about-row"><span class="gym-about-label">Ends</span><span class="gym-about-value">${escapeHtml(formatDateTime(competitionLive.endsAt))}</span></div>` : ''}
        ${competitionLive.notes ? `<div class="gym-about-row"><span class="gym-about-label">Notes</span><span class="gym-about-value" style="white-space:pre-wrap;">${escapeHtml(competitionLive.notes)}</span></div>` : ''}
      </div>
    </div>
  `;
}

function getCompetitionLiveBadgeStyle(status) {
  if (status === 'live') {
    return 'background:rgba(43,224,125,0.14); color:#62f29b; border:1px solid rgba(43,224,125,0.35);';
  }
  if (status === 'closed') {
    return 'background:rgba(255,107,107,0.14); color:#ff9b9b; border:1px solid rgba(255,107,107,0.35);';
  }
  return 'background:rgba(255,255,255,0.06); color:var(--muted); border:1px solid rgba(255,255,255,0.12);';
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
