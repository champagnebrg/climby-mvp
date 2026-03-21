import { getDefaultCompetitionLive, normalizeCompetitionLive } from './event-model.js';

export function renderAdminEventEditor({
  container,
  event = null,
  draft = null,
  registrations = [],
  registrationCount = 0,
  registrationsLoading = false,
  competitionEntries = [],
  competitionEntriesLoading = false,
  availableSectors = [],
  formatDateTime = (value) => value || '-',
  onSave = null,
  onPublish = null,
  onEnd = null,
  onCancel = null,
  onUpdateRegistrationStatus = null,
  registrationStatusSavingUserId = '',
  registrationsSearch = '',
  onRegistrationsSearchChange = null,
  t = (key) => key,
} = {}) {
  if (!container) return;

  const record = draft || event || {};
  const status = record.status || 'draft';
  const canPublish = status === 'draft' && !!event?.id;
  const canEnd = status === 'published' && !!event?.id;
  const canCancel = (status === 'draft' || status === 'published') && !!event?.id;
  const competitionLive = normalizeCompetitionLive(record.competition_live || getDefaultCompetitionLive());
  const competitionLiveFieldsDisabled = !competitionLive.enabled;
  const normalizedAvailableSectors = normalizeAvailableSectors(availableSectors);
  const competitionLiveUsesEventSchedule = !competitionLive.startsAt && !competitionLive.endsAt;

  const registrationRows = event?.id
    ? renderRegistrationRows({ registrations, registrationsLoading, registrationsSearch, t, formatDateTime, registrationStatusSavingUserId })
    : '';
  const competitionLeaderboard = competitionLive.enabled
    ? renderCompetitionLeaderboard({ competitionEntries, competitionEntriesLoading, registrations })
    : '';

  container.innerHTML = `
    <div class="admin-tab-header">
      <div>
        <h4 class="admin-section-title" style="margin:0;">${escapeHtml(event?.id ? t('admin.eventsEditTitle') : t('admin.eventsCreateTitle'))}</h4>
        <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsEditorHint'))}</p>
      </div>
    </div>
    <form id="admin-event-form" class="card admin-block-card" style="display:block;">
      <div style="display:grid; gap:16px;">
        ${renderSection({
          title: t('admin.eventsSectionBasicTitle'),
          hint: t('admin.eventsSectionBasicHint'),
          content: `
            <div class="admin-gym-form">
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldTitle'))}</span>
                <input type="text" id="admin-event-title" value="${escapeHtml(record.title || '')}" placeholder="${escapeHtml(t('admin.eventsFieldTitle'))}">
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldSummary'))}</span>
                <input type="text" id="admin-event-summary" value="${escapeHtml(record.summary || '')}" placeholder="${escapeHtml(t('admin.eventsFieldSummary'))}">
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldStartsAt'))}</span>
                <input type="datetime-local" id="admin-event-starts-at" value="${escapeHtml(toDateTimeLocalValue(record.startsAt))}">
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldEndsAt'))}</span>
                <input type="datetime-local" id="admin-event-ends-at" value="${escapeHtml(toDateTimeLocalValue(record.endsAt))}">
              </label>
              <label class="full" style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldDescription'))}</span>
                <textarea id="admin-event-description" rows="5" placeholder="${escapeHtml(t('admin.eventsFieldDescription'))}">${escapeHtml(record.description || '')}</textarea>
              </label>
              <div class="full" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsEventStatusLabel'))}</span>
                <span class="admin-file-chip">${escapeHtml(t(`admin.eventsStatus${capitalize(status)}`))}</span>
              </div>
            </div>
          `,
        })}

        ${renderSection({
          title: t('admin.eventsSectionRegistrationTitle'),
          hint: t('admin.eventsSectionRegistrationHint'),
          content: `
            <div class="admin-gym-form">
              <label class="admin-toggle full"><input type="checkbox" id="admin-event-registration-enabled" ${record.registrationEnabled ? 'checked' : ''}><span>${escapeHtml(t('admin.eventsRegistrationDisabledHint'))}</span></label>
            </div>
          `,
        })}

        ${renderSection({
          title: t('admin.eventsSectionCompetitionTitle'),
          hint: t('admin.eventsSectionCompetitionHint'),
          content: `
            <div class="admin-gym-form">
              <label class="admin-toggle full"><input type="checkbox" id="admin-event-competition-live-enabled" ${competitionLive.enabled ? 'checked' : ''}><span>${escapeHtml(t('admin.eventsCompetitionEnabled'))}</span></label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionStatusLabel'))}</span>
                <select id="admin-event-competition-live-status" data-competition-live-field ${competitionLiveFieldsDisabled ? 'disabled' : ''}>
                  ${renderCompetitionLiveStatusOptions(competitionLive.status, t)}
                </select>
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionFormatLabel'))}</span>
                <input type="text" id="admin-event-competition-live-format" data-competition-live-field ${competitionLiveFieldsDisabled ? 'disabled' : ''} value="${escapeHtml(competitionLive.format || '')}" placeholder="${escapeHtml(t('admin.eventsCompetitionFormatPlaceholder'))}">
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionTypeLabel'))}</span>
                <select id="admin-event-competition-live-route-selection-mode" data-competition-live-field ${competitionLiveFieldsDisabled ? 'disabled' : ''}>
                  ${renderCompetitionLiveRouteSelectionModeOptions(competitionLive.routeSelectionMode, t)}
                </select>
              </label>
              <label class="full" style="display:grid; gap:6px;">
                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionSectorLabel'))}</span>
                <select id="admin-event-competition-live-sector-ids" data-competition-live-field multiple size="${Math.max(3, Math.min(normalizedAvailableSectors.length || 3, 8))}" ${competitionLiveFieldsDisabled ? 'disabled' : ''}>
                  ${renderCompetitionLiveSectorOptions(normalizedAvailableSectors, competitionLive.sectorIds)}
                </select>
                <span style="font-size:0.78rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionSectorHint'))}</span>
              </label>
              ${!normalizedAvailableSectors.length ? `<p class="full" style="margin:0; color:var(--muted); font-size:0.82rem;">${escapeHtml(t('admin.eventsCompetitionNoSectors'))}</p>` : ''}
              <label class="admin-toggle full"><input type="checkbox" id="admin-event-competition-live-use-event-schedule" ${competitionLiveUsesEventSchedule ? 'checked' : ''}><span>${escapeHtml(t('admin.eventsCompetitionUseEventSchedule'))}</span></label>
              <div class="full" style="display:grid; gap:10px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
                <div style="color:var(--muted); font-size:0.82rem;">${escapeHtml(t('admin.eventsCompetitionScheduleHint'))}</div>
                <div class="admin-gym-form" style="gap:10px;">
                  <label style="display:grid; gap:6px;">
                    <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionStartsAtLabel'))}</span>
                    <input type="datetime-local" id="admin-event-competition-live-starts-at" data-competition-live-field data-competition-live-schedule-field ${competitionLiveFieldsDisabled || competitionLiveUsesEventSchedule ? 'disabled' : ''} value="${escapeHtml(toDateTimeLocalValue(competitionLive.startsAt))}">
                  </label>
                  <label style="display:grid; gap:6px;">
                    <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionEndsAtLabel'))}</span>
                    <input type="datetime-local" id="admin-event-competition-live-ends-at" data-competition-live-field data-competition-live-schedule-field ${competitionLiveFieldsDisabled || competitionLiveUsesEventSchedule ? 'disabled' : ''} value="${escapeHtml(toDateTimeLocalValue(competitionLive.endsAt))}">
                  </label>
                </div>
              </div>
              <div class="full" style="display:grid; gap:10px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
                <div>
                  <div style="font-weight:700;">Competition live leaderboard</div>
                  <div style="color:var(--muted); font-size:0.82rem; margin-top:4px;">Classifica admin basata sul punteggio live salvato.</div>
                </div>
                ${competitionLeaderboard}
              </div>
            </div>
          `,
        })}

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:2px;">
          <button type="submit" class="btn-main">${escapeHtml(t('admin.eventsSave'))}</button>
          ${canPublish ? `<button type="button" class="btn-sec" id="admin-event-publish-btn">${escapeHtml(t('admin.publish'))}</button>` : ''}
          ${canEnd ? `<button type="button" class="btn-sec" id="admin-event-end-btn">${escapeHtml(t('admin.eventsEnd'))}</button>` : ''}
          ${canCancel ? `<button type="button" class="btn-danger-soft" id="admin-event-cancel-btn">${escapeHtml(t('admin.eventsCancel'))}</button>` : ''}
        </div>
      </div>
    </form>
    ${event?.id ? `
      <div class="card admin-block-card" style="display:block; margin-top:12px;">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
          <div>
            <h4 class="admin-section-title" style="margin:0;">${escapeHtml(t('admin.eventsRegistrationsTitle'))}</h4>
            <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsRegistrationsHint'))}</p>
          </div>
          <span class="admin-file-chip">${escapeHtml(String(registrationCount))} ${escapeHtml(t('admin.eventsParticipantsCount'))}</span>
        </div>
        <div style="margin-top:12px; display:grid; gap:8px;">
          <input type="search" id="admin-event-registrations-search" value="${escapeHtml(registrationsSearch || '')}" placeholder="${escapeHtml(t('admin.eventsRegistrationsSearchPlaceholder'))}">
          ${registrationRows}
        </div>
      </div>
    ` : ''}
  `;

  const form = container.querySelector('#admin-event-form');
  if (form) {
    form.onsubmit = (eventObj) => {
      eventObj.preventDefault();
      onSave?.(readFormPayload(container, record));
    };
  }
  syncCompetitionLiveFieldsState(container);
  const competitionLiveEnabled = container.querySelector('#admin-event-competition-live-enabled');
  if (competitionLiveEnabled) {
    competitionLiveEnabled.addEventListener('change', () => syncCompetitionLiveFieldsState(container));
  }
  const competitionLiveScheduleToggle = container.querySelector('#admin-event-competition-live-use-event-schedule');
  if (competitionLiveScheduleToggle) {
    competitionLiveScheduleToggle.addEventListener('change', () => syncCompetitionLiveFieldsState(container));
  }
  const publishBtn = container.querySelector('#admin-event-publish-btn');
  if (publishBtn) publishBtn.onclick = () => onPublish?.();
  const endBtn = container.querySelector('#admin-event-end-btn');
  if (endBtn) endBtn.onclick = () => onEnd?.();
  const cancelBtn = container.querySelector('#admin-event-cancel-btn');
  if (cancelBtn) cancelBtn.onclick = () => onCancel?.();
  container.querySelector('#admin-event-registrations-search')?.addEventListener('input', (eventObj) => {
    onRegistrationsSearchChange?.(eventObj.target?.value || '');
  });
  container.querySelectorAll('[data-registration-status]').forEach((button) => {
    button.onclick = () => onUpdateRegistrationStatus?.({
      userId: button.dataset.registrationUserId || '',
      status: button.dataset.registrationStatus || '',
    });
  });
}

