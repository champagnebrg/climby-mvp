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

  const { visibleEvents, archivedEvents } = splitEvents(events);
  const filteredArchivedEvents = statusFilter === 'all' ? archivedEvents : archivedEvents.filter((event) => (event.status || 'draft') === statusFilter);

  container.innerHTML = `
    <div class="admin-tab-header">
      <div>
        <h4 class="admin-section-title" style="margin:0;">${escapeHtml(t('admin.eventsListTitle'))}</h4>
        <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem;">${escapeHtml(t('admin.eventsListHint'))}</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button type="button" class="btn-main" id="admin-events-create-btn">${escapeHtml(t('admin.eventsCreate'))}</button>
      </div>
    </div>
    <div id="admin-events-list-items" style="display:grid; gap:12px;"></div>
  `;

  const listEl = container.querySelector('#admin-events-list-items');
  if (!listEl) return;

  if (!events.length) {
    listEl.innerHTML = `<div class="card" style="display:block;">${escapeHtml(t('admin.eventsEmpty'))}</div>`;
  } else {
    listEl.innerHTML = `
      ${renderEventSection({
        title: t('admin.eventsVisibleSectionTitle'),
        hint: t('admin.eventsVisibleSectionHint'),
        events: visibleEvents,
        selectedEventId,
        formatDateTime,
        t,
      })}
      ${renderArchiveSection({
        events: filteredArchivedEvents,
        selectedEventId,
        formatDateTime,
        t,
        statusFilter,
      })}
    `;
  }

  container.querySelectorAll('[data-event-select]').forEach((button) => {
    button.onclick = () => onSelect?.(button.dataset.eventSelect || '');
  });
  const createBtn = container.querySelector('#admin-events-create-btn');
  if (createBtn) createBtn.onclick = () => onCreateNew?.();
  const filterEl = container.querySelector('#admin-events-status-filter');
  if (filterEl) filterEl.onchange = () => onStatusFilterChange?.(filterEl.value || 'all');
}

function renderEventSection({ title = '', hint = '', events = [], selectedEventId = '', formatDateTime, t }) {
  return `
    <section style="display:grid; gap:8px;">
      <div>
        <div style="font-weight:700;">${escapeHtml(title)}</div>
        <div style="color:var(--muted); font-size:0.85rem; margin-top:2px;">${escapeHtml(hint)}</div>
      </div>
      ${events.length
        ? `<div style="display:grid; gap:10px;">${events.map((event) => renderEventCard({ event, selectedEventId, formatDateTime, t })).join('')}</div>`
        : `<div class="card" style="display:block; color:var(--muted);">${escapeHtml(t('admin.eventsVisibleEmpty'))}</div>`}
    </section>
  `;
}

function renderArchiveSection({ events = [], selectedEventId = '', formatDateTime, t, statusFilter = 'all' }) {
  return `
    <details style="border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px 14px; background:rgba(255,255,255,0.02);">
      <summary style="cursor:pointer; list-style:none; display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <span style="font-weight:700;">${escapeHtml(t('admin.eventsArchiveTitle'))}</span>
        <span class="admin-file-chip">${escapeHtml(String(events.length))}</span>
      </summary>
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px;">
        <div style="color:var(--muted); font-size:0.85rem;">${escapeHtml(t('admin.eventsArchiveHint'))}</div>
        <label style="display:flex; gap:8px; align-items:center; color:var(--muted); font-size:0.85rem;">
          <span>${escapeHtml(t('admin.eventsFilterStatus'))}</span>
          <select id="admin-events-status-filter" style="min-width:140px;">
            ${['all', 'draft', 'published', 'ended', 'cancelled'].map((value) => `<option value="${escapeHtml(value)}" ${value === statusFilter ? 'selected' : ''}>${escapeHtml(value === 'all' ? t('admin.eventsFilterAll') : t(`admin.eventsStatus${capitalize(value)}`))}</option>`).join('')}
          </select>
        </label>
      </div>
      <div style="display:grid; gap:10px; margin-top:12px;">
        ${events.length
          ? events.map((event) => renderEventCard({ event, selectedEventId, formatDateTime, t })).join('')
          : `<div style="color:var(--muted);">${escapeHtml(t('admin.eventsArchiveEmpty'))}</div>`}
      </div>
    </details>
  `;
}

function renderEventCard({ event, selectedEventId = '', formatDateTime, t }) {
  const selectedClass = event.id === selectedEventId ? ' style="border-color:rgba(43,224,125,0.35); box-shadow:0 0 0 1px rgba(43,224,125,0.2) inset;"' : '';
  const timingLabel = eventHasPastEnded(event)
    ? t('admin.eventsTimingPast')
    : isEventLive(event)
      ? t('admin.eventsTimingLive')
      : t('admin.eventsTimingUpcoming');

  return `
    <button type="button" class="card" data-event-select="${escapeHtml(event.id)}"${selectedClass}>
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; text-align:left;">
        <div>
          <div style="font-weight:700;">${escapeHtml(event.title || t('admin.eventsUntitled'))}</div>
          <div style="color:var(--muted); font-size:0.85rem; margin-top:4px;">${escapeHtml(event.summary || '')}</div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
          <span class="admin-file-chip">${escapeHtml(timingLabel)}</span>
          <span class="admin-file-chip">${escapeHtml(t(`admin.eventsStatus${capitalize(event.status || 'draft')}`))}</span>
        </div>
      </div>
      <div style="margin-top:8px; color:var(--muted); font-size:0.82rem; text-align:left;">
        ${escapeHtml(formatDateTime(event.startsAt))} → ${escapeHtml(formatDateTime(event.endsAt))}
      </div>
    </button>
  `;
}

function splitEvents(events = []) {
  const visibleEvents = [];
  const archivedEvents = [];

  events.forEach((event) => {
    if (eventHasPastEnded(event)) {
      archivedEvents.push(event);
      return;
    }
    visibleEvents.push(event);
  });

  visibleEvents.sort((a, b) => {
    const aLive = isEventLive(a) ? 0 : 1;
    const bLive = isEventLive(b) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (Date.parse(a?.startsAt || '') || 0) - (Date.parse(b?.startsAt || '') || 0);
  });

  archivedEvents.sort((a, b) => (Date.parse(b?.endsAt || b?.startsAt || '') || 0) - (Date.parse(a?.endsAt || a?.startsAt || '') || 0));

  return { visibleEvents, archivedEvents };
}

function isEventLive(event = {}) {
  const now = Date.now();
  const startsAt = Date.parse(event?.startsAt || '') || 0;
  const endsAt = Date.parse(event?.endsAt || '') || 0;
  return startsAt <= now && (endsAt === 0 || endsAt >= now) && (event?.status || 'draft') === 'published';
}

function eventHasPastEnded(event = {}) {
  const now = Date.now();
  const status = event?.status || '';
  const endsAt = Date.parse(event?.endsAt || event?.startsAt || '') || 0;
  return status === 'ended' || status === 'cancelled' || (endsAt > 0 && endsAt < now);
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
