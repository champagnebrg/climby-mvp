# Climby — Analisi approfondita sezione Sfide (Superadmin / Admin palestra / User)

## A) Mappatura attuale

### A.1 Moduli/pagine/API/dati coinvolti
- **UI Sfide (render user + manager admin/superadmin)**: `src/features/challenges/challenge-ui.js`
- **Model/normalizzazione challenge + config schermo**: `src/features/challenges/challenge-model.js`
- **Repository Firestore challenges/templates/config**: `src/features/challenges/challenge-repository.js`
- **Integrazione nel monolite HTML (orchestrazione ruoli, salvataggi, lifecycle)**: `climby.html`
- **Assegnazione automatica progressi/punti (Cloud Function)**: `functions/index.js`
- **Permessi Firestore (challenge, template, rewards, ledger, progress)**: `rules_firestore.txt`
- **Test principali esistenti**:
  - model: `tests/challenge-model.test.js`
  - security rules: `tests/firestore-challenges.rules.test.js`

### A.2 Ruoli oggi: Superadmin / Admin / User
- **Superadmin**: pieno controllo su `challenges`, `challengeTemplates`, `challengeScreenConfig`, `rewards`, `sponsors`, `rewardTiers`, `seasons`, `levelConfig` (a livello rules). Può hard-delete/soft-archive via UI manager. 
- **Admin palestra**:
  - lato app è normalizzato a `admin` (da `gym_admin` o `admin`), quindi c’è una dualità semantica (`gym_admin` nelle rules/model ma `admin` nel client).
  - può creare/aggiornare solo challenge con scope `gym`, ownerType `gym_admin`, gym gestita, sponsor nullo, e punti vincolati al tier.
- **User**: legge challenge pubblicate e attive; legge propri `userChallengeProgress` e `pointsLedger`; non scrive ledger/progress.

### A.3 Creazione challenge oggi
- **UI guided form** con singolo payload (`buildGuidedPayload`) che miscela metadati challenge + reward label + punti + progressione.
- Superadmin può impostare scope (`global/gym/sponsor/event`), templateType, punti, target, sezione, sponsorId, lifecycle.
- Admin palestra usa form ridotto ma comunque sullo stesso documento `challenges`; lato orchestrazione forzato `gymId` corrente e `pointsTier: small`.

### A.4 Premi oggi
- Nel documento challenge c’è solo `reward: { rewardId, label }` + eventuale `rewardLabel` sui tier (solo testo).
- Esiste collection `rewards` nelle rules ma non è integrata nei flussi UI/repository della feature Sfide.
- Esiste `rewardTiers` in rules, ma non agganciata nel ciclo challenge-user.

### A.5 Punti oggi
- `pointsTier` (`small|medium|large`) + `pointsValue` nel challenge.
- Cloud Function su write di `routeProgress` calcola metriche, aggiorna `userChallengeProgress`, crea `pointsLedger` idempotente e incrementa `userSeasonStats.totalPoints`.
- Per modalità tiered assegna punti per milestone (`progression.tiers[].pointsValue`).

### A.6 Progresso utente oggi
- Fonte metrica primaria lato backend: tutte le `users/{uid}/routeProgress` aggregate.
- La funzione salva progress per ogni challenge in `userChallengeProgress` con `status`, `metric`, `value`, `target`, `progressMode`.
- Lato UI user il progresso è ricostruito client-side da `routeProgressMap` e non da `userChallengeProgress`.

### A.7 Riscatto premi oggi
- **Non esiste un flusso di redemption implementato** (niente `RewardRedemption`, niente stato riscattato/non riscattato, niente canale di validazione locale palestra/sponsor).

### A.8 Differenza tra template/challenge/reward/redemption
- `challengeTemplates`: collection prevista + read helper (`listTemplates`) ma non usata nel wizard reale.
- `challenges`: unica entità “runtime” che contiene un po’ tutto (template info, regole, punti, reward testo, ownership).
- `reward`: presente come subcampo testuale nel challenge; collection `rewards` scollegata dai flussi.
- `redemption`: assente.

---

## B) Problemi attuali (UX / ruoli / dati / scalabilità)

