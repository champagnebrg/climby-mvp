# Climby — Piano implementativo finale feature Sfide

## Contesto
Piano esecutivo pragmatico basato su stato attuale repo (`challenge-model/repository/ui`, `climby.html`, `functions/index.js`, `rules_firestore.txt`) e sulle analisi già prodotte.

---

## A) MVP finale minimo per considerare la feature “chiusa bene”

## Must Have (release gate)
1. **Ruoli/capability coerenti**
   - superadmin = superset gym_admin lato UX + rules.
2. **Template reali riusabili**
   - `challengeTemplates` realmente usati in creazione challenge.
3. **Challenge runtime separate concettualmente da template**
   - anche mantenendo `challenges` come runtime collection nella fase 1.
4. **Reward tipizzati (non label libera)**
   - `rewards` con `type/providerType/providerId/claimMode` minimi.
5. **Redemption lifecycle base operativo**
   - `locked|unlocked|claimed|redeemed|expired|rejected`.
6. **Punti separati dai reward in UI e dominio**
   - punti = ledger (`pointsLedger`/PointTransaction), reward = catalog+redemption.
7. **Wizard guidati Superadmin/Admin**
   - step, validazioni bloccanti, preview finale.
8. **Test safety net minimo**
   - rules + unit + integration sui flussi critici.

## Should Have
1. Redemption queue per admin/superadmin.
2. Superadmin “gym mode” first-class (non embedded secondario).
3. Adapter di compatibilità campi legacy challenge.
4. Metriche base funnel (`unlocked->claimed->redeemed`).

## Nice to Have
1. Code pool dedicato con gestione bulk.
2. Analytics avanzati sponsor/gym.
3. A/B copy UX e micro-interazioni.

---

## B) Sequenza corretta di implementazione

| Step | Obiettivo | Perché qui | Sblocca dopo |
|---|---|---|---|
| 1 | Capability layer ruoli | evita rifare gating UI/rules due volte | wizard e UX coerenti |
| 2 | Reward typing v1 | base dati per tutto il redemption flow | challenge-reward binding |
| 3 | Template wiring reale | riduce libertà strutturale e incoerenze | admin template-first |
| 4 | Redemption lifecycle v1 | chiude il loop business reward | redemption queue + UX user |
| 5 | UX wizard finale SA/Admin | usa model già stabilizzato | rollout operativo admin |
| 6 | UX user finale (punti vs reward vs stato claim) | dipende da redemption e reward typing | monitoraggio funnel |
| 7 | Hardening rules + tests + migration cleanup | stabilizzazione finale | rilascio produzione |

---

## C) Backlog tecnico dettagliato

## 1) Domain / Model

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Capability helpers | introdurre helpers `canManageGymChallenges`, ecc. | `src/features/challenges/permissions.js` (new), `climby.html` | nessuna | M | P0 |
| Challenge model v2 fields | aggiungere `templateId`, `rewardConfig`, deprecazioni | `src/features/challenges/challenge-model.js` | capability | M | P0 |
| Reward model | schema normalized reward tipizzato | `src/features/challenges/reward-model.js` (new) | none | M | P0 |
| Redemption model | schema + status machine | `src/features/challenges/redemption-model.js` (new) | reward model | M | P0 |

## 2) Firestore / Repository

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Template repository wiring | list/save/get templates effettivi nel flow | `challenge-repository.js` | model v2 | M | P0 |
| Reward repository | CRUD reward con filtri provider | `reward-repository.js` (new), `index.js` export | reward model | M | P0 |
| Redemption repository | create/update/list redemptions | `redemption-repository.js` (new) | redemption model | M | P0 |
| Challenge query optimization | ridurre full-scan listChallenges | `challenge-repository.js` | model stable | M | P1 |

## 3) Cloud Functions / backend logic

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Unlock reward on completion | su progresso completed crea/aggiorna redemption `unlocked` | `functions/index.js` | redemption model | H | P0 |
| Claim/redeem transitions server-side | endpoint/trigger robusti (idempotenti) | `functions/index.js` o new functions module | unlock flow | H | P0 |
| Keep points idempotency | preservare key strategy ledger | `functions/index.js` | none | M | P0 |
| Progress canonical alignment | opzionale sync per UI from `userChallengeProgress` | `functions/index.js` + client reads | model v2 | M | P1 |

## 4) Security Rules

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Capability functions in rules | funzioni granulari challenge/reward/redemption | `rules_firestore.txt` | capability layer | H | P0 |
| Reward access scopes | gym vs sponsor vs global write/read | `rules_firestore.txt` | reward model | H | P0 |
| Redemption transitions rules | chi può passare claimed/redeemed/rejected | `rules_firestore.txt` | redemption model | H | P0 |
| Legacy compatibility window | mantenere alias `admin/gym_admin` temporaneo | `rules_firestore.txt` | none | M | P1 |

