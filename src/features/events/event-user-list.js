export function renderUserEventList({
  container,
  events = [],
  selectedEventId = '',
  onSelect = null,
  t = (key) => key,
  formatDateTime = (value) => value || '-',
} = {}) {
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `<div class="card" style="display:block;">${escapeHtml(t('gym.eventsEmpty'))}</div>`;
    return;
  }

  container.innerHTML = events.map((event) => {
    const isSelected = event.id === selectedEventId;
    return `
      <button type="button" class="card" data-event-id="${escapeHtml(event.id)}" style="text-align:left;${isSelected ? ' border-color:rgba(111,77,255,0.35); box-shadow:0 0 0 1px rgba(111,77,255,0.18) inset;' : ''}">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
          <div>
            <div style="font-weight:700;">${escapeHtml(event.title || t('gym.eventsUntitled'))}</div>
            <div style="color:var(--muted); font-size:0.84rem; margin-top:4px;">${escapeHtml(event.summary || '')}</div>
          </div>
          <span class="admin-file-chip">${escapeHtml(t(`gym.eventsStatus${capitalize(event.status || 'published')}`))}</span>
        </div>
        <div style="margin-top:8px; color:var(--muted); font-size:0.82rem;">${escapeHtml(formatDateTime(event.startsAt))} → ${escapeHtml(formatDateTime(event.endsAt))}</div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('[data-event-id]').forEach((button) => {
    button.onclick = () => onSelect?.(button.dataset.eventId || '');
  });
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
