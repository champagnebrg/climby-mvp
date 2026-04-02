const test = require('node:test');
const assert = require('node:assert/strict');

function createInMemoryDeps() {
  const templates = new Map();
  return {
    db: {},
    collection: (_db, name) => ({ name }),
    doc: (_db, name, id) => ({ name, id }),
    getDoc: async (ref) => {
      const value = templates.get(ref.id);
      return { id: ref.id, exists: () => Boolean(value), data: () => (value ? { ...value } : undefined) };
    },
    getDocs: async () => ({
      docs: [...templates.entries()].map(([id, row]) => ({ id, data: () => ({ ...row }) })),
    }),
    setDoc: async (ref, payload) => {
      templates.set(ref.id, { ...payload });
    },
    addDoc: async (_collectionRef, payload) => {
      const id = `tpl_${templates.size + 1}`;
      templates.set(id, { ...payload });
      return { id };
    },
  };
}

test('template save/load works through repository', async () => {
  const { saveTemplate, getTemplateById, listTemplates } = await import('../src/features/challenges/challenge-repository.js');
  const deps = createInMemoryDeps();

  const created = await saveTemplate({
    ...deps,
    data: {
      name: 'Template Base',
      templateFamily: 'standard',
      defaultRule: { metric: 'routes', target: 8, progressMode: 'single_target' },
      defaultPointsPolicy: { pointsTier: 'small' },
      allowedOverrides: ['title', 'description', 'target'],
      status: 'published',
    },
  });

  const loaded = await getTemplateById(deps, created.id);
  const all = await listTemplates(deps);

  assert.equal(loaded.name, 'Template Base');
  assert.equal(loaded.status, 'published');
  assert.equal(all.length, 1);
});

test('challenge prefill from template and allowed overrides are enforced', async () => {
  const { buildChallengeDraftFromTemplate } = await import('../src/features/challenges/challenge-model.js');

  const draft = buildChallengeDraftFromTemplate({
    id: 'tpl1',
    name: 'Routes Sprint',
    description: 'Desc template',
    templateFamily: 'standard',
    defaultRule: { metric: 'routes', target: 10, progressMode: 'single_target' },
    defaultPointsPolicy: { pointsTier: 'medium' },
    allowedOverrides: ['title', 'target'],
    status: 'published',
  }, {
    title: 'Titolo Admin',
    description: 'Descrizione vietata',
    target: 15,
  }, {
    allowSponsorTemplate: false,
    scope: 'gym',
    defaultSectionId: 'local_gym',
  });

  assert.equal(draft.templateId, 'tpl1');
  assert.equal(draft.title, 'Titolo Admin');
  assert.equal(draft.rules.metric, 'routes');
  assert.equal(draft.rules.target, 15);
  assert.equal(draft.description, 'Desc template');
});

test('superadmin can create sponsor template but gym-admin flow cannot use it', async () => {
  const { normalizeTemplateRecord, buildChallengeDraftFromTemplate } = await import('../src/features/challenges/challenge-model.js');

  const sponsorTemplate = normalizeTemplateRecord({
    name: 'Sponsor Campaign',
    templateFamily: 'sponsor',
    isSponsorTemplate: true,
    defaultRule: { metric: 'routes', target: 20 },
    defaultPointsPolicy: { pointsTier: 'large' },
    status: 'published',
  });

  assert.equal(sponsorTemplate.isSponsorTemplate, true);

  assert.throws(() => buildChallengeDraftFromTemplate(sponsorTemplate, {}, {
    allowSponsorTemplate: false,
  }), /sponsor templates are not allowed/);
});
