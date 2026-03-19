export function renderAdminEventList({
  container,
  events = [],
  selectedEventId = '',
  onSelect = null,
  onCreateNew = null,
  t = (key) => key,
  formatDateTime = (value) => value || '-',
  statusFilter = 'all',
  onStatusFilterChange = null,
} = {}) {
  if (!container) return;

  container.innerHTML = `
    <div class="admin-tab-header">
      <div>
        <h4 class="admin-section-title" style="margin:0;">${escapeHtml(t('admin.eventsListTitle'))}</h4>
        <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsListHint'))}</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <label style="color:var(--muted); font-size:0.85rem;">${escapeHtml(t('admin.eventsFilterStatus'))}</label>
        <select id="admin-events-status-filter" style="min-width:140px;">
          ${['all', 'draft', 'published', 'ended', 'cancelled'].map((value) => `<option value="${escapeHtml(value)}" ${value === statusFilter ? 'selected' : ''}>${escapeHtml(value === 'all' ? t('admin.eventsFilterAll') : t(`admin.eventsStatus${capitalize(value)}`))}</option>`).join('')}
        </select>
        <button type="button" class="btn-main" id="admin-events-create-btn">${escapeHtml(t('admin.eventsCreate'))}</button>
      </div>
    </div>
    <div id="admin-events-list-items" style="display:grid; gap:10px;"></div>
  `;

  const listEl = container.querySelector('#admin-events-list-items');
  if (!listEl) return;

  const filteredEvents = statusFilter === 'all' ? events : events.filter((event) => (event.status || 'draft') === statusFilter);

  if (!filteredEvents.length) {
    listEl.innerHTML = `<div class="card" style="display:block;">${escapeHtml(t('admin.eventsEmpty'))}</div>`;
  } else {
    listEl.innerHTML = filteredEvents.map((event) => {
      const selectedClass = event.id === selectedEventId ? ' style="border-color:rgba(43,224,125,0.35); box-shadow:0 0 0 1px rgba(43,224,125,0.2) inset;"' : '';
      return `
        <button type="button" class="card" data-event-select="${escapeHtml(event.id)}"${selectedClass}>
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; text-align:left;">
            <div>
              <div style="font-weight:700;">${escapeHtml(event.title || t('admin.eventsUntitled'))}</div>
              <div style="color:var(--muted); font-size:0.85rem; margin-top:4px;">${escapeHtml(event.summary || '')}</div>
            </div>
            <span class="admin-file-chip">${escapeHtml(t(`admin.eventsStatus${capitalize(event.status || 'draft')}`))}</span>
          </div>
          <div style="margin-top:8px; color:var(--muted); font-size:0.82rem; text-align:left;">
            ${escapeHtml(formatDateTime(event.startsAt))} → ${escapeHtml(formatDateTime(event.endsAt))}
          </div>
        </button>
      `;
    }).join('');
  }

  container.querySelectorAll('[data-event-select]').forEach((button) => {
    button.onclick = () => onSelect?.(button.dataset.eventSelect || '');
  });
  const createBtn = container.querySelector('#admin-events-create-btn');
  if (createBtn) createBtn.onclick = () => onCreateNew?.();
  const filterEl = container.querySelector('#admin-events-status-filter');
  if (filterEl) filterEl.onchange = () => onStatusFilterChange?.(filterEl.value || 'all');
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
