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
  const registrationRows = event?.id
    ? renderRegistrationRows({ registrations, registrationsLoading, registrationsSearch, t, formatDateTime, registrationStatusSavingUserId })
    : '';
  const competitionLeaderboard = event?.id && competitionLive.enabled
    ? renderCompetitionLeaderboard({ competitionEntries, competitionEntriesLoading, registrations, categories: Array.isArray(competitionLive.categories) ? competitionLive.categories.filter((category) => category?.enabled && category?.id) : [], t })
    : '';
  container.innerHTML = `
    <div class="admin-tab-header">
      <div>
        <h4 class="admin-section-title" style="margin:0;">${escapeHtml(event?.id ? t('admin.eventsEditTitle') : t('admin.eventsCreateTitle'))}</h4>
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
              <div class="full" style="display:grid; gap:12px; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); align-items:end;">
                <label style="display:grid; gap:6px; min-width:0;">
                  <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldStartsAt'))}</span>
                  <input type="datetime-local" id="admin-event-starts-at" value="${escapeHtml(toDateTimeLocalValue(record.startsAt))}" style="width:100%;">
                </label>
                <label style="display:grid; gap:6px; min-width:0;">
                  <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsFieldEndsAt'))}</span>
                  <input type="datetime-local" id="admin-event-ends-at" value="${escapeHtml(toDateTimeLocalValue(record.endsAt))}" style="width:100%;">
                </label>
              </div>
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
	                <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionBlocksCountLabel'))}</span>
	                <input type="number" min="0" step="1" id="admin-event-competition-live-blocks-count" data-competition-live-field ${competitionLiveFieldsDisabled ? 'disabled' : ''} value="${escapeHtml(String(Number.isFinite(competitionLive.blocksCount) ? competitionLive.blocksCount : 0))}" placeholder="${escapeHtml(t('admin.eventsCompetitionBlocksCountPlaceholder'))}">
	              </label>
                <div class="full" style="display:grid; gap:8px;">
                  <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
                    <div>
                      <span style="font-size:0.85rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionCategoriesLabel'))}</span>
                      <p style="margin:4px 0 0; color:var(--muted); font-size:0.8rem;">${escapeHtml(t('admin.eventsCompetitionCategoriesHint'))}</p>
                    </div>
                    <button type="button" class="btn-sec" id="admin-event-competition-live-category-add" data-competition-live-field ${competitionLiveFieldsDisabled ? 'disabled' : ''}>${escapeHtml(t('admin.eventsCompetitionAddCategory'))}</button>
                  </div>
                  <div id="admin-event-competition-live-categories-list" style="display:grid; gap:8px;">
                    ${renderCompetitionLiveCategoryRows(competitionLive.categories, t)}
                  </div>
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
        ${event?.id && competitionLive.enabled ? `
          <div class="card admin-block-card" style="display:block; margin-top:12px;">
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;">
              <div>
                <h4 class="admin-section-title" style="margin:0;">${escapeHtml(t('admin.eventsCompetitionLeaderboardTitle'))}</h4>
                <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsCompetitionLeaderboardHint'))}</p>
              </div>
              <span class="admin-file-chip">${escapeHtml(String(Array.isArray(competitionEntries) ? competitionEntries.length : 0))} ${escapeHtml(t('admin.eventsParticipantsCount'))}</span>
            </div>
            <div style="margin-top:12px; display:grid; gap:8px;">
              ${competitionLeaderboard}
            </div>
          </div>
        ` : ''}
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
  bindCompetitionLiveCategoryActions(container, t);
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

function renderCompetitionLeaderboard({ competitionEntries = [], competitionEntriesLoading = false, registrations = [], categories = [], t = (key) => key } = {}) {
  if (competitionEntriesLoading) {
    return `<div style="color:var(--muted); font-size:0.85rem;">${escapeHtml(t('admin.eventsCompetitionScoresLoading'))}</div>`;
  }

  if (!competitionEntries.length) {
    return `<div style="color:var(--muted); font-size:0.85rem;">${escapeHtml(t('admin.eventsCompetitionScoresEmpty'))}</div>`;
  }

  const groups = buildCompetitionLeaderboardGroups(competitionEntries, categories);
  return `<div style="display:grid; gap:12px;">${groups.map((group) => renderCompetitionLeaderboardGroup(group, registrations, t)).join('')}</div>`;
}

function renderCompetitionLeaderboardGroup(group = {}, registrations = [], t = (key) => key) {
  const entries = Array.isArray(group.entries) ? group.entries : [];
  return `
    <div style="display:grid; gap:8px;">
      ${group.label ? `<div style="font-size:0.9rem; font-weight:700;">${escapeHtml(group.label)}</div>` : ''}
      ${entries.length
        ? entries.map((entry, index) => renderCompetitionLeaderboardRow(entry, index, registrations, t)).join('')
        : `<div style="color:var(--muted); font-size:0.85rem;">${escapeHtml(t('admin.eventsCompetitionScoresEmpty'))}</div>`}
    </div>
  `;
}

function renderCompetitionLeaderboardRow(entry = {}, index = 0, registrations = [], t = (key) => key) {
  const label = resolveCompetitionEntryLabel(entry, registrations, index, t);
  const rank = index + 1;
  const badge = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
  const rowStyle = rank <= 3
    ? 'border:1px solid rgba(255,215,102,0.24); background:rgba(255,215,102,0.06);'
    : 'border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);';
  return `
    <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; padding:10px; border-radius:10px; ${rowStyle}">
      <div style="display:grid; gap:2px;">
        <div style="font-weight:700;">${escapeHtml(String(badge))}</div>
        <div style="color:var(--muted); font-size:0.9rem;">${escapeHtml(label)}</div>
      </div>
      <div style="font-weight:700;">${escapeHtml(String(Number(entry.score || 0)))}</div>
    </div>
  `;
}

function resolveCompetitionEntryLabel(entry = {}, registrations = [], index = 0, t = (key) => key) {
  const registration = (Array.isArray(registrations) ? registrations : [])
    .find((item) => String(item?.userId || '') === String(entry?.userId || ''));
  return resolveReadableCompetitionEntryLabel(registration)
    || resolveReadableCompetitionEntryLabel(entry)
    || `${t('admin.eventsCompetitionParticipantLabel')} #${index + 1}`;
}

