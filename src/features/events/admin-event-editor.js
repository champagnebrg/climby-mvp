export function renderAdminEventEditor({
  container,
  event = null,
  draft = null,
  onSave = null,
  onPublish = null,
  onEnd = null,
  onCancel = null,
  t = (key) => key,
} = {}) {
  if (!container) return;

  const record = draft || event || {};
  const status = record.status || 'draft';
  const canPublish = status === 'draft' && !!event?.id;
  const canEnd = status === 'published' && !!event?.id;
  const canCancel = (status === 'draft' || status === 'published') && !!event?.id;

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