function renderCompetitionLeaderboard({ competitionEntries = [], competitionEntriesLoading = false, registrations = [] } = {}) {
  if (competitionEntriesLoading) {
    return '<div style="color:var(--muted); font-size:0.85rem;">Caricamento punteggi...</div>';
  }

  if (!competitionEntries.length) {
    return '<div style="color:var(--muted); font-size:0.85rem;">Nessun punteggio disponibile</div>';
  }

  return `<div style="display:grid; gap:8px;">${competitionEntries.map((entry, index) => renderCompetitionLeaderboardRow(entry, index, registrations)).join('')}</div>`;
}

function renderCompetitionLeaderboardRow(entry = {}, index = 0, registrations = []) {
  const label = resolveCompetitionEntryLabel(entry, registrations, index);
  return `
    <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:10px; background:rgba(255,255,255,0.02);">
      <div style="display:grid; gap:2px;">
        <div style="font-weight:600;">#${index + 1} ${escapeHtml(label)}</div>
      </div>
      <div style="font-weight:700;">${escapeHtml(String(Number(entry.score || 0)))}</div>
    </div>
  `;
}

function resolveCompetitionEntryLabel(entry = {}, registrations = [], index = 0) {
  const registration = (Array.isArray(registrations) ? registrations : [])
    .find((item) => String(item?.userId || '') === String(entry?.userId || ''));
  return registration?.displayName
    || registration?.username
    || registration?.name
    || entry?.displayName
    || entry?.username
    || entry?.name
    || `Partecipante #${index + 1}`;
}