| Problema | Dove | Perché è un problema | Impatto pratico | Gravità |
|---|---|---|---|---|
| Entità troppo accorpata (`challenges` fa template+istanza+reward-promo) | `challenge-model`, `challenge-ui`, `climby` | Mescola responsabilità diverse | difficile evolvere sponsor/local reward/redemption | Alta |
| Naming ruolo incoerente (`admin` vs `gym_admin`) | `core-normalizers`, `rules_firestore`, payload ownerType | Semantica non univoca in FE/BE | bug permessi, confusione governance | Alta |
| Template collection esiste ma non è nel flusso principale | `challenge-repository:listTemplates` | “Template” nominale ma non operativo | admin non riusa davvero template dati | Media |
| Reward modellato solo come label | `challenge-model.reward`, `challenge-ui.rewardLabel` | manca tipizzazione premio, inventario, claim policy | impossibile gestire premi reali (bar/sponsor/codici) | Alta |
| Nessun redemption lifecycle | assente nel repo feature | manca tracking claim/validazione/scadenza | impossibile delivery robusta premi | Alta |
| Punti e premio confusi nella stessa UX card | `challenge-ui:rewardText` | CP e reward fisico appaiono intercambiabili | utente non capisce cosa ottiene davvero | Media |
| Form superadmin troppo denso in un blocco unico | `renderSuperadminChallengeManager` | molte decisioni in una schermata, senza step | errori configurazione, cognitive overload | Media |
| Scope sponsor/event senza vincoli forti di schema | `buildGuidedPayload`, `normalizeChallengeRecord` | campi opzionali troppo liberi | challenge incoerenti in produzione | Alta |
| Filter lettura sfide in memoria (`getDocs` full) | `listChallenges` | scala male al crescere dei documenti | costi/latenza crescenti | Media |
| Doppia fonte progresso (UI ricostruita vs BE persistita) | `renderChallengesHub` vs `functions/index.js` | possibile divergenza temporale/logica | mismatch stato utente | Media |
| Admin palestra “forzato small” lato orchestration, non semantica di prodotto | `climby.html` save admin | vincolo disperso nel controller, non nel modello | manutenzione fragile | Media |
| `rewards`/`rewardTiers`/`challengeAssignments` collections senza integrazione end-to-end | `rules_firestore` + repo | design incompleto/non allineato | debito tecnico e confusione dominio | Media |

---

## C) Gap rispetto alla struttura target

### Copertura attuale vs target
- **Superadmin template + regole globali**: parzialmente supportato (preset + screen config + rules), ma manca una vera entità template usata end-to-end.
- **Admin usa template e personalizza solo campi consentiti**: parzialmente; esiste wizard guidato, ma non c’è enforcement strutturato dei campi overridable per template.
- **User experience chiara su sfida/progresso/premio**: parziale; progresso buono visivamente, premio ambiguo e redemption assente.
- **Separazione punti vs premio**: insufficiente (stesso layer semantico nelle card e nel payload).
- **Tipi sfida standardizzati**: presenti enum/preset, ma scope/kind/type/templateType convivono con ridondanza.
- **Creazione guidata non libera**: migliorata rispetto a form liberi, ma ancora monolitica e con troppi assi decisionali insieme.

Verdetto sintetico: **base tecnica discreta, modello dominio ancora ibrido e non pronto per premi reali + sponsorizzazioni scalabili**.

---

## D) Proposta di ristrutturazione (concreta sul repo attuale)

### D.1 Cosa tenere
- Normalizzazione e enum di base (`scope`, `progressMode`, `lifecycle`).
- Pipeline automatica progress/punti in Cloud Function con idempotenza ledger.
- Manager separati superadmin/admin (concetto buono).

### D.2 Cosa semplificare/subito
- Consolidare naming ruolo: dominio unico `gym_admin` (con alias tecnico solo in adapter).
- Rimuovere ridondanze `status`/`lifecycleStatus` (tenere uno stato canonico).
- Ridurre campi challenge a quelli runtime; spostare logica riusabile in template.

### D.3 Cosa separare (nuove entità)

#### 1) `ChallengeTemplate`
- **Responsabilità**: blueprint riusabile (regole base, UX defaults, vincoli override).
- **Campi**: `id`, `name`, `templateType`, `scopePolicy`, `defaultRules`, `defaultPointsPolicy`, `allowedOverrides[]`, `isSponsorTemplate`, `status`.
- **Relazioni**: 1:N con `ChallengeInstance`.
- **Esiste oggi**: collection sì, flusso no.

