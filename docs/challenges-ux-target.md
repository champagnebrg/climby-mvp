# Climby — UX Target per feature Sfide (Superadmin / Admin palestra / User)

## Obiettivo
Definire una UX finale chiara e scalabile per Sfide, con focus su:
- wizard guidati
- flussi operativi semplici
- separazione netta tra template / challenge pubblicata / reward / redemption / punti
- superadmin come superset dell’admin palestra

---

## A) Stato attuale UX nel repo

### A.1 Pannelli attuali

| Ruolo/mode | Pannello | Stato UX attuale |
|---|---|---|
| Superadmin | `#superadmin-panel` + tab dashboard/sfide | ricco ma separato dal pannello admin |
| Admin palestra | `#admin-panel` + sezione sfide palestra | operativo ma limitato a flow locale |
| User | `#user-panel` + hub sfide | buono per progress card, poco chiaro su reward/redeem |

### Evidenze
- `initDashboard()` separa in branch distinti `superadmin` vs `admin` e nasconde il pannello opposto. 
- `renderSuperadminChallengesPanel()` e `renderGymAdminChallengesPanel()` sono flussi distinti.
- Superadmin può cambiare mode via `switchMode()`, ma usare mode admin dipende da `realUserGymId`.

---

### A.2 Creazione/modifica challenge oggi
- Form guidato unico nel manager superadmin con molti campi in un solo blocco (scope, progress mode, template type, points tier, target, section, reward label, lifecycle, visibility, kind, sponsor/gym, tiers).
- Form admin palestra più corto ma sempre su stesso modello challenge runtime.
- Salvataggio aggiornando stesso documento challenge o creando copia.

### A.3 Quanto è guidato vs libero
- **Guidato**: select su scope/progressMode/template/pointsTier/lifecycle.
- **Troppo libero**: sponsorId testuale libero, reward come label libera, regole/template ancora non realmente template-driven da collection.

### A.4 Overload/ambiguità UX
- Troppi assi decisionali in una sola schermata superadmin.
- Distinzione debole tra:
  - template
  - challenge pubblicata
  - reward
  - punti
- status reward/redemption non visibili lato user perché redemption non modellata.

### A.5 Dove il superadmin non vive bene il flow admin
- Il pannello admin sfide è gated su `userRole === 'admin'`.
- In mode superadmin viene nascosto `admin-panel`.
- Superadmin usa una “vista palestra” embedded, ma non un vero flusso admin first-class.

### A.6 Visualizzazione attuale reward/punti/progresso
- Card utente mostra progresso e una riga reward/punti (`rewardText`) dove i CP e il reward sono presentati nello stesso blocco semantico.
- Nessuno stato redemption (`locked/unlocked/redeemed`).

---

## B) Problemi UX attuali

| Problema | Dove | Impatto pratico | Gravità |
|---|---|---|---|
| Overload form superadmin (troppi campi in una vista) | `renderSuperadminChallengeManager` | aumenta errori configurazione, rallenta operatività | Alta |
| Distinzione debole punti vs reward | card user + reward text | utenti/admin non capiscono se “premio” = punti o bene/servizio | Alta |
| Template vs challenge pubblicata non separati in UX | wizard/repository | admin fatica a riuso coerente | Alta |
| Reward locale/sponsor non guidato | `rewardLabel` + `sponsorId` libero | impossibile standardizzare redeem e reporting | Alta |
| Redemption assente in UI | nessuna vista dedicata | utente non sa come riscattare; admin non gestisce riscatti | Alta |
| Superadmin non eredita UX admin nativamente | `initDashboard` / role gate | incoerenza col principio prodotto (superset) | Alta |
| Form admin rapido ma poco strutturato su reward veri | `renderGymAdminChallengeManager` | limita use-case reali (birra/coupon/codici) | Media |
| Mancanza preview finale completa | wizard attuale | rischio publish con configurazioni errate | Media |
| Campi testuali troppo liberi | sponsorId/rewardLabel | dati sporchi e incoerenti | Media |

---

## C) UX target consigliata

## C.1 Superadmin

### Struttura pannello
1. **Template Manager**
   - tab: `Template Standard`, `Template Sponsor`
2. **Challenge Publisher**
   - crea istanze da template
3. **Reward Catalog Manager**
   - reward globali/sponsor tipizzati
4. **Gym Admin Mode**
   - “Agisci come Admin Palestra” (select gym) usando stesso identico flow admin
5. **Analytics Globali**
   - KPI sfide/reward/redemption

### Naming UI consigliato
- Tab: `Template`, `Sfide Pubblicate`, `Catalogo Premi`, `Modalità Palestra`, `Analytics`
- CTA: `Nuovo template`, `Pubblica sfida`, `Crea premio`, `Apri modalità palestra`

---

## C.2 Admin palestra

