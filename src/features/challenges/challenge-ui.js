const TEMPLATE_GUIDE = Object.freeze({
  weekly_routes: { label: 'Obiettivo settimanale vie', metric: 'routes', target: 8, pointsTier: 'small', durationPreset: '7d', displaySectionIds: ['weekly'], description: 'Chiudi più vie possibili in una settimana.' },
  weekly_streak: { label: 'Streak settimanale', metric: 'streak', target: 4, pointsTier: 'medium', durationPreset: '7d', displaySectionIds: ['weekly'], description: 'Allenati per più giorni consecutivi.' },
  monthly_routes: { label: 'Obiettivo mensile vie', metric: 'routes', target: 30, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['monthly'], description: 'Costanza durante tutto il mese.' },
  monthly_exploration: { label: 'Esplorazione mensile', metric: 'gyms', target: 3, pointsTier: 'large', durationPreset: '30d', displaySectionIds: ['exploration'], description: 'Scopri palestre diverse.' },
  sponsor_campaign: { label: 'Campagna sponsor', metric: 'routes', target: 20, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['sponsor'], description: 'Challenge con premi sponsor.' },
  gym_local: { label: 'Challenge locale palestra', metric: 'routes', target: 10, pointsTier: 'small', durationPreset: '14d', displaySectionIds: ['local_gym'], description: 'Attività nella tua palestra.' },
  event_competition: { label: 'Evento / Competizione', metric: 'routes', target: 12, pointsTier: 'large', durationPreset: 'custom', displaySectionIds: ['events'], description: 'Challenge legata a un evento.' },
});

const FRIENDLY_SECTIONS = Object.freeze([
  { id: 'weekly', label: 'Settimanali' },
  { id: 'monthly', label: 'Mensili' },
  { id: 'local_gym', label: 'Dalle tue palestre' },
  { id: 'exploration', label: 'Esplorazione' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'events', label: 'Eventi' },
]);

const DEFAULT_TIER_ROWS = [
  { id: 'bronze', label: 'Bronzo', threshold: 10, pointsValue: 50 },
  { id: 'silver', label: 'Argento', threshold: 20, pointsValue: 75 },
  { id: 'gold', label: 'Oro', threshold: 50, pointsValue: 125 },
  { id: 'platinum', label: 'Platino', threshold: 100, pointsValue: 250 },
];