## 5) Superadmin UI

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Template Manager tab | UI gestione template standard/sponsor | `challenge-ui.js`, `climby.html` | template repo | M | P0 |
| Reward Catalog tab | UI reward global/sponsor tipizzati | `challenge-ui.js`, `climby.html` | reward repo | M | P0 |
| Gym mode first-class | flow admin completo da superadmin | `climby.html`, `challenge-ui.js` | capability layer | M | P0 |
| Superadmin wizard step-based | 6 step + preview | `challenge-ui.js` | model v2 | H | P1 |

## 6) Admin UI

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Template-first wizard | default “Usa template” | `challenge-ui.js` | template repo | M | P0 |
| Custom guided fallback | preset limitati | `challenge-ui.js` | model v2 | M | P1 |
| Local reward attach | select reward locale no free text | `challenge-ui.js` | reward repo | M | P0 |
| Redemption queue | elenco/azione riscatti palestra | `climby.html`, `challenge-ui.js` | redemption repo | H | P1 |

## 7) User UI

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Card split punti vs premio | separare blocchi info | `challenge-ui.js` | model v2 | M | P0 |
| Reward status badge | mostra locked/unlocked/claimed/redeemed | `challenge-ui.js` | redemption data | M | P0 |
| Challenge detail | dettaglio con claim mode/scadenze | `climby.html`, `challenge-ui.js` | reward+redemption | M | P1 |
| Claim action UX | CTA claim/redeem info | `challenge-ui.js` | backend transitions | M | P1 |

## 8) Reward / Redemption

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Reward enum rollout | introdurre enum type ufficiale | `reward-model.js`, `challenge-model.js` | none | M | P0 |
| Challenge-reward binding | `rewardConfig.bindings` | `challenge-model.js`, `challenge-ui.js` | reward enum | M | P0 |
| Redemption audit trail | audit event per status change | `redemption-model.js`, `functions/index.js` | transitions | H | P0 |
| Gym/Sponsor redeem paths | differenziare attori e canali | rules + functions + UI queue | audit trail | H | P1 |

## 9) Testing / QA / migration

| Task | Descrizione | File probabili | Dipendenze | Diff. | Prio |
|---|---|---|---|---|---|
| Unit model tests v2 | normalize/build payload challenge/reward/redemption | `tests/challenge-model.test.js`, new tests | model v2 | M | P0 |
| Rules tests estesi | superadmin inherits admin, gym bounds, redemption transitions | `tests/firestore-challenges.rules.test.js` | rules update | H | P0 |
| Functions integration tests | idempotency points + unlock reward | new tests under `tests/` | functions update | H | P1 |
| Migration scripts/checks | backfill rewardConfig/templateId defaults | scripts/docs + manual checklist | model v2 | M | P1 |

---

## D) Piano file-by-file

| File | Cosa cambiare | Perché | Tipo |
|---|---|---|---|
| `src/features/challenges/challenge-model.js` | aggiungere schema v2 (`templateId`, `rewardConfig`, deprecazioni status/type) + normalize compatibility | ridurre ambiguità e accoppiamenti | Refactor |
| `src/features/challenges/challenge-repository.js` | wiring templates reali, query filtrate, support reward binding, eventualmente read progress canonical | rimuovere flussi nominali e migliorare scalabilità | Refactor |
| `src/features/challenges/challenge-ui.js` | wizard step-based SA/Admin, split punti/premio, preview, redemption states, template-first admin | chiudere gap UX principali | Refactor+New UI |
| `climby.html` | capability gating unificato, superadmin gym-mode first-class, nuovi mount panel reward/redemption | allineare ruolo superset e flussi operativi | Refactor |
| `functions/index.js` | unlock/claim/redeem lifecycle + mantenere idempotency ledger + progress alignment | completare loop business | New logic |
| `rules_firestore.txt` | capability rules granulari per challenge/reward/redemption + transizioni stato | enforcement robusto | Refactor rules |
| `tests/challenge-model.test.js` | coprire normalize/build v2 + backward compatibility | proteggere refactor model | Test update |
| `tests/firestore-challenges.rules.test.js` | casi superadmin superset, gym constraints, reward/redemption permissions | proteggere permessi | Test update |

File nuovi consigliati:
- `src/features/challenges/permissions.js`
- `src/features/challenges/reward-model.js`
- `src/features/challenges/reward-repository.js`
- `src/features/challenges/redemption-model.js`
- `src/features/challenges/redemption-repository.js`