### Flussi
1. **Flusso principale (default): `Usa Template`**
   - scegli template approvato
   - personalizza solo campi consentiti
   - collega reward locale da catalogo locale
2. **Flusso secondario: `Custom Guidata`**
   - solo preset sicuri
   - blocchi e limiti stretti

### Blocchi schermata admin
- `Bozze`
- `Pubblicate`
- `Archiviate`
- `Riscatti premio` (queue)

### CTA admin
- `Crea da template`
- `Nuova sfida custom`
- `Pubblica`
- `Pausa`
- `Archivia`
- `Gestisci riscatti`

---

## C.3 User

### Informazioni minime sempre visibili
1. Obiettivo sfida
2. Progresso numerico + barra
3. Punti Climby ottenibili/ottenuti
4. Premio sbloccabile
5. Stato reward redemption
6. Modalità e scadenza riscatto

### Stati premio (badge)
- `Bloccato`
- `Sbloccato`
- `Richiesto`
- `Riscattato`
- `Scaduto`
- `Rifiutato`

---

## D) Wizard di creazione challenge (proposta concreta)

## D.1 Wizard Superadmin (6 step)

### Step 1 — Tipo e contesto
**Campi**
- `Challenge Type` (select): `Standard`, `Sponsor`, `Event`
- `Scope` (select): `Global`, `Gym`, `Sponsor`
- `Owner Context` (auto)

**Obbligatori**: type, scope
**Validazioni**: sponsor scope richiede sponsor selezionato

### Step 2 — Base template
**Campi**
- `Template Source` (select): `Nuovo Template` / `Da Template`
- `Template Name`
- `Template Family`

**Obbligatori**: source + name (se nuovo)

### Step 3 — Regola sfida
**Campi**
- `Metric` (enum)
- `Progress Mode` (single/tiered)
- `Target` o `Milestone tiers`
- `Durata` (preset + date)

**Obbligatori**: metric, mode, target/tiers
**Validazioni**: tiers ordinati; target > 0

### Step 4 — Punti Climby
**Campi**
- `Points Policy` (enum): `Fixed`, `Tier-based`
- `Points Value` o `Points Tier`

**Obbligatori**: points policy
**Nota UX**: etichetta esplicita “**Punti Climby (separati dal premio)**”

### Step 5 — Premio e redemption
**Campi**
- `Reward Enabled` (toggle)
- `Reward` (select da catalogo)
- `Claim Mode` (enum)
- `Validity` / `Limits`

**Obbligatori**: se reward enabled -> rewardId + claim mode
**Validazioni**: claim mode compatibile col reward type/provider

### Step 6 — Preview & publish
**Mostra**
- card user preview
- riepilogo admin operativo
- validazioni bloccanti/warning

**CTA**
- `Salva bozza`
- `Pubblica`

---

## D.2 Wizard Admin palestra (4 step)

## Percorso A — “Usa template” (default)
### Step 1
- seleziona template approvato
- auto-preview campi fissi

### Step 2
- personalizzabili consentiti:
  - titolo breve locale
  - finestra date
  - target (solo range)
  - sezione app

### Step 3
- collega reward locale:
  - select da reward catalog gym
  - claim mode prefiltrato

### Step 4
- preview finale + publish

## Percorso B — “Custom guidata” (secondario)
- disponibile solo preset whitelisted
- niente sponsor scope
- punti policy limitata
- reward solo da catalogo locale

## Cosa Admin NON può modificare
- regole globali template
- sponsor binding globale
- policy globali punti
- template di sistema

---

## E) Struttura schermate (screen-by-screen)

| Schermata | Obiettivo | Blocchi principali | Azioni | Dati mostrati | Differenze ruolo |
|---|---|---|---|---|---|
| `Template Library` | Gestire template | filtri tipo/scope, lista template, stato | crea/modifica/archivia template | rule summary, points policy, allowed overrides | solo superadmin |
| `Challenge Publisher` | Pubblicare istanze | wizard + lista bozze/pubblicate | salva bozza/pubblica/duplica | template origin, periodo, status | superadmin e admin (scoped) |
| `Reward Catalog` | Gestire premi | tabs global/gym/sponsor, form tipizzato | crea/attiva/disattiva | type, provider, claim mode, validity, limits | superadmin full, admin solo gym |
| `Gym Challenges` | Operatività palestra | bozze/pubblicate/archiviate, quick actions | crea da template, publish, pause | target/progresso utenti/claim funnel | admin + superadmin in gym mode |
| `Redemption Queue` | Gestire riscatti | filtri stato/canale, lista richieste | approve/reject/redeem | user, reward, code/qr, audit | admin gym e superadmin |
| `User Challenges Hub` | fruizione utente | lista sfide + stati + reward status | partecipa/claim/redeem-view | obiettivo, progresso, punti, reward, claim mode | user |
| `Challenge Detail` | chiarezza completa | blocco goal/progress, blocco punti, blocco premio, blocco redemption | claim/redeem instructions | timeline stati + scadenze | user |