const SINGLE_TARGET_POINTS_BY_TIER = Object.freeze({
  small: 50,
  medium: 120,
  large: 250,
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lifecycleBadge(challenge = {}) {
  const status = challenge.lifecycleStatus || challenge.status || 'draft';
  const map = {
    draft: '📝 Bozza',
    published: '✅ Pubblicata',
    inactive: '⏸️ Disattivata',
    archived: '📦 Archiviata',
    deleted: '🗑️ Eliminata',
  };
  return map[status] || status;
}

function formatDuration(challenge = {}) {
  const presetMap = {
    '7d': 'Settimanale',
    '30d': 'Mensile',
    seasonal: 'Stagionale',
  };
  if (presetMap[challenge.durationPreset]) return presetMap[challenge.durationPreset];
  const start = challenge.startsAt ? new Date(challenge.startsAt) : null;
  const end = challenge.endsAt ? new Date(challenge.endsAt) : null;
  if (!start && !end) return challenge.durationPreset === 'custom' ? 'Durata personalizzata' : 'Sempre attiva';
  if (!end && start) return `Dal ${start.toLocaleDateString('it-IT')}`;
  if (!start && end) return `Scade il ${end.toLocaleDateString('it-IT')}`;
  return `${start.toLocaleDateString('it-IT')} → ${end.toLocaleDateString('it-IT')}`;
}

function scopeLabel(scope = '') {
  const map = {
    global: 'Globale',
    gym: 'Palestra',
    sponsor: 'Sponsor',
    event: 'Evento',
    exploration: 'Esplorazione',
  };
  return map[scope] || scope || 'Globale';
}

function resolveTierRows(challenge = {}) {
  const rows = Array.isArray(challenge?.progression?.tiers) && challenge.progression.tiers.length
    ? challenge.progression.tiers
    : DEFAULT_TIER_ROWS;
  return rows
    .map((row, idx) => ({
      id: row?.id || `tier_${idx + 1}`,
      label: row?.label || `Livello ${idx + 1}`,
      threshold: Math.max(1, Number(row?.threshold) || idx + 1),
      badge: row?.badge || '',
      rewardLabel: row?.rewardLabel || null,
      pointsValue: Number.isFinite(Number(row?.pointsValue)) ? Number(row.pointsValue) : 0,
    }))
    .sort((a, b) => a.threshold - b.threshold);
}

export function computeChallengeProgress(challenge = {}, metricMap = {}) {
  const metric = challenge?.rules?.metric || 'routes';
  const value = Math.max(0, Number(metricMap?.[metric] || 0));
  const progressMode = challenge?.progressMode === 'tiered' ? 'tiered' : 'single_target';

  if (progressMode === 'tiered') {
    const tiers = resolveTierRows(challenge);
    const maxThreshold = Math.max(1, Number(tiers[tiers.length - 1]?.threshold) || 1);
    let reachedIndex = -1;
    tiers.forEach((tier, idx) => {
      if (value >= tier.threshold) reachedIndex = idx;
    });
    const nextTier = tiers[reachedIndex + 1] || null;
    const currentTier = reachedIndex >= 0 ? tiers[reachedIndex] : null;
    const pct = Math.max(0, Math.min(100, Math.round((value / maxThreshold) * 100)));
    return {
      metric,
      value,
      target: maxThreshold,
      pct,
      completed: value >= maxThreshold,
      progressMode,
      tiers,
      reachedIndex,
      currentTier,
      nextTier,
      statusLabel: currentTier ? `${currentTier.label} sbloccato` : 'In partenza',
    };
  }

  const target = Math.max(1, Number(challenge?.rules?.target) || 1);
  const pct = Math.max(0, Math.min(100, Math.round((value / target) * 100)));
  return {
    metric,
    target,
    value,
    pct,
    completed: value >= target,
    progressMode,
    statusLabel: value >= target ? 'Completata' : 'In corso',
  };
}

function sectionChallenges(section = {}, challenges = [], screenConfig = {}) {
  const showEmpty = screenConfig.showEmptySections !== false;
  const rows = challenges.filter((row) => {
    const displaySectionIds = Array.isArray(row.displaySectionIds) ? row.displaySectionIds : [];
    if (section.id === 'local_gym') {
      const gyms = Array.isArray(screenConfig.userFavouriteGymIds) ? screenConfig.userFavouriteGymIds : [];
      if (!gyms.length) return false;
      const rowGymIds = Array.isArray(row.gymIds) ? row.gymIds : [];
      const linkedGymIds = row.gymId ? rowGymIds.concat([row.gymId]) : rowGymIds;
      if (!linkedGymIds.some((gymId) => gyms.includes(gymId))) return false;
    }
    return displaySectionIds.includes(section.id);
  });
  return showEmpty ? rows : rows.filter(Boolean);
}

function rewardText(challenge = {}, progress = {}) {
  if (progress.progressMode === 'tiered' && progress.currentTier?.rewardLabel) return `🎁 ${progress.currentTier.rewardLabel}`;
  if (challenge.reward?.label) return `🎁 ${challenge.reward.label}`;
  if (progress.progressMode === 'tiered' && progress.currentTier?.pointsValue) return `⭐ ${progress.currentTier.pointsValue} CP`;
  if (Number.isFinite(Number(challenge.pointsValue))) return `⭐ ${challenge.pointsValue} CP`;
  return '';
}

function renderTierProgress(progress = {}) {
  if (progress.progressMode !== 'tiered') return '';
  return `
    <div class="challenge-tier-track">
      ${progress.tiers.map((tier, idx) => {
        const reached = idx <= progress.reachedIndex;
        return `<div class="challenge-tier-step ${reached ? 'done' : ''}"><span>${escapeHtml(tier.badge || tier.label)}</span><small>${tier.threshold} · +${tier.pointsValue || 0} CP</small></div>`;
      }).join('')}
    </div>
  `;
}

function computeSeasonSummary({ seasonalStats = {}, levelConfig = {} } = {}) {
  const totalPoints = Math.max(0, Number(seasonalStats.totalPoints || 0));
  const levels = Array.isArray(levelConfig.levels) && levelConfig.levels.length
    ? [...levelConfig.levels]
    : [
      { level: 1, pointsRequired: 0 },
      { level: 2, pointsRequired: 200 },
      { level: 3, pointsRequired: 500 },
      { level: 4, pointsRequired: 900 },
      { level: 5, pointsRequired: 1400 },
    ];
  levels.sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
  let current = levels[0];
  for (const level of levels) {
    if (totalPoints >= Number(level.pointsRequired || 0)) current = level;
  }
  const next = levels.find((level) => Number(level.pointsRequired || 0) > totalPoints) || null;
  const neededToNext = next ? Math.max(0, Number(next.pointsRequired || 0) - totalPoints) : 0;
  const floor = Number(current?.pointsRequired || 0);
  const ceil = Number(next?.pointsRequired || floor);
  const progressPct = next && ceil > floor ? Math.round(((totalPoints - floor) / (ceil - floor)) * 100) : 100;
  return { totalPoints, current, next, neededToNext, progressPct };
}

function computeSeasonStatus(season = {}) {
  const label = season?.label?.trim() || 'Stagione attiva';
  const endsAt = season?.endsAt || null;
  if (!endsAt) return { label, endLabel: null };
  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return { label, endLabel: null };
  const now = new Date();
  const ms = endDate.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const absolute = endDate.toLocaleDateString('it-IT');
  if (days > 0) return { label, endLabel: `Termina tra ${days} giorni · ${absolute}` };
  if (days === 0) return { label, endLabel: `Termina oggi · ${absolute}` };
  return { label, endLabel: `Terminata il ${absolute}` };
}

function setFieldValue(mountEl, selector, value) {
  const el = mountEl.querySelector(selector);
  if (!el) return;
  if (el.type === 'checkbox') {
    el.checked = Boolean(value);
    return;
  }
  el.value = value ?? '';
}

function buildGuidedPayload({ mountEl, role, gymContextId }) {
  const title = mountEl.querySelector('[data-field="title"]')?.value?.trim() || '';
  const description = mountEl.querySelector('[data-field="description"]')?.value?.trim() || '';
  const scope = mountEl.querySelector('[data-field="scope"]')?.value || (role === 'gym_admin' ? 'gym' : 'global');
  const templateType = mountEl.querySelector('[data-field="templateType"]')?.value || (scope === 'gym' ? 'gym_local' : 'weekly_routes');
  const preset = TEMPLATE_GUIDE[templateType] || TEMPLATE_GUIDE.weekly_routes;
  const lifecycleStatus = mountEl.querySelector('[data-field="lifecycleStatus"]')?.value || 'draft';
  const visibility = mountEl.querySelector('[data-field="visibility"]')?.value || 'all_authenticated';
  const challengeKind = mountEl.querySelector('[data-field="challengeKind"]')?.value || 'standard';
  const rewardLabel = mountEl.querySelector('[data-field="rewardLabel"]')?.value?.trim() || null;
  const progressMode = mountEl.querySelector('[data-field="progressMode"]')?.value === 'tiered' ? 'tiered' : 'single_target';
  const target = Number(mountEl.querySelector('[data-field="target"]')?.value || preset.target);
  const sectionId = mountEl.querySelector('[data-field="displaySectionId"]')?.value || preset.displaySectionIds[0] || 'weekly';
  const pointsTier = mountEl.querySelector('[data-field="pointsTier"]')?.value || preset.pointsTier || 'small';

  const gymSelect = mountEl.querySelector('[data-field="gymId"]');
  const sponsorId = mountEl.querySelector('[data-field="sponsorId"]')?.value?.trim() || null;
  const chosenGymId = gymSelect?.value || null;
  const gymIds = scope === 'gym' ? (chosenGymId ? [chosenGymId] : []) : [];
  if (scope === 'gym' && role === 'gym_admin' && gymContextId) {
    gymIds.splice(0, gymIds.length, gymContextId);
  }

  const payload = {
    title,
    description,
    scope,
    challengeKind,
    templateType,
    displaySectionIds: [sectionId],
    durationPreset: preset.durationPreset,
    visibility,
    lifecycleStatus,
    pointsTier: role === 'gym_admin' ? preset.pointsTier : pointsTier,
    pointsValue: SINGLE_TARGET_POINTS_BY_TIER[role === 'gym_admin' ? preset.pointsTier : pointsTier] || 50,
    progressMode,
    rules: { metric: preset.metric, target: Math.max(1, target) },
    reward: { label: rewardLabel, rewardId: null },
    ownerType: role === 'gym_admin' ? 'gym_admin' : 'superadmin',
    gymIds,
    gymId: gymIds[0] || null,
    sponsorId: scope === 'sponsor' ? sponsorId : null,
  };

  if (progressMode === 'tiered') {
    payload.progression = {
      tiers: DEFAULT_TIER_ROWS.map((tier) => {
        const thr = Number(mountEl.querySelector(`[data-tier-threshold="${tier.id}"]`)?.value || tier.threshold);
        const rw = mountEl.querySelector(`[data-tier-reward="${tier.id}"]`)?.value?.trim() || null;
        const pointsValue = Number(mountEl.querySelector(`[data-tier-points="${tier.id}"]`)?.value || tier.pointsValue || 0);
        return { ...tier, threshold: Math.max(1, thr), rewardLabel: rw, pointsValue: Math.max(0, pointsValue) };
      }),
    };
    payload.rules.target = Math.max(...payload.progression.tiers.map((r) => r.threshold));
  }

  if (!payload.title) throw new Error('Titolo obbligatorio');
  if (scope === 'gym' && !payload.gymIds.length) throw new Error('Seleziona una palestra');
  return payload;
}

function renderManagerCard({ title, bodyHtml }) {
  return `<div class="card admin-block-card" style="display:block; margin-top:12px;"><h4 class="admin-section-title">${escapeHtml(title)}</h4>${bodyHtml}</div>`;
}

function challengeRow(challenge = {}, role = 'superadmin') {
  const gyms = (challenge.gymIds || []).join(', ');
  return `
    <div class="challenge-admin-row" data-challenge-id="${escapeHtml(challenge.id || '')}">
      <div>
        <b>${escapeHtml(challenge.title || 'Senza titolo')}</b>
        <div class="profile-subtitle">${escapeHtml(scopeLabel(challenge.scope))} · ${escapeHtml(challenge.progressMode || 'single_target')} · ${escapeHtml(challenge.displaySectionIds?.[0] || '-')}</div>
        <div class="profile-subtitle">Target: ${escapeHtml(String(challenge?.rules?.target || '-'))} · ${escapeHtml(formatDuration(challenge))}${gyms ? ` · Palestre: ${escapeHtml(gyms)}` : ''}</div>
      </div>
      <div class="challenge-admin-status">${escapeHtml(lifecycleBadge(challenge))}</div>
      <div class="challenge-admin-actions">
        <button class="btn-main" data-action="edit">Modifica</button>
        <button class="btn-main" data-action="duplicate">Duplica</button>
        <button class="btn-main" data-action="publish">Pubblica</button>
        <button class="btn-main" data-action="inactive">Disattiva</button>
        <button class="btn-main" data-action="archive">Archivia</button>
        ${role === 'superadmin' ? '<button class="btn-main" data-action="delete">Elimina</button>' : ''}
      </div>
    </div>
  `;
}

function attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction, onDuplicateChallenge }) {
  mountEl.querySelectorAll('[data-challenge-id]').forEach((row) => {
    const challengeId = row.getAttribute('data-challenge-id');
    row.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.onclick = async () => {
        const action = btn.getAttribute('data-action');
        if (action === 'edit' && typeof onEditChallenge === 'function') return onEditChallenge(challengeId);
        if (action === 'duplicate' && typeof onDuplicateChallenge === 'function') return onDuplicateChallenge(challengeId);
        if (typeof onLifecycleAction === 'function') return onLifecycleAction(challengeId, action);
      };
    });
  });
}