---

## E) Migrazione pragmatica

## E.1 Tenere senza rompere
- `challenges` come runtime collection (fase 1)
- `userChallengeProgress` e `pointsLedger` (rinomina logica PointTransaction)

## E.2 Deprecare gradualmente
- `reward.label` libero
- `type` ambiguo challenge
- doppio `status/lifecycleStatus` (tenere canonico `lifecycleStatus`)

## E.3 Introdurre incrementalmente Reward/Redemption
1. introduci `rewards` schema v1 tipizzato
2. aggiungi `rewardConfig.bindings[].rewardId` in challenge
3. crea `rewardRedemptions` al unlock (anche se UI ancora minima)
4. attiva UI claim/redeem quando backend/rules sono stabili

## E.4 Adapter/normalizer temporanei
- in `challenge-model.js`:
  - se `reward.label` presente e `rewardConfig` assente -> auto-map in placeholder reward binding compat
  - se legacy role `admin` -> map a `gym_admin` nel layer capability (senza rompere rules subito)

## E.5 Split template/instance completo (fase successiva)
- dopo stabilizzazione wizard e usage templates, pulizia campi template-ish dai runtime challenge.

---

## F) Testing strategy

## Unit tests
1. `challenge-model`: normalize v2, fallback legacy, rewardConfig binding.
2. `reward-model`: enum/type/provider/claimMode validation.
3. `redemption-model`: status machine transitions valide/non valide.
4. permissions helpers: superadmin superset.

## Integration tests
1. function routeProgress -> progress update + point ledger idempotente.
2. function unlock reward al completamento/tier.
3. claim/redeem flow con audit trail.

## Security Rules tests
1. superadmin inherits admin behavior su challenge gym.
2. gym_admin vincolato alla propria gym.
3. write reward scope-based (gym/sponsor/global).
4. redemption transitions per attore corretto.

## Regression UX/logic tests
1. wizard SA/Admin non pubblica con dati invalidi.
2. preview coerente con payload finale.
3. card user mostra separazione punti/premio.
4. stati redemption renderizzati correttamente.

Focus richiesti:
- superadmin inheritance
- admin gym bounds
- reward typing
- redemption lifecycle
- point idempotency
- progress canonical source

---

## G) Definition of Done

## Prodotto
- superadmin usa tutti i flussi admin + extra globali.
- template riusabili in produzione.
- reward tipizzati e redemption operativa.

## Tecnico
- model v2 stabile con compat legacy.
- functions idempotenti e auditabili.
- rules coerenti con capability model.

## UX
- wizard guidati con preview e validazioni.
- distinzione sempre visibile: obiettivo/progresso/punti/premio/redemption.

## Permessi
- testato: superadmin superset, admin scoped gym.
- reward/redeem protetti per ruolo/provider.

## Testing
- suite unit/rules/integration aggiornata e verde.
- regression minima su flow user/admin/superadmin.

---

## H) Output finale sintetico

## 1) Roadmap consigliata in ordine
1. Capability layer ruoli
2. Reward typing v1
3. Template wiring reale
4. Redemption lifecycle v1
5. Wizard SA/Admin step-based
6. UX user split punti/premio + redemption states
7. Hardening rules/tests + cleanup legacy

## 2) Top 10 task da fare subito
1. creare `permissions.js` (P0)
2. aggiornare gating `climby.html` per superadmin gym-mode (P0)
3. introdurre `reward-model.js` (P0)
4. introdurre `redemption-model.js` (P0)
5. estendere `challenge-model.js` con `rewardConfig` (P0)
6. aggiornare `challenge-ui.js` split punti/premio (P0)
7. wiring template repo nel wizard (P0)
8. function unlock reward su completion (P0)
9. rules reward/redemption granulari (P0)
10. test rules superadmin superset + admin gym constraints (P0)

## 3) Rischi principali
- regressioni permessi se role mapping non unificato
- incoerenza dati se convivenza legacy troppo lunga
- complessità UI se wizard e model evolvono fuori sync

## 4) Compromessi accettabili (prima release buona)
- tenere `challenges` runtime senza split fisico immediato template/instance
- mantenere `pointsLedger` nome attuale con alias logico PointTransaction
- redemption v1 senza code-pool avanzato (solo manual/qr base)

---

## Riferimenti repo chiave
- `src/features/challenges/challenge-model.js`
- `src/features/challenges/challenge-repository.js`
- `src/features/challenges/challenge-ui.js`
- `climby.html`
- `functions/index.js`
- `rules_firestore.txt`
- `tests/challenge-model.test.js`
- `tests/firestore-challenges.rules.test.js`

