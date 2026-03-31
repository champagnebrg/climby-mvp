const TEMPLATE_GUIDE = Object.freeze({
  weekly_routes: { label: 'Weekly Routes', metric: 'routes', target: 8, pointsTier: 'small', durationPreset: '7d', displaySectionIds: ['weekly'] },
  weekly_streak: { label: 'Weekly Streak', metric: 'streak', target: 4, pointsTier: 'medium', durationPreset: '7d', displaySectionIds: ['weekly'] },
  monthly_routes: { label: 'Monthly Routes', metric: 'routes', target: 30, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['monthly'] },
  monthly_exploration: { label: 'Monthly Exploration', metric: 'gyms', target: 3, pointsTier: 'large', durationPreset: '30d', displaySectionIds: ['exploration'] },
  sponsor_campaign: { label: 'Sponsor Campaign', metric: 'routes', target: 20, pointsTier: 'medium', durationPreset: '30d', displaySectionIds: ['sponsor'] },
  gym_local: { label: 'Gym Local', metric: 'routes', target: 10, pointsTier: 'small', durationPreset: '14d', displaySectionIds: ['local_gym'] },
  event_competition: { label: 'Event Competition', metric: 'routes', target: 12, pointsTier: 'large', durationPreset: 'custom', displaySectionIds: ['events'] },
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
    draft: '📝 Draft',
    published: '✅ Published',
    inactive: '⏸️ Inactive',
    archived: '📦 Archived',
    deleted: '🗑️ Deleted',
  };
  return map[status] || status;
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
  } else {
    rows = challenges.filter((row) => {
      const displaySectionIds = Array.isArray(row.displaySectionIds) ? row.displaySectionIds : [];
      return displaySectionIds.includes(section.id);
    });
  }
  return rows;
}

function buildGuidedPayload({ mountEl, role, gymContextId }) {
  const title = mountEl.querySelector('[data-field="title"]')?.value?.trim() || '';
  const scope = mountEl.querySelector('[data-field="scope"]')?.value || (role === 'gym_admin' ? 'gym' : 'global');
  const templateType = mountEl.querySelector('[data-field="templateType"]')?.value || (scope === 'gym' ? 'gym_local' : 'weekly_routes');
  const preset = TEMPLATE_GUIDE[templateType] || TEMPLATE_GUIDE.weekly_routes;
  const lifecycleStatus = mountEl.querySelector('[data-field="lifecycleStatus"]')?.value || 'draft';
  const visibility = mountEl.querySelector('[data-field="visibility"]')?.value || 'all_authenticated';
  const challengeKind = mountEl.querySelector('[data-field="challengeKind"]')?.value || 'standard';
  const rewardLabel = mountEl.querySelector('[data-field="rewardLabel"]')?.value?.trim() || null;
  const target = Number(mountEl.querySelector('[data-field="target"]')?.value || preset.target);

  const gymIdInput = mountEl.querySelector('[data-field="gymIds"]')?.value || '';
  const gymIds = gymIdInput.split(',').map((v) => v.trim()).filter(Boolean);
  if (scope === 'gym' && role === 'gym_admin' && gymContextId) {
    gymIds.splice(0, gymIds.length, gymContextId);
  }

  const payload = {
    title,
    scope,
    challengeKind,
    templateType,
    displaySectionIds: preset.displaySectionIds,
    durationPreset: preset.durationPreset,
    visibility,
    lifecycleStatus,
    pointsTier: preset.pointsTier,
    rules: { metric: preset.metric, target: Math.max(1, target) },
    reward: { label: rewardLabel, rewardId: null },
    ownerType: role === 'gym_admin' ? 'gym_admin' : 'superadmin',
    gymIds,
    gymId: gymIds[0] || null,
    sponsorId: scope === 'sponsor' ? (mountEl.querySelector('[data-field="sponsorId"]')?.value?.trim() || null) : null,
  };

  if (!payload.title) throw new Error('Titolo obbligatorio');
  if (scope === 'gym' && !payload.gymIds.length) throw new Error('Seleziona almeno una palestra');
  if (scope !== 'sponsor') payload.sponsorId = null;
  return payload;
}

function renderManagerCard({ title, bodyHtml }) {
  return `<div class="card admin-block-card" style="display:block; margin-top:12px;"><h4 class="admin-section-title">${escapeHtml(title)}</h4>${bodyHtml}</div>`;
}

function challengeRow(challenge = {}, role = 'superadmin') {
  const gyms = (challenge.gymIds || []).join(', ');
  return `
    <div class="profile-section-card" data-challenge-id="${escapeHtml(challenge.id || '')}" style="margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
        <div>
          <b>${escapeHtml(challenge.title)}</b>
          <div class="profile-subtitle">${escapeHtml(challenge.scope)} · ${escapeHtml(challenge.templateType || '-')}${gyms ? ` · gyms: ${escapeHtml(gyms)}` : ''}</div>
        </div>
        <span>${escapeHtml(lifecycleBadge(challenge))}</span>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
        <button class="btn-main" data-action="edit">Modifica</button>
        <button class="btn-main" data-action="publish">Pubblica</button>
        <button class="btn-main" data-action="inactive">Disattiva</button>
        <button class="btn-main" data-action="archive">Archivia</button>
        ${role === 'superadmin' ? '<button class="btn-main" data-action="delete">Elimina</button>' : ''}
      </div>
    </div>
  `;
}

function attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction }) {
  mountEl.querySelectorAll('[data-challenge-id]').forEach((row) => {
    const challengeId = row.getAttribute('data-challenge-id');
    row.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.onclick = async () => {
        const action = btn.getAttribute('data-action');
        if (action === 'edit' && typeof onEditChallenge === 'function') {
          await onEditChallenge(challengeId);
          return;
        }
        if (typeof onLifecycleAction === 'function') {
          await onLifecycleAction(challengeId, action);
        }
      };
    });
  });
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
  const { mountEl, challenges = [], gyms = [], onSaveChallenge, onSaveScreenConfig, onLifecycleAction, onEditChallenge } = options;
  if (!mountEl) return;
  const gymHint = gyms.map((gym) => gym.id).join(', ');
  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Challenge manager (guidato)',
      bodyHtml: `
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px;">
          <input data-field="title" placeholder="Titolo challenge">
          <select data-field="scope">
            <option value="global">Globale</option>
            <option value="gym">Locale palestra</option>
            <option value="sponsor">Sponsor</option>
            <option value="event">Evento</option>
          </select>
          <select data-field="templateType">
            ${Object.keys(TEMPLATE_GUIDE).map((key) => `<option value="${key}">${escapeHtml(TEMPLATE_GUIDE[key].label)}</option>`).join('')}
          </select>
          <select data-field="challengeKind">
            <option value="standard">Standard</option>
            <option value="competition">Competition</option>
            <option value="discovery">Discovery</option>
          </select>
          <select data-field="visibility">
            <option value="all_authenticated">Tutti autenticati</option>
            <option value="members_only">Solo membri</option>
          </select>
          <select data-field="lifecycleStatus">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="inactive">Inactive</option>
          </select>
          <input data-field="target" type="number" min="1" placeholder="Target (preset modificabile)">
          <input data-field="gymIds" placeholder="Gym IDs (csv)" title="Disponibili: ${escapeHtml(gymHint)}">
          <input data-field="sponsorId" placeholder="Sponsor ID (se scope sponsor)">
          <input data-field="rewardLabel" placeholder="Reward label (preset)" >
        </div>
        <button id="sa-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge</button>
      `,
    })}
    ${renderManagerCard({
      title: 'Elenco challenge e lifecycle',
      bodyHtml: challenges.map((c) => challengeRow(c, 'superadmin')).join('') || '<p class="profile-empty">Nessuna challenge</p>',
    })}
    ${renderManagerCard({
      title: 'Challenge screen config',
      bodyHtml: `
        <input id="sa-screen-title" placeholder="Titolo schermata sfide">
        <textarea id="sa-screen-sections" placeholder='JSON sections con id espliciti'></textarea>
        <button id="sa-screen-save" class="btn-main" style="margin-top:8px;">Salva configurazione</button>
      `,
    })}
  `;

  const saveBtn = mountEl.querySelector('#sa-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSaveChallenge !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'superadmin' });
      await onSaveChallenge(payload);
    };
  }

  attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction });

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
  const { mountEl, challenges = [], gymId = null, onSave, onLifecycleAction, onEditChallenge } = options;
  if (!mountEl) return;
  mountEl.innerHTML = `
    ${renderManagerCard({
      title: 'Sezione sfide palestra',
      bodyHtml: `
        <p class="profile-subtitle">Gestione dedicata challenge locale palestra.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px;">
          <input data-field="title" placeholder="Titolo challenge locale">
          <select data-field="scope" disabled><option value="gym">Locale palestra</option></select>
          <select data-field="templateType">
            <option value="gym_local">Gym Local</option>
            <option value="weekly_routes">Weekly Routes</option>
            <option value="weekly_streak">Weekly Streak</option>
          </select>
          <select data-field="challengeKind">
            <option value="standard">Standard</option>
            <option value="competition">Competition</option>
          </select>
          <select data-field="lifecycleStatus">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <input data-field="target" type="number" min="1" placeholder="Target">
          <input data-field="rewardLabel" placeholder="Reward label">
        </div>
        <button id="gym-challenge-save" class="btn-main" style="margin-top:8px;">Salva challenge locale</button>
      `,
    })}
    ${renderManagerCard({
      title: 'Challenge locali',
      bodyHtml: challenges.map((c) => challengeRow(c, 'gym_admin')).join('') || '<p class="profile-empty">Nessuna challenge locale</p>',
    })}
  `;

  const saveBtn = mountEl.querySelector('#gym-challenge-save');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof onSave !== 'function') return;
      const payload = buildGuidedPayload({ mountEl, role: 'gym_admin', gymContextId: gymId });
      await onSave(payload);
    };
  }

  attachChallengeActions({ mountEl, onEditChallenge, onLifecycleAction });
}
