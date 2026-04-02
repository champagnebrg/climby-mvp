# Climby — Target Data Model per la feature Sfide

## Scopo
Definire un modello dati finale **chiaro, guidato e scalabile** per supportare:
- Superadmin (superset di gym_admin)
- Admin palestra
- User
- sfide standard / sponsor
- reward gym / sponsor
- punti Climby separati dai reward
- lifecycle di redemption completo

---

## A) Stato attuale nel repo

### A.1 Come è modellata oggi `challenges`
`challenges` è normalizzata da `normalizeChallengeRecord()` e usata come entità centrale runtime.
Campi principali oggi:
- metadata: `title`, `description`, `tags`, `createdBy`, `updatedBy`
- lifecycle: `status`, `lifecycleStatus`, `isActive`
- ownership/scope: `scope`, `ownerType`, `gymId`, `gymIds`, `sponsorId`, `visibility`
- template-ish: `templateType`, `challengeKind`, `type`, `durationPreset`, `displaySectionIds`
- rules/progress: `rules.metric`, `rules.target`, `progressMode`, `progression.tiers[]`
- reward-ish: `reward.rewardId`, `reward.label`, `progression.tiers[].rewardLabel`
- points: `pointsTier`, `pointsValue`

Conclusione: `challenges` oggi incorpora **template + istanza + regola + reward display + points policy + ownership**.

---

### A.2 Collection citate nel dominio Sfide: uso reale oggi

| Collection | Stato attuale | Uso reale |
|---|---|---|
| `challengeTemplates` | Esiste in rules + repo `listTemplates()` | **Nominale/parziale**: non è nel flusso principale di creazione sfida |
| `rewards` | Esiste in rules | **Nominale**: non agganciata a wizard/assegnazione/redeem |
| `rewardTiers` | Esiste in rules | **Nominale**: non agganciata ai challenge runtime |
| `userChallengeProgress` | Scritta da Cloud Function | **Reale**: tracking backend del progresso |
| `pointsLedger` | Scritta da Cloud Function | **Reale**: ledger punti idempotente |
| `challengeAssignments` | Esiste in rules | **Nominale**: non usata nel flusso UI/repository Sfide |
| `sponsors` | Esiste in rules | **Parziale**: `sponsorId` è usato nel challenge ma senza modello sponsor operativo nel flow |
| `gyms` | Core collection progetto | **Reale**: scope gym, filtri membership, gestione admin |

---

### A.3 Entità oggi parziali/nominali
- `challengeTemplates` (non orchestration-driven)
- `rewards` (assenza reward catalog operativo)
- `rewardTiers` (non orchestrata)
- `challengeAssignments` (non orchestrata)
- `RewardRedemption` (assenza totale)

---

## B) Problemi di modello (anti-pattern)

## B.1 Dove `challenges` oggi fa troppe cose
1. **Blueprint + runtime nello stesso documento** (`templateType` + campi di publish/lifecycle concreti).
2. **Points policy + reward model insieme** (`pointsTier/pointsValue` + `reward.label`).
3. **Regole progressione + presentazione reward tier nello stesso payload** (`progression.tiers[].pointsValue/rewardLabel`).
4. **Ownership eterogenea** (`scope`, `ownerType`, `gymIds`, `sponsorId`) senza un layer instance-specific robusto.

## B.2 Accoppiamenti problematici
- reward testuale accoppiato a challenge (non tipizzato, non verificabile)
- punti CP accoppiati alla stessa semantica visuale reward
- template preset hardcoded in UI/model invece che collection-driven
- UI progress client-side separata da `userChallengeProgress` backend (doppia fonte)

## B.3 Campi ridondanti/ambigui
- `status` e `lifecycleStatus` duplicano semantica stato.
- `type` vs `challengeKind` vs `templateType` sovrapposizione semantica.
- `gymId` + `gymIds` coesistenza ambigua.
- `reward.rewardId` esiste ma non guida una relazione reale a `rewards`.

## B.4 Perché oggi non regge una vera reward economy
Mancano:
- catalogo reward tipizzato (`enum type`, provider, claim mode, inventory)
- lifecycle redemption (`locked -> redeemed -> ...`)
- audit trail del riscatto
- code pool/token verification per sponsor/gym
- distinzione chiara tra `point award` e `reward claim`