function bindGuidedFormVisibility(mountEl) {
  const scopeSelect = mountEl.querySelector('[data-field="scope"]');
  const progressModeSelect = mountEl.querySelector('[data-field="progressMode"]');
  const gymWrap = mountEl.querySelector('[data-wrap="gym"]');
  const sponsorWrap = mountEl.querySelector('[data-wrap="sponsor"]');
  const tierWrap = mountEl.querySelector('[data-wrap="tiers"]');

  const refresh = () => {
    const scope = scopeSelect?.value || 'global';
    const mode = progressModeSelect?.value || 'single_target';
    if (gymWrap) gymWrap.style.display = scope === 'gym' ? 'block' : 'none';
    if (sponsorWrap) sponsorWrap.style.display = scope === 'sponsor' ? 'block' : 'none';
    if (tierWrap) tierWrap.style.display = mode === 'tiered' ? 'grid' : 'none';
  };

  if (scopeSelect) scopeSelect.onchange = refresh;
  if (progressModeSelect) progressModeSelect.onchange = refresh;
  refresh();
}

export function renderChallengesHubDynamic(options = {}) {
  const { mountEl, challenges = [], screenConfig = {}, metricMap = {}, seasonalStats = {}, levelConfig = {}, favouriteGymIds = [] } = options;
  if (!mountEl) return;

  const allowedSections = new Set(FRIENDLY_SECTIONS.map((row) => row.id));
  const activeSections = (screenConfig.sections || []).filter((section) => section.isActive !== false && allowedSections.has(section.id));
  const showEmptySections = screenConfig.showEmptySections !== false;
  const seasonSummary = computeSeasonSummary({ seasonalStats, levelConfig });
  const seasonStatus = computeSeasonStatus(screenConfig.season || {});

  const sectionsHtml = activeSections
    .map((section) => {
      const rows = sectionChallenges(section, challenges, { ...screenConfig, userFavouriteGymIds: favouriteGymIds });
      if (!rows.length && !showEmptySections) return '';
      const cards = rows.map((challenge) => {
        const progress = computeChallengeProgress(challenge, metricMap);
        const reward = rewardText(challenge, progress);
        const badge = challenge?.categoryLabel || scopeLabel(challenge.scope);
        return `
          <article class="challenge-hub-card ${progress.completed ? 'highlight' : ''}">
            <div class="challenge-hub-head">
              <div>
                <div class="challenge-chip-row">
                  <span class="challenge-hub-badge">${escapeHtml(badge)}</span>
                </div>
                <b>${escapeHtml(challenge.title || 'Challenge')}</b>
                <div class="challenge-hub-desc">${escapeHtml(challenge.description || TEMPLATE_GUIDE[challenge.templateType]?.description || 'Raggiungi il traguardo e sblocca il premio.')}</div>
              </div>
              <span class="challenge-hub-badge">${progress.value}/${progress.target}</span>
            </div>
            <div class="challenge-progress"><span style="width:${progress.pct}%"></span></div>
            ${renderTierProgress(progress)}
            <div class="challenge-hub-meta">
              <span>📈 ${escapeHtml(progress.statusLabel)}</span>
              <span>${escapeHtml(formatDuration(challenge))}</span>
            </div>
            <div class="challenge-hub-meta">
              <span>${escapeHtml(reward || '⭐ Punti centralizzati')}</span>
              <span>${progress.completed ? '✅ Completata' : '🚀 Continua così'}</span>
            </div>
          </article>
        `;
      }).join('');

      return `
        <section class="profile-section-card">
          <b>${escapeHtml(section.title)}</b>
          ${section.subtitle ? `<div class="profile-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
          <div class="challenges-hub-grid">${cards || '<p class="profile-empty">Nessuna challenge in questa sezione.</p>'}</div>
        </section>
      `;
    })
    .join('');

  mountEl.innerHTML = `
    <div class="profile-section-card">
      <h4 style="margin-top:0;">${escapeHtml(screenConfig.title || 'Le tue sfide')}</h4>
      ${screenConfig.subtitle ? `<p class="profile-subtitle">${escapeHtml(screenConfig.subtitle)}</p>` : ''}
      <div class="challenge-points-summary">
        <div><b>${seasonSummary.totalPoints} CP</b><small>Punti stagione</small></div>
        <div><b>Livello ${seasonSummary.current?.level || 1}</b><small>Stato attuale</small></div>
        <div><b>${seasonSummary.next ? `${seasonSummary.neededToNext} CP` : 'Max livello'}</b><small>${seasonSummary.next ? `Al livello ${seasonSummary.next.level}` : 'Progressione completata'}</small></div>
      </div>
      <div class="challenge-hub-meta" style="margin-top:8px;">
        <span><b>Stagione:</b> ${escapeHtml(seasonStatus.label)}</span>
        <span>${escapeHtml(seasonStatus.endLabel || 'Durata non impostata')}</span>
      </div>
      <div class="challenge-progress"><span style="width:${seasonSummary.progressPct}%"></span></div>
    </div>
    ${sectionsHtml || '<p class="profile-empty">Nessuna challenge attiva.</p>'}
  `;
}

export function renderSuperadminChallengeManager(options = {}) {
  const { mountEl, challenges = [], gyms = [], screenConfig = {}, onSaveChallenge, onSaveScreenConfig, onLifecycleAction, onEditChallenge, onDuplicateChallenge, onSaveGymChallenge } = options;
  if (!mountEl) return;

  const gymOptions = gyms.map((gym) => `<option value="${escapeHtml(gym.id)}">${escapeHtml(gym.name || gym.id)}</option>`).join('');
  const allowedSections = new Set(FRIENDLY_SECTIONS.map((row) => row.id));
  const sections = Array.isArray(screenConfig.sections)
    ? screenConfig.sections.filter((row) => allowedSections.has(row.id))
    : FRIENDLY_SECTIONS.map((row, idx) => ({ ...row, order: idx, isActive: true }));
  const normalizedSections = sections.length ? sections : FRIENDLY_SECTIONS.map((row, idx) => ({ ...row, order: idx, isActive: true }));
  const season = screenConfig.season || {};
  const rewards = screenConfig.rewards || {};

  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Sfide · Crea / modifica challenge (guidata)',
      bodyHtml: `
        <p class="profile-subtitle">Usa il pulsante “Modifica” dalla lista per precompilare tutti i campi. Il salvataggio aggiorna la stessa challenge.</p>
        <input data-field="editingChallengeId" type="hidden" value="">
        <div class="challenge-admin-form-grid">
          <label>Titolo prodotto<input data-field="title" placeholder="Es. Sprint di primavera"></label>
          <label>Descrizione breve<textarea data-field="description" placeholder="Cosa deve fare l’utente e perché è interessante"></textarea></label>
          <label>Ambito challenge
            <select data-field="scope">
              <option value="global">Tutti gli utenti</option>
              <option value="gym">Palestra</option>
              <option value="sponsor">Sponsor</option>
              <option value="event">Evento</option>
            </select>
          </label>
          <label>Formato challenge
            <select data-field="progressMode">
              <option value="single_target">Obiettivo unico</option>
              <option value="tiered">Progressiva a livelli</option>
            </select>
          </label>
          <label>Template consigliato
            <select data-field="templateType">${Object.entries(TEMPLATE_GUIDE).map(([key, row]) => `<option value="${key}">${escapeHtml(row.label)}</option>`).join('')}</select>
          </label>
          <label>Policy punti (CP)
            <select data-field="pointsTier">
              <option value="small">Small · 50 CP</option>
              <option value="medium">Medium · 120 CP</option>
              <option value="large">Large · 250 CP</option>
            </select>
          </label>
          <label>Target iniziale<input data-field="target" type="number" min="1" placeholder="Es. 20"></label>
          <label>Sezione in app
            <select data-field="displaySectionId">${FRIENDLY_SECTIONS.map((row) => `<option value="${row.id}">${escapeHtml(row.label)}</option>`).join('')}</select>
          </label>
          <label>Reward badge<input data-field="rewardLabel" placeholder="Es. Badge Challenger"></label>
          <label>Pubblicazione
            <select data-field="lifecycleStatus"><option value="draft">Bozza</option><option value="published">Pubblica subito</option><option value="inactive">Disattiva</option></select>
          </label>
          <label>Visibilità
            <select data-field="visibility"><option value="all_authenticated">Utenti autenticati</option><option value="members_only">Solo membri</option></select>
          </label>
          <label>Tipo percorso
            <select data-field="challengeKind"><option value="standard">Standard</option><option value="competition">Competizione</option><option value="discovery">Discovery</option></select>
          </label>
          <label data-wrap="gym" style="display:none;">Palestra assegnata
            <select data-field="gymId"><option value="">Seleziona palestra</option>${gymOptions}</select>
          </label>
          <label data-wrap="sponsor" style="display:none;">Sponsor (ID interno)
            <input data-field="sponsorId" placeholder="Es. sponsor_northface">
          </label>
          <div data-wrap="tiers" class="challenge-tiers-editor" style="display:none;">
            ${DEFAULT_TIER_ROWS.map((tier) => `
              <label>${tier.label} soglia<input data-tier-threshold="${tier.id}" type="number" min="1" value="${tier.threshold}"></label>
              <label>${tier.label} punti CP<input data-tier-points="${tier.id}" type="number" min="0" value="${tier.pointsValue || 0}"></label>
              <label>${tier.label} reward<input data-tier-reward="${tier.id}" placeholder="Reward opzionale"></label>
            `).join('')}
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button id="sa-challenge-save" class="btn-main">Crea challenge</button>
          <button id="sa-challenge-cancel-edit" class="btn-main" type="button" style="display:none;">Annulla modifica</button>
        </div>
      `,
    })}
    ${renderManagerCard({
      title: 'Gestione challenge e lifecycle',
      bodyHtml: `<div class="challenge-admin-list">${challenges.map((c) => challengeRow(c, 'superadmin')).join('') || '<p class="profile-empty">Nessuna challenge.</p>'}</div>`,
    })}
    ${renderManagerCard({
      title: 'Configurazione centrale · guidata',
      bodyHtml: `
        <div class="challenge-admin-form-grid">
          <label>Titolo pagina<input id="sa-screen-title" value="${escapeHtml(screenConfig.title || 'Le tue sfide')}"></label>
          <label>Sottotitolo (opzionale)<input id="sa-screen-subtitle" value="${escapeHtml(screenConfig.subtitle || '')}"></label>
          <label><input id="sa-screen-show-empty" type="checkbox" ${screenConfig.showEmptySections === false ? 'checked' : ''}> Nascondi le sezioni vuote</label>
        </div>
        <div class="profile-section-card" style="margin-top:8px;">
          <b>A) Stagione</b>
          <p class="profile-subtitle">Definisce il ciclo CP visibile agli utenti e i riferimenti temporali della stagione corrente.</p>
          <div class="challenge-admin-form-grid">
            <label>Nome stagione<input id="sa-season-label" value="${escapeHtml(season.label || 'Stagione attiva')}"></label>
            <label>Data inizio<input id="sa-season-start" type="date" value="${escapeHtml((season.startsAt || '').slice(0,10))}"></label>
            <label>Data fine<input id="sa-season-end" type="date" value="${escapeHtml((season.endsAt || '').slice(0,10))}"></label>
            <label><input id="sa-season-active" type="checkbox" ${season.isActive !== false ? 'checked' : ''}> Stagione attiva</label>
          </div>
        </div>
        <div class="profile-section-card" style="margin-top:8px;">
          <b>B) Premio standard</b>
          <p class="profile-subtitle">Badge base usato quando una challenge non definisce un premio specifico.</p>
          <div class="challenge-admin-form-grid">
            <label>Nome badge<input id="sa-reward-badge-label" value="${escapeHtml(rewards.badgeLabel || 'Badge Challenger')}"></label>
            <label>Stile badge
              <select id="sa-reward-badge-type">
                ${['standard', 'rare', 'elite'].map((type) => `<option value="${type}" ${String(rewards.badgeType || 'standard') === type ? 'selected' : ''}>${type}</option>`).join('')}
              </select>
            </label>
            <label><input id="sa-reward-profile" type="checkbox" ${rewards.profileVisibility !== false ? 'checked' : ''}> Visibile nel profilo</label>
            <label><input id="sa-reward-social" type="checkbox" ${rewards.socialVisibility !== false ? 'checked' : ''}> Visibile nei post social</label>
          </div>
          <div class="challenge-hub-meta"><span>Preview badge</span><span>🏅 ${escapeHtml(rewards.badgeLabel || 'Badge Challenger')} · ${escapeHtml(rewards.badgeType || 'standard')}</span></div>
        </div>
        <div class="profile-section-card" style="margin-top:8px;">
          <b>C) Sezioni challenge</b>
          <p class="profile-subtitle">Gestisci solo le sezioni prodotto standard visibili lato utente.</p>
          <div class="challenge-screen-sections-editor">
            ${normalizedSections.map((section, idx) => `
              <div class="challenge-screen-section-row" data-section-row data-default-id="${escapeHtml(section.id)}">
                <input data-section-title value="${escapeHtml(section.title || section.label || section.id)}" placeholder="Titolo sezione">
                <select data-section-id>
                  ${FRIENDLY_SECTIONS.map((opt) => `<option value="${opt.id}" ${opt.id === section.id ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
                </select>
                <label><input type="checkbox" data-section-active ${section.isActive !== false ? 'checked' : ''}> Attiva</label>
                <input data-section-order type="number" value="${Number.isFinite(Number(section.order)) ? Number(section.order) : idx}" min="0" style="max-width:100px;">
              </div>
            `).join('')}
          </div>
        </div>
        <button id="sa-screen-save" class="btn-main" style="margin-top:8px;">Salva configurazione centrale</button>
      `,
    })}
    ${renderManagerCard({
      title: 'Vista palestra (modalità gym admin)',
      bodyHtml: `
        <label style="display:block; margin-bottom:8px;">Seleziona palestra
          <select id="sa-gym-view-id"><option value="">Scegli palestra</option>${gymOptions}</select>
        </label>
        <div id="sa-gym-view-mount"><p class="profile-subtitle">Seleziona una palestra per usare gli stessi controlli della sezione “Sfide palestra”.</p></div>
      `,
    })}
  `;

  bindGuidedFormVisibility(mountEl);

  const resetEditState = () => {
    setFieldValue(mountEl, '[data-field="editingChallengeId"]', '');
    const cancelBtn = mountEl.querySelector('#sa-challenge-cancel-edit');
    const save = mountEl.querySelector('#sa-challenge-save');
    if (save) save.textContent = 'Crea challenge';
    if (cancelBtn) cancelBtn.style.display = 'none';
  };

  const startEditChallenge = (challengeId) => {
    const source = challenges.find((row) => row.id === challengeId);
    if (!source) return;
    setFieldValue(mountEl, '[data-field="editingChallengeId"]', source.id || '');
    setFieldValue(mountEl, '[data-field="title"]', source.title || '');
    setFieldValue(mountEl, '[data-field="description"]', source.description || '');
    setFieldValue(mountEl, '[data-field="scope"]', source.scope || 'global');
    setFieldValue(mountEl, '[data-field="templateType"]', source.templateType || 'weekly_routes');
    setFieldValue(mountEl, '[data-field="lifecycleStatus"]', source.lifecycleStatus || source.status || 'draft');
    setFieldValue(mountEl, '[data-field="visibility"]', source.visibility || 'all_authenticated');
    setFieldValue(mountEl, '[data-field="challengeKind"]', source.challengeKind || 'standard');
    setFieldValue(mountEl, '[data-field="rewardLabel"]', source.reward?.label || '');
    setFieldValue(mountEl, '[data-field="progressMode"]', source.progressMode || 'single_target');
    setFieldValue(mountEl, '[data-field="target"]', source?.rules?.target || '');
    setFieldValue(mountEl, '[data-field="displaySectionId"]', source?.displaySectionIds?.[0] || 'weekly');
    setFieldValue(mountEl, '[data-field="pointsTier"]', source.pointsTier || 'small');
    setFieldValue(mountEl, '[data-field="gymId"]', source.gymId || source?.gymIds?.[0] || '');
    setFieldValue(mountEl, '[data-field="sponsorId"]', source.sponsorId || '');
    const sourceTiers = Array.isArray(source?.progression?.tiers) ? source.progression.tiers : [];
    DEFAULT_TIER_ROWS.forEach((tier) => {
      const row = sourceTiers.find((entry) => entry.id === tier.id) || {};
      setFieldValue(mountEl, `[data-tier-threshold="${tier.id}"]`, row.threshold || tier.threshold);
      setFieldValue(mountEl, `[data-tier-points="${tier.id}"]`, row.pointsValue ?? tier.pointsValue);
      setFieldValue(mountEl, `[data-tier-reward="${tier.id}"]`, row.rewardLabel || '');
    });
    const cancelBtn = mountEl.querySelector('#sa-challenge-cancel-edit');
    const save = mountEl.querySelector('#sa-challenge-save');
    if (save) save.textContent = 'Aggiorna challenge';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    bindGuidedFormVisibility(mountEl);
  };

  const saveBtn = mountEl.querySelector('#sa-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSaveChallenge !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'superadmin' });
      const editingId = mountEl.querySelector('[data-field="editingChallengeId"]')?.value || null;
      if (editingId) payload.id = editingId;
      await onSaveChallenge(payload);
      resetEditState();
    };
  }

  const cancelEditBtn = mountEl.querySelector('#sa-challenge-cancel-edit');
  if (cancelEditBtn) cancelEditBtn.onclick = resetEditState;

  attachChallengeActions({
    mountEl,
    onEditChallenge: async (challengeId) => {
      startEditChallenge(challengeId);
      if (typeof onEditChallenge === 'function') await onEditChallenge(challengeId);
    },
    onLifecycleAction,
    onDuplicateChallenge,
  });

  const gymViewSelect = mountEl.querySelector('#sa-gym-view-id');
  const gymViewMount = mountEl.querySelector('#sa-gym-view-mount');
  const renderGymView = () => {
    if (!gymViewMount) return;
    const gymId = gymViewSelect?.value || '';
    if (!gymId) {
      gymViewMount.innerHTML = '<p class="profile-subtitle">Seleziona una palestra per usare gli stessi controlli della sezione “Sfide palestra”.</p>';
      return;
    }
    const local = challenges.filter((row) => row.scope === 'gym' && ((row.gymIds || []).includes(gymId) || row.gymId === gymId));
    renderGymAdminChallengeManager({
      mountEl: gymViewMount,
      challenges: local,
      gymId,
      onSave: onSaveGymChallenge,
      onLifecycleAction,
      onEditChallenge,
      onDuplicateChallenge,
    });
  };
  if (gymViewSelect) gymViewSelect.onchange = renderGymView;
  renderGymView();

  const saveScreenBtn = mountEl.querySelector('#sa-screen-save');
  if (saveScreenBtn) {
    saveScreenBtn.onclick = async () => {
      if (typeof onSaveScreenConfig !== 'function') return;
      const title = mountEl.querySelector('#sa-screen-title')?.value || 'Le tue sfide';
      const subtitle = mountEl.querySelector('#sa-screen-subtitle')?.value?.trim() || null;
      const showEmptySections = !Boolean(mountEl.querySelector('#sa-screen-show-empty')?.checked);
      const sectionsPayload = Array.from(mountEl.querySelectorAll('[data-section-row]')).map((row, idx) => ({
        id: row.querySelector('[data-section-id]')?.value || row.getAttribute('data-default-id') || `section_${idx + 1}`,
        title: row.querySelector('[data-section-title]')?.value || `Sezione ${idx + 1}`,
        order: Number(row.querySelector('[data-section-order]')?.value || idx),
        isActive: Boolean(row.querySelector('[data-section-active]')?.checked),
      }));
      await onSaveScreenConfig({
        title,
        subtitle,
        showEmptySections,
        sections: sectionsPayload,
        season: {
          label: mountEl.querySelector('#sa-season-label')?.value?.trim() || 'Stagione attiva',
          startsAt: mountEl.querySelector('#sa-season-start')?.value || null,
          endsAt: mountEl.querySelector('#sa-season-end')?.value || null,
          isActive: Boolean(mountEl.querySelector('#sa-season-active')?.checked),
        },
        rewards: {
          badgeLabel: mountEl.querySelector('#sa-reward-badge-label')?.value?.trim() || 'Badge Challenger',
          badgeType: mountEl.querySelector('#sa-reward-badge-type')?.value?.trim() || 'standard',
          profileVisibility: Boolean(mountEl.querySelector('#sa-reward-profile')?.checked),
          socialVisibility: Boolean(mountEl.querySelector('#sa-reward-social')?.checked),
        },
      });
    };
  }
}

export function renderGymAdminChallengeManager(options = {}) {
  const { mountEl, challenges = [], gymId = null, onSave, onLifecycleAction, onEditChallenge, onDuplicateChallenge } = options;
  if (!mountEl) return;

  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Sfide palestra · gestione operativa',
      bodyHtml: `
        <p class="profile-subtitle">Crea o modifica challenge locali della tua palestra con un form guidato.</p>
        <input data-field="editingChallengeId" type="hidden" value="">
        <button id="gym-challenge-open-create" class="btn-main" type="button">Crea sfida</button>
        <div id="gym-challenge-form-wrap" style="display:none; margin-top:8px;">
        <div class="challenge-admin-form-grid">
          <label>Titolo challenge<input data-field="title" placeholder="Es. Weekend Crusher"></label>
          <label>Descrizione breve<textarea data-field="description" placeholder="Descrivi obiettivo e vantaggio"></textarea></label>
          <label>Template
            <select data-field="templateType"><option value="gym_local">Locale palestra</option><option value="weekly_routes">Vie settimanali</option><option value="weekly_streak">Streak settimanale</option></select>
          </label>
          <label>Formato
            <select data-field="progressMode"><option value="single_target">Obiettivo unico</option><option value="tiered">Progressiva a livelli</option></select>
          </label>
          <label>Target<input data-field="target" type="number" min="1" placeholder="Es. 15"></label>
          <label>Sezione app
            <select data-field="displaySectionId"><option value="local_gym">Dalle tue palestre</option><option value="weekly">Settimanali</option></select>
          </label>
          <label>Reward badge locale<input data-field="rewardLabel" placeholder="Es. Badge Local Hero"></label>
          <label>Stato
            <select data-field="lifecycleStatus"><option value="draft">Bozza</option><option value="published">Pubblica</option></select>
          </label>
          <div data-wrap="tiers" class="challenge-tiers-editor" style="display:none;">
            ${DEFAULT_TIER_ROWS.map((tier) => `
              <label>${tier.label} soglia<input data-tier-threshold="${tier.id}" type="number" min="1" value="${tier.threshold}"></label>
              <label>${tier.label} punti<input data-tier-points="${tier.id}" type="number" min="0" value="${tier.pointsValue || 0}"></label>
              <label>${tier.label} reward<input data-tier-reward="${tier.id}" placeholder="Reward opzionale"></label>
            `).join('')}
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button id="gym-challenge-save" class="btn-main">Salva sfida palestra</button>
          <button id="gym-challenge-cancel-edit" class="btn-main" type="button">Chiudi</button>
        </div>
        </div>
      `,
    })}
    ${renderManagerCard({
      title: 'Gestione sfide palestra',
      bodyHtml: `<div class="challenge-admin-list">${challenges.map((c) => challengeRow(c, 'gym_admin')).join('') || '<p class="profile-empty">Nessuna challenge locale.</p>'}</div>`,
    })}
  `;

  bindGuidedFormVisibility(mountEl);

  const formWrap = mountEl.querySelector('#gym-challenge-form-wrap');
  const createBtn = mountEl.querySelector('#gym-challenge-open-create');
  const cancelBtn = mountEl.querySelector('#gym-challenge-cancel-edit');
  const saveBtn = mountEl.querySelector('#gym-challenge-save');

  const openForm = () => {
    if (formWrap) formWrap.style.display = 'block';
  };
  const closeForm = () => {
    if (formWrap) formWrap.style.display = 'none';
    setFieldValue(mountEl, '[data-field="editingChallengeId"]', '');
    if (saveBtn) saveBtn.textContent = 'Salva sfida palestra';
  };
  const startEditChallenge = (challengeId) => {
    const source = challenges.find((row) => row.id === challengeId);
    if (!source) return;
    openForm();
    setFieldValue(mountEl, '[data-field="editingChallengeId"]', source.id || '');
    setFieldValue(mountEl, '[data-field="title"]', source.title || '');
    setFieldValue(mountEl, '[data-field="description"]', source.description || '');
    setFieldValue(mountEl, '[data-field="templateType"]', source.templateType || 'gym_local');
    setFieldValue(mountEl, '[data-field="progressMode"]', source.progressMode || 'single_target');
    setFieldValue(mountEl, '[data-field="target"]', source?.rules?.target || '');
    setFieldValue(mountEl, '[data-field="displaySectionId"]', source?.displaySectionIds?.[0] || 'local_gym');
    setFieldValue(mountEl, '[data-field="rewardLabel"]', source.reward?.label || '');
    setFieldValue(mountEl, '[data-field="lifecycleStatus"]', source.lifecycleStatus || source.status || 'draft');
    const sourceTiers = Array.isArray(source?.progression?.tiers) ? source.progression.tiers : [];
    DEFAULT_TIER_ROWS.forEach((tier) => {
      const row = sourceTiers.find((entry) => entry.id === tier.id) || {};
      setFieldValue(mountEl, `[data-tier-threshold="${tier.id}"]`, row.threshold || tier.threshold);
      setFieldValue(mountEl, `[data-tier-points="${tier.id}"]`, row.pointsValue ?? tier.pointsValue);
      setFieldValue(mountEl, `[data-tier-reward="${tier.id}"]`, row.rewardLabel || '');
    });
    if (saveBtn) saveBtn.textContent = 'Aggiorna sfida palestra';
    bindGuidedFormVisibility(mountEl);
  };

  if (createBtn) createBtn.onclick = openForm;
  if (cancelBtn) cancelBtn.onclick = closeForm;

  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSave !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'gym_admin', gymContextId: gymId });
      const editingId = mountEl.querySelector('[data-field="editingChallengeId"]')?.value || null;
      if (editingId) payload.id = editingId;
      await onSave(payload);
      closeForm();
    };
  }

  attachChallengeActions({
    mountEl,
    onEditChallenge: async (challengeId) => {
      startEditChallenge(challengeId);
      if (typeof onEditChallenge === 'function') await onEditChallenge(challengeId);
    },
    onLifecycleAction,
    onDuplicateChallenge,
  });
}
