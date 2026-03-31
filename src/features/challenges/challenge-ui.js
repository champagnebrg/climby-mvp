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
  { id: 'featured', label: 'In evidenza' },
  { id: 'weekly', label: 'Sfide settimanali' },
  { id: 'monthly', label: 'Sfide mensili' },
  { id: 'local_gym', label: 'Nella tua palestra' },
  { id: 'exploration', label: 'Esplorazione' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'events', label: 'Eventi' },
]);

const DEFAULT_TIER_ROWS = [
  { id: 'bronze', label: 'Bronzo', threshold: 10 },
  { id: 'silver', label: 'Argento', threshold: 20 },
  { id: 'gold', label: 'Oro', threshold: 50 },
  { id: 'platinum', label: 'Platino', threshold: 100 },
];

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
  const start = challenge.startsAt ? new Date(challenge.startsAt) : null;
  const end = challenge.endsAt ? new Date(challenge.endsAt) : null;
  if (!start && !end) return 'Durata flessibile';
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
      pointsValue: Number.isFinite(Number(row?.pointsValue)) ? Number(row.pointsValue) : null,
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
  let rows = challenges;
  if (section.featuredOnly) {
    const featured = new Set((screenConfig.featuredChallengeIds || []).concat(challenges.filter((c) => c.isFeatured).map((c) => c.id)));
    rows = challenges.filter((row) => featured.has(row.id));
  } else {
    rows = challenges.filter((row) => {
      const displaySectionIds = Array.isArray(row.displaySectionIds) ? row.displaySectionIds : [];
      return displaySectionIds.includes(section.id);
    });
  }
  return showEmpty ? rows : rows.filter(Boolean);
}

function rewardText(challenge = {}, progress = {}) {
  if (progress.progressMode === 'tiered' && progress.currentTier?.rewardLabel) return `🎁 ${progress.currentTier.rewardLabel}`;
  if (challenge.reward?.label) return `🎁 ${challenge.reward.label}`;
  if (progress.progressMode === 'tiered' && progress.currentTier?.pointsValue) return `⭐ ${progress.currentTier.pointsValue} pt`;
  if (Number.isFinite(Number(challenge.pointsValue))) return `⭐ ${challenge.pointsValue} pt`;
  return '';
}