---

## C) Modello dati consigliato (target)

## C.1 `ChallengeTemplate`
**Responsabilità**
- blueprint governato da superadmin (standard o sponsor)
- definizione vincoli campi editabili da gym_admin

**Campi principali**
- `id`
- `name`, `description`
- `templateFamily` (`standard|sponsor|event|gym_local`)
- `defaultRule` (embedded `ChallengeRule`)
- `defaultPointsPolicy` (es. `fixed` o `tierPreset`)
- `allowedOverrides` (array enum)
- `defaultDisplayConfig` (section/duration hints)
- `status` (`draft|published|archived`)
- `createdBy`, `updatedBy`, timestamps

**Relazioni**
- 1:N con `ChallengeInstance`

**Embedded vs no**
- `defaultRule` embedded
- `points policy` embedded (leggera)

**Esiste oggi?**
- parzialmente (`challengeTemplates` + preset hardcoded)

**Migrazione**
- migrare preset statici di `TEMPLATE_PRESETS`/`TEMPLATE_GUIDE` in documenti `ChallengeTemplate`.

---

## C.2 `ChallengeInstance`
**Responsabilità**
- sfida pubblicata concreta in un contesto (global/gym/sponsor)

**Campi principali**
- `id`
- `templateId` (nullable per custom guided)
- `scope` (`global|gym|sponsor|event|exploration`)
- `ownerType` (`superadmin|gym_admin`)
- `gymId` (nullable)
- `sponsorId` (nullable)
- `title`, `description`
- `ruleResolved` (embedded `ChallengeRule`)
- `pointsPolicyResolved` (embedded: `mode`, `pointsValue/tier`)
- `lifecycleStatus` (`draft|published|inactive|archived|deleted`)
- `startsAt`, `endsAt`, `visibility`
- `rewardConfig` (link/policy, non testo libero)
- timestamps/audit

**Relazioni**
- N:1 `ChallengeTemplate`
- 1:N `UserChallengeProgress`
- 1:N `PointTransaction`
- 1:N `RewardRedemption` (indiretta via unlock)

**Embedded vs no**
- `ruleResolved` embedded (snapshot immutabile per coerenza storica)
- `rewardConfig` lightweight embedded + references esterne

**Esiste oggi?**
- sì, ma mescolata in `challenges`

**Migrazione**
- `challenges` -> trattare come `ChallengeInstance` v1 e progressivamente deprecate campi template-ish.

---

## C.3 `ChallengeRule`
**Responsabilità**
- definire logica di completamento/milestone

**Campi principali**
- `metric` (`routes|days|streak|sectors|gyms`)
- `progressMode` (`single_target|tiered`)
- `target`
- `tiers[]` (`id`, `threshold`, `pointsValue?`, `rewardUnlockRef?`)
- `aggregationWindow` (opzionale)

**Relazioni**
- embedded in template e instance

**Esiste oggi?**
- sì (embedded in `challenges.rules` + `progression.tiers`)

---

## C.4 `Reward`
**Responsabilità**
- catalogo premi tipizzato e riusabile

**Campi principali (proposta concreta)**
- `id`
- `type` enum:
  - `climby_points`
  - `gym_beer`
  - `gym_free_entry`
  - `gym_gadget`
  - `sponsor_discount_code`
  - `sponsor_coupon`
  - `physical_prize`
  - `digital_prize`
  - `custom`
- `providerType` enum: `global|gym|sponsor`
- `providerId` (null per global)
- `title`, `description`
- `claimMode` enum: `auto|qr|code|manual`
- `validity`:
  - `validFrom`, `validTo`, `timezone`, `graceDays`
- `limits`:
  - `inventoryTotal`, `inventoryRemaining`, `perUserLimit`, `dailyLimit`
- `terms` (string/markdown breve)
- `codePoolRef` (nullable)
- `verificationConfig`:
  - `requiresStaffApproval` (bool)
  - `verificationFields[]` (es. receipt, pin)