export function readFormPayload(container, record = {}) {
  const currentCompetitionLive = normalizeCompetitionLive(record.competition_live || getDefaultCompetitionLive());
  const useEventSchedule = Boolean(container.querySelector('#admin-event-competition-live-use-event-schedule')?.checked);
  return {
    title: container.querySelector('#admin-event-title')?.value || '',
    summary: container.querySelector('#admin-event-summary')?.value || '',
    description: container.querySelector('#admin-event-description')?.value || '',
    startsAt: fromDateTimeLocalValue(container.querySelector('#admin-event-starts-at')?.value || ''),
    endsAt: fromDateTimeLocalValue(container.querySelector('#admin-event-ends-at')?.value || ''),
    registrationEnabled: Boolean(container.querySelector('#admin-event-registration-enabled')?.checked),
    competition_live: normalizeCompetitionLive({
      ...currentCompetitionLive,
      enabled: Boolean(container.querySelector('#admin-event-competition-live-enabled')?.checked),
      status: container.querySelector('#admin-event-competition-live-status')?.value || currentCompetitionLive.status,
      format: container.querySelector('#admin-event-competition-live-format')?.value || '',
      label: currentCompetitionLive.label,
      routeSelectionMode: container.querySelector('#admin-event-competition-live-route-selection-mode')?.value || currentCompetitionLive.routeSelectionMode,
      sectorIds: readSelectedOptions(container.querySelector('#admin-event-competition-live-sector-ids')),
      startsAt: useEventSchedule ? '' : fromDateTimeLocalValue(container.querySelector('#admin-event-competition-live-starts-at')?.value || ''),
      endsAt: useEventSchedule ? '' : fromDateTimeLocalValue(container.querySelector('#admin-event-competition-live-ends-at')?.value || ''),
      notes: currentCompetitionLive.notes,
      updatedAt: new Date().toISOString(),
    }),
  };
}

