function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function computeChallengeProgress(challenge = {}, metricMap = {}) {
  const metric = challenge?.rules?.metric || 'routes';
  const target = Math.max(1, Number(challenge?.rules?.target) || 1);
  const value = Number(metricMap?.[metric] || 0);
  const pct = Math.max(0, Math.min(100, Math.round((value / target) * 100)));
  return {
    metric,
    target,
    value,
    pct,
    completed: value >= target,
  };
}

function sectionChallenges(section = {}, challenges = [], screenConfig = {}) {
  let rows = challenges;
  if (section.featuredOnly) {
    const featured = new Set((screenConfig.featuredChallengeIds || []).concat(challenges.filter((c) => c.isFeatured).map((c) => c.id)));
    rows = challenges.filter((row) => featured.has(row.id));
  }
  if (section.filterScope) {
    rows = rows.filter((row) => row.scope === section.filterScope);
  }
  return rows;
}

export function renderChallengesHubDynamic(options = {}) {
  const {
    mountEl,
    challenges = [],
    screenConfig = {},
    metricMap = {},
  } = options;

  if (!mountEl) return;

  const sections = (screenConfig.sections || []).filter((section) => section.isActive !== false);
  const sectionsHtml = sections.map((section) => {
    const rows = sectionChallenges(section, challenges, screenConfig);
    if (!rows.length) return '';
    return `
      <div class="profile-section-card">
        <b>${escapeHtml(section.title)}</b>
        ${section.subtitle ? `<div class="profile-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
        <div class="challenges-hub-grid">
          ${rows.map((challenge) => {
            const progress = computeChallengeProgress(challenge, metricMap);
            const rewardLabel = challenge.reward?.label ? `🎁 ${escapeHtml(challenge.reward.label)}` : '';
            return `
              <div class="challenge-hub-card ${progress.completed ? 'highlight' : ''}">
                <div class="challenge-hub-head">
                  <div>
                    <b>${escapeHtml(challenge.title)}</b>
                    <div class="challenge-hub-desc">${escapeHtml(challenge.description || '')}</div>
                  </div>
                  <span class="challenge-hub-badge">${progress.completed ? '✅' : `${progress.value}/${progress.target}`}</span>
                </div>
                <div class="challenge-progress"><span style="width:${progress.pct}%"></span></div>
                <div class="challenge-hub-meta">
                  <span>${escapeHtml(challenge.scope)}</span>
                  <span>${rewardLabel}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  mountEl.innerHTML = `
    <div class="profile-section-card">
      <h4 style="margin-top:0;">${escapeHtml(screenConfig.title || 'Sfide')}</h4>
      ${screenConfig.subtitle ? `<p class="profile-subtitle">${escapeHtml(screenConfig.subtitle)}</p>` : ''}
    </div>
    ${sectionsHtml || `<p class="profile-empty">Nessuna challenge attiva.</p>`}
  `;
}

export function renderSuperadminChallengeManager(options = {}) {
  const { mountEl, challenges = [], onSaveChallenge, onSaveScreenConfig } = options;
  if (!mountEl) return;
  mountEl.innerHTML = `
    <div class="card" style="display:block; margin-top:12px;">
      <h4 class="admin-section-title">Challenge manager</h4>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px;">
        <input id="sa-challenge-title" placeholder="Titolo challenge">
        <input id="sa-challenge-scope" placeholder="Scope (global/gym/sponsor)">
        <input id="sa-challenge-metric" placeholder="Metric (routes/days/streak/sectors/gyms)">
        <input id="sa-challenge-target" type="number" min="1" placeholder="Target">
      </div>
      <button id="sa-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge</button>
      <div id="sa-challenge-list" style="margin-top:10px;">${challenges.map((c) => `<div>• ${escapeHtml(c.title)} <small>(${escapeHtml(c.scope)})</small></div>`).join('') || '<p class="profile-empty">Nessuna challenge</p>'}</div>
    </div>
    <div class="card" style="display:block; margin-top:12px;">
      <h4 class="admin-section-title">Challenge screen config</h4>
      <input id="sa-screen-title" placeholder="Titolo schermata sfide">
      <textarea id="sa-screen-sections" placeholder='JSON sections'></textarea>
      <button id="sa-screen-save" class="btn-main" style="margin-top:8px;">Salva configurazione</button>
    </div>
  `;

  const saveBtn = mountEl.querySelector('#sa-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSaveChallenge !== 'function') return;
      const title = mountEl.querySelector('#sa-challenge-title')?.value || '';
      const scope = mountEl.querySelector('#sa-challenge-scope')?.value || 'global';
      const metric = mountEl.querySelector('#sa-challenge-metric')?.value || 'routes';
      const target = Number(mountEl.querySelector('#sa-challenge-target')?.value || 1);
      await onSaveChallenge({ title, scope, rules: { metric, target }, status: 'published', isActive: true, ownerType: 'superadmin' });
    };
  }

  const saveScreenBtn = mountEl.querySelector('#sa-screen-save');
  if (saveScreenBtn) {
    saveScreenBtn.onclick = async () => {
      if (typeof onSaveScreenConfig !== 'function') return;
      const title = mountEl.querySelector('#sa-screen-title')?.value || 'Sfide';
      let sections = [];
      try {
        sections = JSON.parse(mountEl.querySelector('#sa-screen-sections')?.value || '[]');
      } catch (_) {
        sections = [];
      }
      await onSaveScreenConfig({ title, sections });
    };
  }
}

export function renderGymAdminChallengeManager(options = {}) {
  const { mountEl, challenges = [], onSave } = options;
  if (!mountEl) return;
  mountEl.innerHTML = `
    <div class="card admin-block-card" style="display:block; margin-top:12px;">
      <h4 class="admin-section-title">Challenge locali palestra</h4>
      <input id="gym-challenge-title" placeholder="Titolo challenge locale">
      <input id="gym-challenge-target" type="number" min="1" placeholder="Target">
      <button id="gym-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge locale</button>
      <div style="margin-top:10px;">${challenges.map((c) => `<div>• ${escapeHtml(c.title)}</div>`).join('') || '<p class="profile-empty">Nessuna challenge locale</p>'}</div>
    </div>
  `;

  const saveBtn = mountEl.querySelector('#gym-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSave !== 'function') return;
      const title = mountEl.querySelector('#gym-challenge-title')?.value || '';
      const target = Number(mountEl.querySelector('#gym-challenge-target')?.value || 1);
      await onSave({ title, rules: { metric: 'routes', target }, scope: 'gym', status: 'published', isActive: true, ownerType: 'gym_admin' });
    };
  }
}