- `status` (`active|inactive|archived`)
- timestamps/audit

**Relazioni**
- N:M con challenge instance via `ChallengeRewardBinding` (embedded o subcollection)
- 1:N con `RewardRedemption`

**Embedded vs no**
- no embed full reward in challenge; solo reference/binding snapshot minimo

**Esiste oggi?**
- nominalmente (`rewards` in rules), ma va costruito il modello operativo

**Migrazione/Rinomina**
- tenere `rewards` collection; introdurre schema v2 + validazioni.

---

## C.5 `RewardRedemption`
**Responsabilità**
- record transazionale del ciclo di riscatto

**Campi principali**
- `id`
- `userId`
- `challengeInstanceId`
- `rewardId`
- `status` enum: `locked|unlocked|claimed|redeemed|expired|rejected`
- `unlockAt`, `claimAt`, `redeemedAt`, `expireAt`
- `claimChannel` (`auto|qr|code|manual`)
- `claimCode`/`tokenRef` (nullable)
- `verificationData` (staffId, sponsorSystemRef, note)
- `auditTrail[]` (eventi stato + actor + timestamp)

**Relazioni**
- N:1 user
- N:1 reward
- N:1 challenge instance

**Esiste oggi?**
- no

---

## C.6 `UserChallengeProgress`
**Responsabilità**
- progresso ufficiale user per challenge instance

**Campi principali**
- `userId`, `challengeInstanceId`, `seasonId`
- `metric`, `value`, `target`
- `progressMode`
- `status` (`in_progress|completed`)
- `milestonesUnlocked[]`
- `updatedAt`

**Esiste oggi?**
- sì (già scritto dalla Cloud Function)

**Evoluzione**
- mantenerla e renderla source-of-truth anche lato UI (non solo calcolo client-side).

---

## C.7 `PointTransaction` (rename di `pointsLedger`)
**Responsabilità**
- ledger append-only punti CP

**Campi principali**
- `id` (idempotency key)
- `userId`, `seasonId`, `challengeInstanceId`
- `points`
- `pointType` (`CP`)
- `reason` (`challenge_completion|tier_unlock|manual_adjustment`)
- `awardedAt`

**Esiste oggi?**
- sì come `pointsLedger`

**Migrazione**
- mantenere collection e introdurre alias logico `PointTransaction` a livello dominio.

---

## C.8 `Sponsor`
**Responsabilità**
- anagrafica sponsor + policy reward sponsor

**Campi**
- `name`, `status`, `contacts`, `brandAssets`
- `integrationType` (`manual|api`)
- `redemptionPolicy`

**Esiste oggi?**
- nominale in rules, parziale nel flow (`sponsorId` su challenge)

---

## C.9 `Gym`
**Responsabilità**
- contesto locale admin + reward provider locale

**Campi aggiuntivi consigliati**
- `localRewardPolicy`
- `claimVerificationMode`

**Esiste oggi?**
- sì

---

## D) Focus speciale su Reward model

## D.1 Distinzione punti vs reward
- `climby_points` può essere un reward type, ma operativamente i punti devono sempre passare da `PointTransaction`.
- Per challenge:
  - **points policy** decide CP
  - **reward binding** decide premio riscattabile
- Queste due cose devono restare separate nel modello e nella UI.

## D.2 Come collegare reward alla challenge
Opzione consigliata (semplice, scalabile):
- in `ChallengeInstance.rewardConfig`:
  - `mode`: `none|single|tiered`
  - `bindings[]`: `{ milestoneId?, rewardId, unlockCondition }`
- `Reward` resta entità separata; `rewardConfig` contiene solo riferimenti e snapshot minimi di sicurezza.

## D.3 Code pool / token / verification
- Per `claimMode=code`: `RewardCodePool` collection con codici pre-generati, stato `available/assigned/redeemed`.
- Per `claimMode=qr`: token short-lived o signed payload + validazione staff.
- Per `manual`: `requiresStaffApproval=true` e workflow approvazione.

---

## E) Focus speciale su RewardRedemption lifecycle

## E.1 Lifecycle minimo
`locked -> unlocked -> claimed -> redeemed`
rami alternativi: `expired`, `rejected`

