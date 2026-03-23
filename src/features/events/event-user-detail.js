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
  competitionEntries = [],
  competitionEntriesLoading = false,
  competitionEntryLoading = false,
  competitionViewOpen = false,
  currentUserId = '',
  onToggleRegistration = null,
  onOpenCompetitionLive = null,
  onCloseCompetitionLive = null,
  onToggleCompetitionBlock = null,
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
    ? renderCompetitionLiveSection({ competitionLive, competitionEntry, competitionEntries, competitionEntriesLoading, competitionEntryLoading, competitionViewOpen, currentUserId, formatDateTime, hasCompetitionLiveCheckIn, t })
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
  container.querySelectorAll('[data-toggle-competition-block]').forEach((button) => {
    console.info('[competition-blocks] bind block button', {
      blockNumber: Number(button.dataset.blockNumber || 0),
      disabled: button.disabled,
      competitionEntryLoading,
      hasClickHandler: typeof onToggleCompetitionBlock === 'function',
      entryCompletedBlockNumbers: Array.isArray(competitionEntry?.completedBlockNumbers) ? [...competitionEntry.completedBlockNumbers] : [],
    });
    button.addEventListener('click', () => {
      const blockNumber = Number(button.dataset.blockNumber || 0);
      console.info('[competition-blocks] click received', {
        blockNumber,
        disabled: button.disabled,
        competitionEntryLoading,
        entryStatus: competitionEntry?.status || null,
        entryCompletedBlockNumbers: Array.isArray(competitionEntry?.completedBlockNumbers) ? [...competitionEntry.completedBlockNumbers] : [],
      });
      if (!Number.isInteger(blockNumber) || blockNumber <= 0) {
        console.warn('[competition-blocks] guard invalid blockNumber', { blockNumber });
        return;
      }
      onToggleCompetitionBlock?.(event, blockNumber, competitionEntry);
    });
  });
}