function renderSection({ title = '', hint = '', content = '' }) {
  return `
    <section style="display:grid; gap:10px; padding:14px; border:1px solid rgba(255,255,255,0.08); border-radius:16px;">
      <div>
        <h5 style="margin:0; font-size:1rem;">${escapeHtml(title)}</h5>
        <p style="margin:4px 0 0; color:var(--muted); font-size:0.85rem;">${escapeHtml(hint)}</p>
      </div>
      ${content}
    </section>
  `;
}

function renderCompetitionLiveStatusOptions(selectedValue = 'draft', t = (key) => key) {
  const options = ['draft', 'live', 'closed'];
  return options.map((value) => `<option value="${escapeHtml(value)}" ${selectedValue === value ? 'selected' : ''}>${escapeHtml(t(`admin.eventsCompetitionStatus${capitalize(value)}`))}</option>`).join('');
}

function renderCompetitionLiveRouteSelectionModeOptions(selectedValue = 'all', t = (key) => key) {
  const options = ['all', 'manual'];
  return options.map((value) => `<option value="${escapeHtml(value)}" ${selectedValue === value ? 'selected' : ''}>${escapeHtml(t(`admin.eventsCompetitionType${capitalize(value)}`))}</option>`).join('');
}

function renderCompetitionLiveSectorOptions(sectors = [], selectedSectorIds = []) {
  const selected = new Set(Array.isArray(selectedSectorIds) ? selectedSectorIds : []);
  return sectors
    .map((sector) => `<option value="${escapeHtml(sector.sectorId)}" ${selected.has(sector.sectorId) ? 'selected' : ''}>${escapeHtml(sector.sectorName)}</option>`)
    .join('');
}