function buildCompetitionLeaderboardGroups(competitionEntries = [], categories = []) {
  const safeEntries = Array.isArray(competitionEntries) ? competitionEntries : [];
  const safeCategories = Array.isArray(categories) ? categories.filter((category) => category?.id) : [];
  if (!safeCategories.length) {
    return [{ label: '', entries: safeEntries }];
  }
  return safeCategories.map((category) => ({
    label: category.label || category.id,
    entries: safeEntries.filter((entry) => String(entry?.categoryId || '') === String(category.id || '')),
  }));
}

export function readFormPayload(container, record = {}) {
  const currentCompetitionLive = normalizeCompetitionLive(record.competition_live || getDefaultCompetitionLive());
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
      blocksCount: Number(container.querySelector('#admin-event-competition-live-blocks-count')?.value || currentCompetitionLive.blocksCount || 0),
      categories: readCompetitionLiveCategories(container),
      format: currentCompetitionLive.format,
      label: currentCompetitionLive.label,
      startsAt: currentCompetitionLive.startsAt,
      endsAt: currentCompetitionLive.endsAt,
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

function syncCompetitionLiveFieldsState(container) {
  const enabled = Boolean(container.querySelector('#admin-event-competition-live-enabled')?.checked);
  container.querySelectorAll('[data-competition-live-field]').forEach((field) => {
    field.disabled = !enabled;
  });
}

function renderCompetitionLiveCategoryRows(categories = [], t = (key) => key) {
  if (!Array.isArray(categories) || !categories.length) {
    return renderCompetitionLiveCategoryRow({}, t);
  }
  return categories.map((category) => renderCompetitionLiveCategoryRow(category, t)).join('');
}

function renderCompetitionLiveCategoryRow(category = {}, t = (key) => key) {
  return `
    <div data-competition-live-category-row style="display:grid; gap:8px; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
      <input type="hidden" data-competition-live-category-id value="${escapeHtml(category.id || '')}">
      <div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:end;">
        <label style="display:grid; gap:6px;">
          <span style="font-size:0.8rem; color:var(--muted);">${escapeHtml(t('admin.eventsCompetitionCategoryNameLabel'))}</span>
          <input type="text" data-competition-live-category-label data-competition-live-field value="${escapeHtml(category.label || '')}" placeholder="${escapeHtml(t('admin.eventsCompetitionCategoryNamePlaceholder'))}">
        </label>
        <button type="button" class="btn-danger-soft" data-competition-live-category-remove data-competition-live-field>${escapeHtml(t('admin.eventsCompetitionRemoveCategory'))}</button>
      </div>
      <label class="admin-toggle"><input type="checkbox" data-competition-live-category-enabled data-competition-live-field ${category.enabled !== false ? 'checked' : ''}><span>${escapeHtml(t('admin.eventsCompetitionCategoryEnabled'))}</span></label>
    </div>
  `;
}

function bindCompetitionLiveCategoryActions(container, t = (key) => key) {
  const addButton = container.querySelector('#admin-event-competition-live-category-add');
  if (addButton) {
    addButton.onclick = () => addCompetitionLiveCategoryRow(container, {}, t);
  }
  container.querySelector('#admin-event-competition-live-categories-list')?.addEventListener('click', (eventObj) => {
    const removeButton = eventObj.target?.closest?.('[data-competition-live-category-remove]');
    if (!removeButton) return;
    const row = removeButton.closest('[data-competition-live-category-row]');
    row?.remove();
    ensureCompetitionLiveCategoriesListNotEmpty(container, t);
  });
}

function addCompetitionLiveCategoryRow(container, category = {}, t = (key) => key) {
  const list = container.querySelector('#admin-event-competition-live-categories-list');
  if (!list) return;
  list.insertAdjacentHTML('beforeend', renderCompetitionLiveCategoryRow(category, t));
  syncCompetitionLiveFieldsState(container);
}

function ensureCompetitionLiveCategoriesListNotEmpty(container, t = (key) => key) {
  const list = container.querySelector('#admin-event-competition-live-categories-list');
  if (!list || list.querySelector('[data-competition-live-category-row]')) return;
  addCompetitionLiveCategoryRow(container, {}, t);
}

function readCompetitionLiveCategories(container) {
  return Array.from(container.querySelectorAll('[data-competition-live-category-row]'))
    .map((row, index) => {
      const label = row.querySelector('[data-competition-live-category-label]')?.value || '';
      const storedId = row.querySelector('[data-competition-live-category-id]')?.value || '';
      return {
        id: storedId || buildCompetitionLiveCategoryId(label, index),
        label,
        order: index,
        enabled: Boolean(row.querySelector('[data-competition-live-category-enabled]')?.checked),
      };
    });
}

function buildCompetitionLiveCategoryId(label = '', index = 0) {
  const normalized = String(label || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || `category-${index + 1}`;
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
    .sort((a, b) => {
      const priority = getRegistrationStatusPriority(a?.status) - getRegistrationStatusPriority(b?.status);
      if (priority !== 0) return priority;
      return String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' });
    });

  if (!filteredRegistrations.length) {
    return `<div style="color:var(--muted);">${escapeHtml(searchValue ? t('admin.eventsRegistrationsSearchEmpty') : t('admin.eventsRegistrationsEmpty'))}</div>`;
  }

  const summary = {
    registered: filteredRegistrations.filter((registration) => registration.status === 'registered').length,
    checkedIn: filteredRegistrations.filter((registration) => registration.status === 'checked_in').length,
    cancelled: filteredRegistrations.filter((registration) => registration.status === 'cancelled').length,
  };

  return `
  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
    <span class="admin-file-chip">${escapeHtml(t('admin.eventsRegistrationsSummaryPending'))}: ${escapeHtml(String(summary.registered))}</span>
    <span class="admin-file-chip">${escapeHtml(t('admin.eventsRegistrationsSummaryCheckedIn'))}: ${escapeHtml(String(summary.checkedIn))}</span>
    <span class="admin-file-chip">${escapeHtml(t('admin.eventsRegistrationsSummaryCancelled'))}: ${escapeHtml(String(summary.cancelled))}</span>
  </div>
  ${filteredRegistrations.map((registration) => {
    const isSaving = registrationStatusSavingUserId && registrationStatusSavingUserId === registration.userId;
    const canCheckIn = registration.status === 'registered';
    const canUndoCheckIn = registration.status === 'checked_in';
    const canCancel = registration.status === 'registered';
    const statusMeta = getRegistrationStatusMeta(registration.status, t);
    return `
	    <div style="display:grid; gap:10px; padding:12px; border:1px solid ${statusMeta.borderColor}; border-radius:12px; background:${statusMeta.background};">
	      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
	        <div>
	          <div style="font-weight:700; font-size:1rem;">${escapeHtml(registration.displayName || '-')}</div>
	          ${registration.username ? `<div style="color:var(--muted); font-size:0.82rem; margin-top:2px;">@${escapeHtml(registration.username)}</div>` : ''}
	          <div style="color:var(--muted); font-size:0.78rem; margin-top:4px;">${escapeHtml(t('admin.eventsRegistrationsRegisteredAt'))}: ${escapeHtml(formatDateTime(registration.registeredAt))}</div>
	          <div style="color:${statusMeta.textColor}; font-size:0.82rem; font-weight:600; margin-top:6px;">${escapeHtml(statusMeta.helperText)}</div>
	        </div>
	        <span class="admin-file-chip" style="border-color:${statusMeta.borderColor}; color:${statusMeta.textColor};">${escapeHtml(t(`gym.eventsRegistration${capitalize(registration.status || 'NotRegistered')}`))}</span>
	      </div>
	      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
	        ${canCheckIn ? `<button type="button" class="btn-main" data-registration-status="checked_in" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>✅ ${escapeHtml(t('admin.eventsRegistrationCheckIn'))}</button>` : ''}
	        ${canUndoCheckIn ? `<button type="button" class="btn-sec" data-registration-status="registered" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>↩️ ${escapeHtml(t('admin.eventsRegistrationUndoCheckIn'))}</button>` : ''}
	        ${canCancel ? `<button type="button" class="btn-danger-soft" data-registration-status="cancelled" data-registration-user-id="${escapeHtml(registration.userId || '')}" ${isSaving ? 'disabled' : ''}>${escapeHtml(t('admin.eventsCancelRegistration'))}</button>` : ''}
	        ${isSaving ? `<span style="color:var(--muted); font-size:0.82rem;">${escapeHtml(t('gym.eventsRegistrationUpdating'))}</span>` : ''}
	      </div>
	    </div>
	  `;
  }).join('')}
  `;
}

function getRegistrationStatusPriority(status = '') {
  if (status === 'registered') return 0;
  if (status === 'checked_in') return 1;
  if (status === 'cancelled') return 2;
  return 3;
}

function getRegistrationStatusMeta(status = '', t = (key) => key) {
  if (status === 'checked_in') {
    return {
      borderColor: 'rgba(98,242,155,0.28)',
      background: 'rgba(98,242,155,0.08)',
      textColor: '#62f29b',
      helperText: t('admin.eventsRegistrationCheckInCompleted'),
    };
  }
  if (status === 'cancelled') {
    return {
      borderColor: 'rgba(255,107,107,0.24)',
      background: 'rgba(255,107,107,0.06)',
      textColor: '#ff9b9b',
      helperText: t('gym.eventsRegistrationCancelled'),
    };
  }
  return {
    borderColor: 'rgba(255,193,92,0.24)',
    background: 'rgba(255,193,92,0.06)',
    textColor: '#ffd36f',
    helperText: t('admin.eventsRegistrationReadyForCheckIn'),
  };
}

function capitalize(value) {
  const raw = String(value || '');
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
}

function resolveReadableCompetitionEntryLabel(record = {}) {
  const displayName = String(record?.displayName || '').trim();
  if (displayName) return displayName;
  const username = String(record?.username || '').trim();
  if (username) return username;
  const firstName = String(record?.firstName || '').trim();
  const lastName = String(record?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (firstName) return firstName;
  return String(record?.name || '').trim();
}