#### 2) `ChallengeInstance`
- **Responsabilità**: sfida pubblicata concreta (periodo, owner, contesto gym/sponsor/event).
- **Campi**: `templateId?`, `title`, `description`, `scope`, `gymId?`, `sponsorId?`, `startsAt`, `endsAt`, `publishStatus`, `rulesResolved`, `pointsPolicyResolved`, `rewardPolicyId?`.
- **Relazioni**: N:1 template, 1:N progress, 1:N point tx, 1:N redemption eligibility.
- **Esiste oggi**: quasi tutta in `challenges`.

#### 3) `ChallengeRule`
- **Responsabilità**: definizione metrica/target/milestone (versionabile).
- **Campi**: `metric`, `target`, `progressMode`, `tiers[]`, `aggregationWindow`.
- **Relazioni**: embedded o 1:1 con template/instance.
- **Esiste oggi**: embedded in `challenges.rules/progression`.

#### 4) `Reward`
- **Responsabilità**: catalogo premio tipizzato (globale, sponsor, locale palestra).
- **Campi**: `type(enum)`, `title`, `description`, `providerType(superadmin|gym|sponsor)`, `providerId`, `claimMode(qr|code|manual|auto)`, `inventory`, `validity`, `terms`.
- **Relazioni**: N:M con challenge instance via policy/eligibility.
- **Esiste oggi**: collection rules sì, ma non nel flusso.

#### 5) `RewardRedemption`
- **Responsabilità**: tracciamento riscatto effettivo.
- **Campi**: `userId`, `rewardId`, `challengeInstanceId`, `status(unlocked|claimed|redeemed|expired|rejected)`, `unlockAt`, `redeemedAt`, `redeemedBy`, `verificationData`.
- **Relazioni**: N:1 reward, N:1 user, N:1 challenge instance.
- **Esiste oggi**: manca.

#### 6) `UserChallengeProgress`
- **Responsabilità**: stato progresso ufficiale utente per sfida.
- **Campi**: `userId`, `challengeInstanceId`, `value`, `target`, `status`, `lastEventAt`, `milestonesUnlocked[]`.
- **Relazioni**: N:1 challenge instance.
- **Esiste oggi**: sì (`userChallengeProgress`) ma non usata come fonte unica UI.

#### 7) `PointTransaction`
- **Responsabilità**: ledger punti append-only.
- **Campi**: `userId`, `seasonId`, `challengeInstanceId`, `amount`, `reason`, `idempotencyKey`, `awardedAt`.
- **Relazioni**: N:1 user/challenge/season.
- **Esiste oggi**: sì (`pointsLedger`) — da rinominare semanticamente.

#### 8) `Sponsor`
- **Responsabilità**: anagrafica sponsor e policy campaign.
- **Campi**: `name`, `status`, `contact`, `rewardCapabilities`, `branding`.
- **Relazioni**: 1:N rewards, 1:N challenge instances.
- **Esiste oggi**: collection prevista in rules.

#### 9) `Gym`
- **Responsabilità**: owner locale + vincolo amministrazione.
- **Campi**: già presenti; aggiungere `rewardClaimChannels`, `localRewardPolicy` opzionali.
- **Relazioni**: 1:N challenge instances locali; 1:N reward locali.
- **Esiste oggi**: sì.

---

## E) Flussi consigliati

1. **Superadmin crea template standard**
   - Step: tipo sfida → regola metrica → punti policy globale → campi overridable.
   - Output: `ChallengeTemplate(status=draft/published)`.

2. **Superadmin crea template sponsor**
   - Step standard + sponsor capability + reward type ammessi + claim mode.
   - Output: template vincolato a `isSponsorTemplate=true`.

3. **Admin crea/pubblica sfida palestra**
   - Sceglie template tra consentiti.
   - Può modificare solo `allowedOverrides` (es. titolo locale, finestra date, reward locale, target entro range).
   - Pubblica `ChallengeInstance(scope=gym, gymId=...)`.

4. **User partecipa**
   - Opt-in esplicito (se richiesto) o auto-enroll su prima attività.
   - UI mostra regola + stato + premio sbloccabile separati.

5. **User completa**
   - Function aggiorna `UserChallengeProgress`.
   - Se completamento: scrive `PointTransaction` + eventuale `RewardRedemption(status=unlocked)`.

6. **User sblocca/riscatta premio**
   - Card premio con CTA `Riscatta`.
   - Genera token/QR/codice e passa a `claimed`.
   - Verifica staff/sponsor → `redeemed` con audit trail.