function normalizeAvailableSectors(sectors = []) {
  if (!Array.isArray(sectors)) return [];
  const seen = new Set();
  return sectors
    .map((sector) => ({
      sectorId: String(sector?.sectorId || '').trim(),
      sectorName: String(sector?.sectorName || sector?.name || sector?.sectorId || '').trim(),
    }))
    .filter((sector) => {
      if (!sector.sectorId || seen.has(sector.sectorId)) return false;
      seen.add(sector.sectorId);
      return true;
    });
}

function readSelectedOptions(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions || [])
    .map((option) => option?.value || '')
    .filter(Boolean);
}

function syncCompetitionLiveFieldsState(container) {
  const enabled = Boolean(container.querySelector('#admin-event-competition-live-enabled')?.checked);
  const useEventSchedule = Boolean(container.querySelector('#admin-event-competition-live-use-event-schedule')?.checked);
  container.querySelectorAll('[data-competition-live-field]').forEach((field) => {
    field.disabled = !enabled;
  });
  container.querySelectorAll('[data-competition-live-schedule-field]').forEach((field) => {
    field.disabled = !enabled || useEventSchedule;
  });
}

function toDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRegistrationRows({ registrations = [], registrationsLoading = false, registrationsSearch = '', t = (key) => key, formatDateTime = (value) => value || '-', registrationStatusSavingUserId = '' } = {}) {
  if (registrationsLoading) {
    return `<div style="color:var(--muted);">${escapeHtml(t('admin.eventsRegistrationsLoading'))}</div>`;
  }

  const searchValue = String(registrationsSearch || '').trim().toLowerCase();
  const filteredRegistrations = registrations
    .filter((registration) => {
      if (!searchValue) return true;
      const displayName = String(registration.displayName || '').toLowerCase();
      const username = String(registration.username || '').toLowerCase();
      return displayName.includes(searchValue) || username.includes(searchValue);
    })
    .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' }));

  if (!filteredRegistrations.length) {
    return `<div style="color:var(--muted);">${escapeHtml(searchValue ? t('admin.eventsRegistrationsSearchEmpty') : t('admin.eventsRegistrationsEmpty'))}</div>`;
  }

  return filteredRegistrations.map((registration) => {
    const isSaving = registrationStatusSavingUserId && registrationStatusSavingUserId === registration.userId;
    const canCheckIn = registration.status === 'registered';
    const canUndoCheckIn = registration.status === 'checked_in';
    const canCancel = registration.status === 'registered';
    return `
    <div style="display:grid; gap:10px; padding:10px 12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
        <div>
          <div style="font-weight:700; font-size:1rem;">${escapeHtml(registration.displayName || '-')}</div>
          ${registration.username ? `<div style="color:var(--muted); font-size:0.82rem; margin-top:2px;">@${escapeHtml(registration.username)}</div>` : ''}
          <div style="color:var(--muted); font-size:0.78rem; margin-top:4px;">${escapeHtml(t('admin.eventsRegistrationsRegisteredAt'))}: ${escapeHtml(formatDateTime(registration.registeredAt))}</div>
        </div>
        <span class="admin-file-chip">${escapeHtml(t(`gym.eventsRegistration${capitalize(registration.status || 'NotRegistered')}`))}</span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        ${canCheckIn ? `<button type="button" class="btn-main" data-registration-status="checked_in" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>${escapeHtml(t('admin.eventsRegistrationCheckIn'))}</button>` : ''}
        ${canUndoCheckIn ? `<button type="button" class="btn-sec" data-registration-status="registered" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>${escapeHtml(t('admin.eventsRegistrationUndoCheckIn'))}</button>` : ''}
        ${canCancel ? `<button type="button" class="btn-danger-soft" data-registration-status="cancelled" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>${escapeHtml(t('admin.eventsCancelRegistration'))}</button>` : ''}
        ${isSaving ? `<span style="color:var(--muted); font-size:0.82rem;">${escapeHtml(t('gym.eventsRegistrationUpdating'))}</span>` : ''}
      </div>
    </div>
  `;
  }).join('');
}

function capitalize(value) {
  const raw = String(value || '');
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
}