function renderTierProgress(progress = {}) {
  if (progress.progressMode !== 'tiered') return '';
  return `
    <div class="challenge-tier-track">
      ${progress.tiers.map((tier, idx) => {
        const reached = idx <= progress.reachedIndex;
        return `<div class="challenge-tier-step ${reached ? 'done' : ''}"><span>${escapeHtml(tier.badge || tier.label)}</span><small>${tier.threshold}</small></div>`;
      }).join('')}
    </div>
  `;
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
  const pointsValue = Number(mountEl.querySelector('[data-field="pointsValue"]')?.value || 0) || null;

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
    pointsTier: preset.pointsTier,
    pointsValue,
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
        return { ...tier, threshold: Math.max(1, thr), rewardLabel: rw };
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
  const { mountEl, challenges = [], screenConfig = {}, metricMap = {} } = options;
  if (!mountEl) return;

  const activeSections = (screenConfig.sections || []).filter((section) => section.isActive !== false);
  const featuredIds = new Set(screenConfig.featuredChallengeIds || []);
  const showEmptySections = screenConfig.showEmptySections !== false;

  const sectionsHtml = activeSections
    .map((section) => {
      const rows = sectionChallenges(section, challenges, screenConfig);
      if (!rows.length && !showEmptySections) return '';
      const cards = rows.map((challenge) => {
        const progress = computeChallengeProgress(challenge, metricMap);
        const reward = rewardText(challenge, progress);
        const badge = challenge?.categoryLabel || scopeLabel(challenge.scope);
        const isFeatured = featuredIds.has(challenge.id) || challenge.isFeatured;
        return `
          <article class="challenge-hub-card ${progress.completed ? 'highlight' : ''}">
            <div class="challenge-hub-head">
              <div>
                <div class="challenge-chip-row">
                  <span class="challenge-hub-badge">${escapeHtml(badge)}</span>
                  ${isFeatured ? '<span class="challenge-hub-badge">⭐ In evidenza</span>' : ''}
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
    </div>
    ${sectionsHtml || '<p class="profile-empty">Nessuna challenge attiva.</p>'}
  `;
}

export function renderSuperadminChallengeManager(options = {}) {
  const { mountEl, challenges = [], gyms = [], screenConfig = {}, onSaveChallenge, onSaveScreenConfig, onLifecycleAction, onEditChallenge, onDuplicateChallenge } = options;
  if (!mountEl) return;

  const gymOptions = gyms.map((gym) => `<option value="${escapeHtml(gym.id)}">${escapeHtml(gym.name || gym.id)}</option>`).join('');
  const sections = Array.isArray(screenConfig.sections) ? screenConfig.sections : FRIENDLY_SECTIONS.map((row, idx) => ({ ...row, order: idx, isActive: true }));

  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Nuova challenge (guidata)',
      bodyHtml: `
        <div class="challenge-admin-form-grid">
          <label>Titolo prodotto<input data-field="title" placeholder="Es. Sprint di primavera"></label>
          <label>Descrizione breve<textarea data-field="description" placeholder="Cosa deve fare l’utente e perché è interessante"></textarea></label>
          <label>Ambito challenge
            <select data-field="scope">
              <option value="global">Tutti gli utenti</option>
              <option value="gym">Solo una palestra</option>
              <option value="sponsor">Campagna sponsor</option>
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
          <label>Target iniziale<input data-field="target" type="number" min="1" placeholder="Es. 20"></label>
          <label>Sezione in app
            <select data-field="displaySectionId">${FRIENDLY_SECTIONS.map((row) => `<option value="${row.id}">${escapeHtml(row.label)}</option>`).join('')}</select>
          </label>
          <label>Reward testuale<input data-field="rewardLabel" placeholder="Es. Badge Challenger"></label>
          <label>Punti assegnati (opzionale)<input data-field="pointsValue" type="number" min="0" placeholder="Es. 120"></label>
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
              <label>${tier.label} reward<input data-tier-reward="${tier.id}" placeholder="Reward opzionale"></label>
            `).join('')}
          </div>
        </div>
        <button id="sa-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge</button>
      `,
    })}
    ${renderManagerCard({
      title: 'Gestione challenge e lifecycle',
      bodyHtml: `<div class="challenge-admin-list">${challenges.map((c) => challengeRow(c, 'superadmin')).join('') || '<p class="profile-empty">Nessuna challenge.</p>'}</div>`,
    })}
    ${renderManagerCard({
      title: 'Configurazione schermata sfide',
      bodyHtml: `
        <div class="challenge-admin-form-grid">
          <label>Titolo pagina<input id="sa-screen-title" value="${escapeHtml(screenConfig.title || 'Le tue sfide')}"></label>
          <label>Sottotitolo (opzionale)<input id="sa-screen-subtitle" value="${escapeHtml(screenConfig.subtitle || '')}"></label>
          <label><input id="sa-screen-show-empty" type="checkbox" ${screenConfig.showEmptySections !== false ? 'checked' : ''}> Mostra sezioni vuote</label>
        </div>
        <div class="challenge-screen-sections-editor">
          ${sections.map((section, idx) => `
            <div class="challenge-screen-section-row" data-section-row data-default-id="${escapeHtml(section.id)}">
              <input data-section-title value="${escapeHtml(section.title || section.label || section.id)}" placeholder="Titolo sezione">
              <select data-section-id>
                ${FRIENDLY_SECTIONS.map((opt) => `<option value="${opt.id}" ${opt.id === section.id ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
              </select>
              <label><input type="checkbox" data-section-active ${section.isActive !== false ? 'checked' : ''}> Attiva</label>
              <label><input type="checkbox" data-section-featured ${section.featuredOnly ? 'checked' : ''}> Solo featured</label>
              <input data-section-order type="number" value="${Number.isFinite(Number(section.order)) ? Number(section.order) : idx}" min="0" style="max-width:100px;">
            </div>
          `).join('')}
        </div>
        <label style="display:block; margin-top:8px;">Challenge in evidenza (ID separati da virgola)
          <input id="sa-screen-featured" value="${escapeHtml((screenConfig.featuredChallengeIds || []).join(', '))}">
        </label>
        <button id="sa-screen-save" class="btn-main" style="margin-top:8px;">Salva configurazione</button>
      `,
    })}
  `;

  bindGuidedFormVisibility(mountEl);

  const saveBtn = mountEl.querySelector('#sa-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSaveChallenge !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'superadmin' });
      await onSaveChallenge(payload);
    };
  }

  attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction, onDuplicateChallenge });

  const saveScreenBtn = mountEl.querySelector('#sa-screen-save');
  if (saveScreenBtn) {
    saveScreenBtn.onclick = async () => {
      if (typeof onSaveScreenConfig !== 'function') return;
      const title = mountEl.querySelector('#sa-screen-title')?.value || 'Le tue sfide';
      const subtitle = mountEl.querySelector('#sa-screen-subtitle')?.value?.trim() || null;
      const featuredChallengeIds = (mountEl.querySelector('#sa-screen-featured')?.value || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const showEmptySections = Boolean(mountEl.querySelector('#sa-screen-show-empty')?.checked);
      const sectionsPayload = Array.from(mountEl.querySelectorAll('[data-section-row]')).map((row, idx) => ({
        id: row.querySelector('[data-section-id]')?.value || row.getAttribute('data-default-id') || `section_${idx + 1}`,
        title: row.querySelector('[data-section-title]')?.value || `Sezione ${idx + 1}`,
        order: Number(row.querySelector('[data-section-order]')?.value || idx),
        isActive: Boolean(row.querySelector('[data-section-active]')?.checked),
        featuredOnly: Boolean(row.querySelector('[data-section-featured]')?.checked),
      }));
      await onSaveScreenConfig({ title, subtitle, featuredChallengeIds, showEmptySections, sections: sectionsPayload });
    };
  }
}

export function renderGymAdminChallengeManager(options = {}) {
  const { mountEl, challenges = [], gymId = null, onSave, onLifecycleAction, onEditChallenge, onDuplicateChallenge } = options;
  if (!mountEl) return;

  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Challenge palestra (guidata)',
      bodyHtml: `
        <p class="profile-subtitle">Crea una challenge locale con linguaggio prodotto e obiettivi chiari.</p>
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
            <select data-field="displaySectionId"><option value="local_gym">Nella tua palestra</option><option value="weekly">Settimanali</option></select>
          </label>
          <label>Reward<input data-field="rewardLabel" placeholder="Es. Bevanda omaggio"></label>
          <label>Stato
            <select data-field="lifecycleStatus"><option value="draft">Bozza</option><option value="published">Pubblica</option></select>
          </label>
          <div data-wrap="tiers" class="challenge-tiers-editor" style="display:none;">
            ${DEFAULT_TIER_ROWS.map((tier) => `<label>${tier.label} soglia<input data-tier-threshold="${tier.id}" type="number" min="1" value="${tier.threshold}"></label>`).join('')}
          </div>
        </div>
        <button id="gym-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge locale</button>
      `,
    })}
    ${renderManagerCard({
      title: 'Challenge locali',
      bodyHtml: `<div class="challenge-admin-list">${challenges.map((c) => challengeRow(c, 'gym_admin')).join('') || '<p class="profile-empty">Nessuna challenge locale.</p>'}</div>`,
    })}
  `;

  bindGuidedFormVisibility(mountEl);

  const saveBtn = mountEl.querySelector('#gym-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSave !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'gym_admin', gymContextId: gymId });
      await onSave(payload);
    };
  }

  attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction, onDuplicateChallenge });
}