---

## F) Miglioramenti UX concreti

### Superadmin panel
- Wizard 4 step: **Template base → Regole → Punti → Reward policy & publish**.
- Bloccare campi con enum/select:
  - `scope`, `progressMode`, `metric`, `pointsPolicy`, `rewardType`, `claimMode`.
- Campo libero solo dove serve:
  - titolo, descrizione breve, termini premio.
- Preview finale obbligatoria (vista user + validazioni).

### Admin palestra panel
- Flusso “**Usa template**” come default, “**Crea custom guidata**” secondario.
- Bloccare editing di campi globali (metrica, point policy globale, sponsor binding).
- Consentire solo: date, titolo locale, reward locale, soglia entro range template.

### User screen
- Separare visivamente:
  - **Progresso sfida** (metrica/target)
  - **Punti CP** (quanto ottieni)
  - **Premio** (cosa riscatti e come)
- Stato premio esplicito: `Non sbloccato` / `Sbloccato` / `Riscattato` / `Scaduto`.

---

## G) Piano di refactor prioritizzato

### Quick wins (1-2 sprint)
1. **Allineare naming ruoli FE/BE (`gym_admin`)**
   - Impatto: alto su chiarezza permessi.
   - Difficoltà: bassa.
2. **Introdurre `reward.type` enum minimo nel challenge corrente**
   - Impatto: medio-alto (chiarezza UX).
   - Difficoltà: bassa.
3. **Usare `userChallengeProgress` come fonte primaria UI sfide**
   - Impatto: medio (coerenza stato).
   - Difficoltà: media.

### Refactor medio (2-4 sprint)
4. **Attivare davvero `challengeTemplates` nel wizard**
   - Impatto: alto su produttività admin.
   - Difficoltà: media.
5. **Introdurre `Reward` catalogo collegato a sfide**
   - Impatto: alto su sponsor/local rewards.
   - Difficoltà: media.
6. **Aggiungere `RewardRedemption` con lifecycle base**
   - Impatto: altissimo (feature business core).
   - Difficoltà: media-alta.

### Refactor strutturale (4+ sprint)
7. **Split completo Template vs Instance**
   - Impatto: altissimo su scalabilità prodotto.
   - Difficoltà: alta.
8. **Policy engine override (allowedOverrides) + validazioni server-side**
   - Impatto: alto su robustezza multi-tenant.
   - Difficoltà: alta.
9. **Event-driven domain (progress completed -> points tx + unlock reward)**
   - Impatto: alto su affidabilità e audit.
   - Difficoltà: alta.

Dipendenze principali:
- prima il naming/permessi, poi entità reward/redemption, poi split template-instance.

---

## H) Output finale sintetico

1. **Stato attuale in 10 righe**
   - La feature Sfide ha una base buona: enum, normalizzazione, wizard guidato, lifecycle e funzione di awarding punti.
   - Tuttavia il modello è ibrido: la collection `challenges` contiene template-ish info, runtime instance, reward testo e punti insieme.
   - Esistono collection strutturali (`challengeTemplates`, `rewards`, `rewardTiers`) ma non sono integrate nel flusso principale.
   - La UI user mostra bene il progresso, ma non distingue bene punti CP da premio reale.
   - Il riscatto premi non è implementato.
   - I ruoli hanno naming non uniforme (`admin` vs `gym_admin`) e logica dispersa tra FE/rules.
   - L’admin palestra ha limiti utili ma applicati in modo non completamente centralizzato.
   - La lettura challenges è full-scan client-side.
   - C’è doppia fonte di verità del progresso (client computed vs backend persisted).
   - In sintesi: solida MVP tecnica, non ancora pronta per reward economy completa.

2. **Principali criticità**
   - assenza redemption,
   - reward non tipizzati,
   - template non realmente operativi,
   - dominio challenge troppo accoppiato,
   - confusione semantica ruoli/punti/premi.

3. **Architettura consigliata**
   - separare nettamente `ChallengeTemplate` e `ChallengeInstance`;
   - introdurre `Reward` tipizzato + `RewardRedemption`;
   - mantenere `UserChallengeProgress` e `PointTransaction` come fonti canonical;
   - enforce server-side su campi overridable per gym admin.

4. **Priorità assolute**
   1) redemption model,
   2) reward typing,
   3) template reali nel wizard,
   4) allineamento ruoli e permessi,
   5) separazione punti vs premi in UX.