function renderCompetitionLiveSection({ competitionLive = {}, competitionEntry = null, competitionEntries = [], competitionEntriesLoading = false, competitionEntryLoading = false, competitionViewOpen = false, currentUserId = '', formatDateTime = (value) => value || '-', hasCompetitionLiveCheckIn = false, t = (key) => key } = {}) {
  const blocksCount = Number.isInteger(competitionLive?.blocksCount) && competitionLive.blocksCount > 0 ? competitionLive.blocksCount : 0;
  const completedBlockNumbers = getCompletedBlockNumbers(competitionEntry);
  const completedCount = completedBlockNumbers.length;
  const score = Number.isFinite(competitionEntry?.score) ? competitionEntry.score : completedCount;
  const isClosed = isCompetitionLiveClosed(competitionLive);
  const accessLabel = getCompetitionAccessLabel({ competitionEntryLoading, hasCompetitionLiveCheckIn, competitionEntry, competitionViewOpen, isClosed, t });
  const helperMessage = isClosed
    ? t('gym.eventsCompetitionClosedMessage')
    : (hasCompetitionLiveCheckIn ? t('gym.eventsCompetitionLiveReadyHint') : t('gym.eventsCompetitionLiveCheckInRequired'));
  const competitionViewSection = renderCompetitionLiveViewSection({
    blocksCount,
    completedBlockNumbers,
    competitionEntryLoading,
    disabled: !hasCompetitionLiveCheckIn || isClosed,
    t,
  });
  const leaderboardSection = renderCompetitionLiveLeaderboard({ competitionEntries, competitionEntriesLoading, currentUserId });

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
        ${competitionLive.endsAt ? `<div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionLiveEndsLabel'))}</span><span class="gym-about-value">${escapeHtml(formatDateTime(competitionLive.endsAt))}</span></div>` : ''}
        <div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionAccessLabel'))}</span><span class="gym-about-value">${escapeHtml(accessLabel)}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">Score</span><span class="gym-about-value">${escapeHtml(String(score))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">${escapeHtml(t('gym.eventsCompetitionCompletedLabel'))}</span><span class="gym-about-value">${escapeHtml(String(completedCount))}</span></div>
        <div class="gym-about-row"><span class="gym-about-label">Blocchi gara</span><span class="gym-about-value">${escapeHtml(String(blocksCount))}</span></div>
      </div>
      <div class="profile-subtitle" style="margin-top:10px;">${escapeHtml(helperMessage)}</div>
      ${leaderboardSection}
      ${competitionViewSection}
    </div>
  `;
}

function renderCompetitionLiveViewSection({ blocksCount = 0, completedBlockNumbers = [], competitionEntryLoading = false, disabled = false, t = (key) => key } = {}) {
  const blocks = Array.from({ length: Math.max(0, blocksCount) }, (_, index) => index + 1);
  const completedBlocks = new Set(completedBlockNumbers);
  return `
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); display:grid; gap:10px;">
      <div>
        <div style="font-size:0.92rem; font-weight:700;">Blocchi gara</div>
        <div style="color:var(--muted); font-size:0.82rem; margin-top:4px;">Tocca un blocco per segnare o rimuovere il completamento.</div>
      </div>
      ${blocks.length ? `
        <div style="display:grid; gap:10px; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));">
          ${blocks.map((blockNumber) => renderCompetitionLiveBlockButton({
            blockNumber,
            completed: completedBlocks.has(blockNumber),
            disabled: competitionEntryLoading || disabled,
          })).join('')}
        </div>
      ` : `<div class="profile-subtitle">Nessun blocco configurato.</div>`}
    </div>
  `;
}

function renderCompetitionLiveBlockButton({ blockNumber = 0, completed = false, disabled = false } = {}) {
  const borderColor = completed ? 'rgba(98,242,155,0.42)' : 'rgba(255,255,255,0.12)';
  const background = completed
    ? 'linear-gradient(180deg, rgba(98,242,155,0.20) 0%, rgba(98,242,155,0.12) 100%)'
    : 'rgba(255,255,255,0.03)';
  const badgeBackground = completed ? 'rgba(98,242,155,0.18)' : 'rgba(255,255,255,0.06)';
  const badgeColor = completed ? '#62f29b' : 'var(--muted)';
  return `
    <button
      type="button"
      data-toggle-competition-block
      data-block-number="${escapeHtml(String(blockNumber))}"
      ${disabled ? 'disabled' : ''}
      aria-pressed="${completed ? 'true' : 'false'}"
      style="min-height:88px; display:grid; gap:8px; place-items:center; padding:14px 12px; border-radius:16px; border:1px solid ${borderColor}; background:${background}; box-shadow:${completed ? '0 10px 24px rgba(98,242,155,0.12)' : '0 8px 18px rgba(15,23,42,0.10)'}; transition:transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; ${disabled ? 'opacity:0.65; cursor:not-allowed;' : 'cursor:pointer;'}"
    >
      <span style="font-size:1.2rem; font-weight:800; color:var(--text);">#${escapeHtml(String(blockNumber))}</span>
      <span style="display:inline-flex; align-items:center; justify-content:center; min-width:100%; padding:6px 10px; border-radius:999px; background:${badgeBackground}; color:${badgeColor}; font-size:0.79rem; font-weight:700;">
        ${escapeHtml(completed ? '✅ Completata' : '○ Non completata')}
      </span>
    </button>
  `;
}

function renderCompetitionLiveLeaderboard({ competitionEntries = [], competitionEntriesLoading = false, currentUserId = '' } = {}) {
  if (competitionEntriesLoading) {
    return `<div style="margin-top:12px; color:var(--muted); font-size:0.85rem;">Caricamento classifica...</div>`;
  }

  if (!Array.isArray(competitionEntries) || !competitionEntries.length) {
    return `<div style="margin-top:12px; color:var(--muted); font-size:0.85rem;">Classifica non disponibile.</div>`;
  }

  return `
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); display:grid; gap:8px;">
      <div style="font-size:0.92rem; font-weight:700;">Leaderboard live</div>
      ${competitionEntries.map((entry, index) => {
        const isCurrentUser = String(entry?.userId || '') && String(entry?.userId || '') === String(currentUserId || '');
        const topRank = index + 1;
        const badge = topRank === 1 ? '🥇' : (topRank === 2 ? '🥈' : (topRank === 3 ? '🥉' : `#${topRank}`));
        const rowStyle = isCurrentUser
          ? 'border:1px solid rgba(98,242,155,0.45); background:rgba(98,242,155,0.10); box-shadow:0 0 0 1px rgba(98,242,155,0.12) inset;'
          : (topRank <= 3
            ? 'border:1px solid rgba(255,215,102,0.24); background:rgba(255,215,102,0.06);'
            : 'border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);');
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px; border-radius:10px; ${rowStyle}">
          <div style="display:grid; gap:2px;">
            <span style="font-weight:700;">${escapeHtml(String(badge))}</span>
            <span style="color:${isCurrentUser ? '#62f29b' : 'var(--muted)'}; font-size:0.85rem; font-weight:${isCurrentUser ? '700' : '500'};">${escapeHtml(resolveCompetitionEntryLabel(entry, index))}${isCurrentUser ? ' · Tu' : ''}</span>
          </div>
          <div style="font-weight:700;">${escapeHtml(String(Number(entry?.score || 0)))}</div>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function getCompletedBlockNumbers(competitionEntry = null) {
  const values = Array.isArray(competitionEntry?.completedBlockNumbers) ? competitionEntry.completedBlockNumbers : [];
  return Array.from(new Set(values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0))).sort((a, b) => a - b);
}

function resolveCompetitionEntryLabel(entry = {}, index = 0) {
  return resolveReadableCompetitionEntryLabel(entry) || `Partecipante ${index + 1}`;
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

function resolveReadableCompetitionEntryLabel(entry = {}) {
  const displayName = String(entry?.displayName || '').trim();
  if (displayName) return displayName;
  const username = String(entry?.username || '').trim();
  if (username) return username;
  const firstName = String(entry?.firstName || '').trim();
  const lastName = String(entry?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (firstName) return firstName;
  return '';
}