## E.2 Quando creare il record
- `locked`: opzionale all’enroll challenge (solo se serve tracciamento anticipato)
- `unlocked`: al raggiungimento condizione reward (trigger progress completion/milestone)

## E.3 Chi può cambiare stato
- `locked/unlocked`: sistema (Cloud Function)
- `claimed`: user (azione esplicita claim)
- `redeemed`: staff gym/sponsor/superadmin secondo provider
- `rejected`: staff/sponsor/superadmin con motivo
- `expired`: job schedulato/sistema

## E.4 Campi audit minimi
- `status`, `previousStatus`, `changedBy`, `changedByRole`, `changedAt`, `reason`, `channel`

## E.5 Redeem palestra vs sponsor
- `providerType=gym`: validazione da gym admin/staff gym (scope gymId)
- `providerType=sponsor`: validazione sponsor operator o integrazione API sponsor
- superadmin con override su entrambi

---

## F) Strategia di transizione pragmatica (incrementale)

## Fase 1 — Hardening senza rompere
1. Tenere `challenges` come source runtime.
2. Introdurre schema `Reward` reale in `rewards`.
3. Introdurre `RewardRedemption` collection + lifecycle base.
4. Rinominare concettualmente `pointsLedger` => `PointTransaction` (senza migrazione fisica immediata).
5. Ridurre ambiguità in challenge:
   - deprecare gradualmente `reward.label` libero
   - introdurre `rewardConfig.bindings[].rewardId`

## Fase 2 — Template-driven reale
6. Spostare preset hardcoded a `challengeTemplates`.
7. Wizard admin/superadmin basato su template + allowed overrides.
8. `ChallengeInstance` popolata con `templateId` + snapshot rule resolved.

## Fase 3 — Refactor strutturale
9. Pulizia campi legacy (`type` ambiguo, doppio status, ecc.).
10. Unificare UI progress su `userChallengeProgress` backend.
11. Estendere rules/test per redemption provider-specific.

---

## G) Output finale richiesto

## 1) Sintesi stato attuale
- Modello attuale funziona per MVP punti/progresso ma non per reward economy completa.
- `challenges` è troppo carica e accoppiata.
- esistono collection pronte (`rewards`, `challengeTemplates`) ma non orchestrate end-to-end.
- redemption non esiste.

## 2) Anti-pattern principali
- entità monolitica (`challenges`)
- reward testuale non tipizzato
- punti/reward mescolati
- campi ridondanti/ambigui
- entità nominali non integrate

## 3) Schema entità consigliato
- `ChallengeTemplate`
- `ChallengeInstance`
- `ChallengeRule`
- `Reward`
- `RewardRedemption`
- `UserChallengeProgress`
- `PointTransaction`
- `Sponsor`
- `Gym`

## 4) Schema relazioni consigliato
- Template 1:N Instance
- Instance 1:N UserChallengeProgress
- Instance 1:N PointTransaction
- Reward 1:N RewardRedemption
- Instance N:M Reward (via reward bindings)
- Sponsor/Gym 1:N Reward

## 5) Lista file da toccare nel repo
- `src/features/challenges/challenge-model.js`
- `src/features/challenges/challenge-repository.js`
- `src/features/challenges/challenge-ui.js`
- `climby.html`
- `functions/index.js`
- `rules_firestore.txt`
- `tests/challenge-model.test.js`
- `tests/firestore-challenges.rules.test.js`
- (nuovi) `src/features/challenges/reward-model.js`, `src/features/challenges/redemption-repository.js`

## 6) Priorità implementazione
1. Reward model + RewardRedemption (core business gap)
2. Separazione points policy vs reward binding
3. Template collection realmente usata nel wizard
4. Pulizia campi ambigui su `challenges`
5. consolidamento progress source-of-truth backend

---

## Riuso concreto dal codice attuale (cosa tenere)
- `userChallengeProgress` pipeline backend (buona base)
- `pointsLedger` idempotente (ottimo da evolvere in PointTransaction)
- enum metric/progress mode già presenti
- lifecycle publish/inactive/archive già avviato

