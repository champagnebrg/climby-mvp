export function renderAdminEventEditor({
  container,
  event = null,
  draft = null,
  registrations = [],
  registrationCount = 0,
  registrationsLoading = false,
  formatDateTime = (value) => value || '-',
  onSave = null,
  onPublish = null,
  onEnd = null,
  onCancel = null,
  onUpdateRegistrationStatus = null,
  registrationStatusSavingUserId = '',
  t = (key) => key,
} = {}) {
  if (!container) return;

  const record = draft || event || {};
  const status = record.status || 'draft';
  const canPublish = status === 'draft' && !!event?.id;
  const canEnd = status === 'published' && !!event?.id;
  const canCancel = (status === 'draft' || status === 'published') && !!event?.id;

  const registrationRows = event?.id
    ? renderRegistrationRows({ registrations, registrationsLoading, t, formatDateTime, registrationStatusSavingUserId })
    : '';

  container.innerHTML = `
    <div class="admin-tab-header">
      <div>
        <h4 class="admin-section-title" style="margin:0;">${escapeHtml(event?.id ? t('admin.eventsEditTitle') : t('admin.eventsCreateTitle'))}</h4>
        <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsEditorHint'))}</p>
      </div>
    </div>
    <form id="admin-event-form" class="card admin-block-card" style="display:block;">
      <div class="admin-gym-form">
        <input type="text" id="admin-event-title" value="${escapeHtml(record.title || '')}" placeholder="${escapeHtml(t('admin.eventsFieldTitle'))}">
        <input type="text" id="admin-event-summary" value="${escapeHtml(record.summary || '')}" placeholder="${escapeHtml(t('admin.eventsFieldSummary'))}">
        <input type="datetime-local" id="admin-event-starts-at" value="${escapeHtml(toDateTimeLocalValue(record.startsAt))}">
        <input type="datetime-local" id="admin-event-ends-at" value="${escapeHtml(toDateTimeLocalValue(record.endsAt))}">
        <textarea class="full" id="admin-event-description" rows="5" placeholder="${escapeHtml(t('admin.eventsFieldDescription'))}">${escapeHtml(record.description || '')}</textarea>
        <label class="admin-toggle full"><input type="checkbox" id="admin-event-registration-enabled" ${record.registrationEnabled ? 'checked' : ''}><span>${escapeHtml(t('admin.eventsRegistrationDisabledHint'))}</span></label>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
        <button type="submit" class="btn-main">${escapeHtml(t('admin.eventsSave'))}</button>
        ${canPublish ? `<button type="button" class="btn-sec" id="admin-event-publish-btn">${escapeHtml(t('admin.publish'))}</button>` : ''}
        ${canEnd ? `<button type="button" class="btn-sec" id="admin-event-end-btn">${escapeHtml(t('admin.eventsEnd'))}</button>` : ''}
        ${canCancel ? `<button type="button" class="btn-danger-soft" id="admin-event-cancel-btn">${escapeHtml(t('admin.eventsCancel'))}</button>` : ''}
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
        <div style="margin-top:12px; display:grid; gap:8px;">${registrationRows}</div>
      </div>
    ` : ''}
  `;

  const form = container.querySelector('#admin-event-form');
  if (form) {
    form.onsubmit = (eventObj) => {
      eventObj.preventDefault();
      onSave?.(readFormPayload(container));
    };
  }
  const publishBtn = container.querySelector('#admin-event-publish-btn');
  if (publishBtn) publishBtn.onclick = () => onPublish?.();
  const endBtn = container.querySelector('#admin-event-end-btn');
  if (endBtn) endBtn.onclick = () => onEnd?.();
  const cancelBtn = container.querySelector('#admin-event-cancel-btn');
  if (cancelBtn) cancelBtn.onclick = () => onCancel?.();
  container.querySelectorAll('[data-registration-status]').forEach((button) => {
    button.onclick = () => onUpdateRegistrationStatus?.({
      userId: button.dataset.registrationUserId || '',
      status: button.dataset.registrationStatus || '',
    });
  });
}

export function readFormPayload(container) {
  return {
    title: container.querySelector('#admin-event-title')?.value || '',
    summary: container.querySelector('#admin-event-summary')?.value || '',
    description: container.querySelector('#admin-event-description')?.value || '',
    startsAt: fromDateTimeLocalValue(container.querySelector('#admin-event-starts-at')?.value || ''),
    endsAt: fromDateTimeLocalValue(container.querySelector('#admin-event-ends-at')?.value || ''),
    registrationEnabled: Boolean(container.querySelector('#admin-event-registration-enabled')?.checked),
  };
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


function renderRegistrationRows({ registrations = [], registrationsLoading = false, t = (key) => key, formatDateTime = (value) => value || '-', registrationStatusSavingUserId = '' } = {}) {
  if (registrationsLoading) {
    return `<div style="color:var(--muted);">${escapeHtml(t('admin.eventsRegistrationsLoading'))}</div>`;
  }

  if (!registrations.length) {
    return `<div style="color:var(--muted);">${escapeHtml(t('admin.eventsRegistrationsEmpty'))}</div>`;
  }

  return registrations.map((registration) => {
    const isSaving = registrationStatusSavingUserId && registrationStatusSavingUserId === registration.userId;
    const canCheckIn = registration.status === 'registered';
    const canUndoCheckIn = registration.status === 'checked_in';
    const canCancel = registration.status === 'registered';
    return `
    <div style="display:grid; gap:10px; padding:10px 12px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
        <div>
          <div style="font-weight:700; font-size:1rem;">${escapeHtml(registration.displayName || '-')}</div>
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