---

## F) Focus speciale su visualizzazione reward e punti

## F.1 Layout card consigliato (sempre)
1. **Obiettivo**
   - `Completa 5 sessioni`
2. **Progresso**
   - `3/5 completate · 60%`
3. **Punti Climby**
   - `Ottieni 100 punti Climby`
4. **Premio**
   - `Sblocchi 1 birra gratis`
5. **Redemption**
   - `Riscattabile al desk con QR entro 7 giorni`

## F.2 Copy/UI esempio
- Goal: `Completa 5 sessioni`
- Progress: `3 di 5 completate`
- Points: `+100 CP alla conferma completamento`
- Reward: `Premio: 1 birra gratis (Bar Palestra)`
- Redemption status:
  - `Bloccato` → `Sbloccato` → `Richiesto` → `Riscattato`
- Claim helper:
  - `Mostra questo QR al desk`
  - `Codice valido fino al 12/05/2026`

## F.3 Naming stato consigliato
- challenge status admin: `Bozza`, `Pubblicata`, `In pausa`, `Archiviata`
- reward redemption user: `Bloccato`, `Sbloccato`, `Richiesto`, `Riscattato`, `Scaduto`, `Rifiutato`

---

## G) Piano implementazione UX

## Quick wins UX (1-2 sprint)

| Cosa fare | Dove repo | Impatto | Dipendenze |
|---|---|---|---|
| separare visual in card user: blocco punti vs blocco premio | `src/features/challenges/challenge-ui.js` | chiarezza immediata | minima |
| introdurre badge stati redemption placeholder | `challenge-ui.js`, `climby.html` | prepara flusso redemption | modello redemption base |
| ridurre campi liberi (`sponsorId`, `rewardLabel`) con select/lookup | `challenge-ui.js` | meno errori dati | catalogo base |
| aggiungere preview finale prima publish | `challenge-ui.js` | meno errori operativi | validazioni form |

## Refactor medio (2-4 sprint)

| Cosa fare | Dove repo | Impatto | Dipendenze |
|---|---|---|---|
| wizard superadmin multi-step | `challenge-ui.js` + `climby.html` | grande miglioramento operatività | validazioni model |
| wizard admin dual-path (template/custom) | `challenge-ui.js` + repository | admin più veloce | template reali |
| pannello `Redemption Queue` admin/superadmin | `climby.html` + nuovi moduli challenges | abilita reward economy | RewardRedemption model |
| superadmin gym-mode first-class (non embedded secondario) | `climby.html` | allineamento principio prodotto | permissions helper |

## Refactor strutturale (4+ sprint)

| Cosa fare | Dove repo | Impatto | Dipendenze |
|---|---|---|---|
| unificare manager admin/superadmin su capability layer | `challenge-ui.js`, `climby.html` | coerenza e riduzione duplicazioni | role/capability refactor |
| migrare a template-driven UX da collection | `challenge-repository.js`, `challenge-ui.js` | scalabilità reale | challengeTemplates data model |
| integrare end-to-end reward catalog + redemption lifecycle | nuovi moduli + `functions/index.js` + `rules_firestore.txt` | completa il prodotto | modello dati target |

---

## H) Output finale richiesto

## 1) Sintesi UX attuale
- UX funziona per MVP ma con forte sovraccarico nel pannello superadmin.
- admin flow e superadmin flow sono separati più del necessario.
- reward/punti non sono separati in modo netto lato comunicazione utente.
- redemption non ha journey UI.

## 2) Principali problemi UX
- overload form, ambiguità semantiche, assenza redemption UI, separazione artificiale dei flussi ruoli.

## 3) UX target consigliata
- architettura a 3 superfici coordinate: Template/Publish/Reward (SA), Operatività rapida (Admin), Chiarezza progress+reward+redeem (User).

## 4) Wizard finale consigliato
- Superadmin 6 step, Admin 4 step (template-first), preview obbligatoria e validazioni bloccanti.

## 5) File principali da toccare
- `src/features/challenges/challenge-ui.js`
- `src/features/challenges/challenge-model.js`
- `src/features/challenges/challenge-repository.js`
- `climby.html`
- `functions/index.js` (redemption trigger/state)
- `rules_firestore.txt` (permessi redemption/reward)
- `tests/challenge-model.test.js`
- `tests/firestore-challenges.rules.test.js`

## 6) Priorità operative
1. separazione visual punti/premio + preview
2. wizard multi-step + template-first admin
3. redemption queue + stati utente
4. superadmin gym-mode first-class
5. refactor capability-based unificato

---

## Fonti repo usate per questa analisi UX
- `src/features/challenges/challenge-ui.js`
- `climby.html`
- `src/features/challenges/challenge-model.js`
- `src/features/challenges/challenge-repository.js`
- `functions/index.js`
- `rules_firestore.txt`

