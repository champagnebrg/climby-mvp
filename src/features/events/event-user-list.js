export function renderUserEventList({
  container,
  events = [],
  selectedEventId = '',
  onSelect = null,
  t = (key) => key,
  formatDateTime = (value) => value || '-',
} = {}) {
  if (!container) return;

  const { visibleEvents, archivedEvents } = splitEvents(events);

  if (!visibleEvents.length && !archivedEvents.length) {
    container.innerHTML = `<div class="card" style="display:block;">${escapeHtml(t('gym.eventsEmpty'))}</div>`;
    return;
  }

  container.innerHTML = `
    <section style="display:grid; gap:10px;">
      <div>
        <div style="color:var(--muted); font-size:0.82rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">${escapeHtml(t('gym.eventsVisibleSectionTitle'))}</div>
        <div style="color:var(--muted); font-size:0.84rem; margin-top:4px;">${escapeHtml(t('gym.eventsVisibleSectionHint'))}</div>
      </div>
      ${visibleEvents.length
        ? `<div style="display:grid; gap:10px;">${visibleEvents.map((event) => renderEventCard({ event, selectedEventId, formatDateTime, t })).join('')}</div>`
        : `<div class="card" style="display:block; color:var(--muted);">${escapeHtml(t('gym.eventsVisibleEmpty'))}</div>`}
    </section>
    <details style="border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px 14px; background:rgba(255,255,255,0.02); margin-top:12px;">
      <summary style="cursor:pointer; list-style:none; display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <span style="font-weight:700;">${escapeHtml(t('gym.eventsArchiveTitle'))}</span>
        <span class="admin-file-chip">${escapeHtml(String(archivedEvents.length))}</span>
      </summary>
      <div style="color:var(--muted); font-size:0.85rem; margin-top:8px;">${escapeHtml(t('gym.eventsArchiveHint'))}</div>
      <div style="display:grid; gap:10px; margin-top:12px;">
        ${archivedEvents.length
          ? archivedEvents.map((event) => renderEventCard({ event, selectedEventId, formatDateTime, t, archived: true })).join('')
          : `<div style="color:var(--muted);">${escapeHtml(t('gym.eventsArchiveEmpty'))}</div>`}
      </div>
    </details>
  `;

  container.querySelectorAll('[data-event-id]').forEach((button) => {
    button.onclick = () => onSelect?.(button.dataset.eventId || '');
  });
}

function renderEventCard({ event, selectedEventId = '', formatDateTime, t, archived = false }) {
  const isSelected = event.id === selectedEventId;
  const typeLabel = event?.competition_live?.enabled ? t('gym.eventsTypeCompetitionLive') : t('gym.eventsTypeStandard');
  const statusLabel = archived ? t('gym.eventsArchiveStatus') : (isEventLive(event) ? t('gym.eventsTimingLive') : t('gym.eventsTimingUpcoming'));

  return `
    <button type="button" class="card" data-event-id="${escapeHtml(event.id)}" style="text-align:left;${isSelected ? ' border-color:rgba(111,77,255,0.35); box-shadow:0 0 0 1px rgba(111,77,255,0.18) inset;' : ''}">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
        <div style="min-width:0;">
          <div style="font-weight:700;">${escapeHtml(event.title || t('gym.eventsUntitled'))}</div>
          <div style="margin-top:8px; color:var(--muted); font-size:0.82rem;">${escapeHtml(formatDateTime(event.startsAt))} → ${escapeHtml(formatDateTime(event.endsAt))}</div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
          <span class="admin-file-chip">${escapeHtml(typeLabel)}</span>
          <span class="admin-file-chip">${escapeHtml(statusLabel)}</span>
        </div>
      </div>
      <div style="margin-top:10px; color:var(--accent); font-size:0.84rem; font-weight:700;">${escapeHtml(t('gym.eventsOpenCta'))}</div>
    </button>
  `;
}

function splitEvents(events = []) {
  const visibleEvents = [];
  const archivedEvents = [];

  events.forEach((event) => {
    if (isArchivedEvent(event)) {
      archivedEvents.push(event);
      return;
    }
    visibleEvents.push(event);
  });

  visibleEvents.sort((a, b) => {
    const aLive = isEventLive(a) ? 0 : 1;
    const bLive = isEventLive(b) ? 0 : 1;
    if (aLive != bLive) return aLive - bLive;
    return (Date.parse(a?.startsAt || '') || 0) - (Date.parse(b?.startsAt || '') || 0);
  });

  archivedEvents.sort((a, b) => (Date.parse(b?.endsAt || b?.startsAt || '') || 0) - (Date.parse(a?.endsAt || a?.startsAt || '') || 0));

  return { visibleEvents, archivedEvents };
}

function isEventLive(event = {}) {
  const now = Date.now();
  const startsAt = Date.parse(event?.startsAt || '') || 0;
  const endsAt = Date.parse(event?.endsAt || '') || 0;
  return startsAt <= now && (endsAt === 0 || endsAt >= now) && (event?.status || 'published') === 'published';
}

function isArchivedEvent(event = {}) {
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
