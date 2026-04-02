# Climby — Analisi Sfide con focus Ruoli/Permessi

## Obiettivo di prodotto da verificare
**Regola target:** `superadmin = tutti gli accessi di gym_admin + permessi extra`.

---

## A) Stato attuale

### A.1 Definizione ruoli oggi

### Frontend (normalizzazione)
- `normalizeUserRole(rawRole)` converte:
  - `superadmin -> superadmin`
  - `gym_admin` **oppure** `admin -> admin`
  - tutto il resto -> `user`

Implica che lato UI il ruolo base palestra è chiamato `admin`, non `gym_admin`.

### Firestore Rules
- `isSuperadmin()` controlla `users/{uid}.role == 'superadmin'`.
- `isGymAdminRole()` controlla `role == 'gym_admin' || role == 'admin'`.
- `canManageGym(gymId)` è `isSuperadmin() || isGymOwner(gymId) || managesGym(gymId)`.

Quindi lato rules il superadmin **eredita** la capability gym management.

### Challenges rules specifiche
- `challenges.create`: `isSuperadmin() || isGymAdminChallengeWrite()`
- `challenges.update/delete`: `isSuperadmin() || (isGymAdminChallengeWrite() ...same gym...)`

Quindi lato sicurezza dati il superadmin può tutto ciò che fa gym admin (e oltre).

---

### A.2 Dove i permessi sono applicati

1) **Rules Firestore (vera enforcement authority)**
- blocchi su challenge/template/reward/progress/ledger.

2) **Orchestrazione frontend (gating UX)**
- render pannelli separati e switch mode.
- comportamento diverso tra `currentMode=superadmin` e `currentMode=admin`.

3) **UI manager Sfide**
- pannello superadmin (`renderSuperadminChallengeManager`)
- pannello admin palestra (`renderGymAdminChallengeManager`)

---

### A.3 Dove la UI separa troppo i flussi

1. In `initDashboard()` quando `currentMode === 'superadmin'` viene mostrato solo `superadmin-panel`; `admin-panel` viene nascosto.
2. Il pannello `renderGymAdminChallengesPanel()` è condizionato a `userRole === 'admin'`, quindi un superadmin puro non entra mai direttamente in quel flusso.
3. Per usare modalità admin, il superadmin dipende da `switchMode()` e da `realUserGymId`; se non ha gym associata passa solo tra `superadmin` e `user`.

Risultato: il superadmin **tecnicamente può fare molto**, ma **non eredita in modo nativo/lineare la UX admin**.

---

### A.4 Il superadmin eredita davvero i permessi admin?

## Backend/rules
**Sì, quasi completamente**: `canManageGym()` include superadmin e la regola challenges autorizza superadmin in create/update/delete.

## Frontend/UX
**No, non pienamente**: l’ereditarietà è indiretta (switch mode + prerequisito gym), non by-design nel pannello principale.

---

## B) Problemi concreti

| Problema | Evidenza nel repo | Impatto |
|---|---|---|
| Naming incoerente ruolo base (`admin` vs `gym_admin`) | normalizer FE usa `admin`, rules/model usano anche `gym_admin` | confusione semantica e bug di integrazione |
| Gating UI non ereditario | `renderGymAdminChallengesPanel` solo `userRole === 'admin'` | superadmin non usa naturalmente il flusso admin |
| Ereditarietà condizionata da `realUserGymId` | `switchMode()` per superadmin include `admin` solo se gym valorizzata | superadmin senza gym non può operare come admin palestra da UX standard |
| Duplice manager separato invece capability-layer unico | `renderSuperadminChallengeManager` vs `renderGymAdminChallengeManager` con orchestrazioni parallele | duplicazioni, manutenzione difficile |
| Vincoli prodotto distribuiti in più layer | points/scope limit in rules + override in controller HTML | rischio incoerenza se un layer cambia |
| Coverage test ruoli incompleta | test rules coprono casi base, non "superadmin eredita admin flows" end-to-end | regressioni non intercettate |

---

## C) Proposta corretta (ruolo base + ruolo esteso)

## C.1 Struttura ruoli consigliata
1. **Ruolo base dominio:** `gym_admin`
2. **Ruolo esteso:** `superadmin`
3. **Regola:** `superadmin` include tutte le capability di `gym_admin`
4. **Extra superadmin:** capability globali/cross-gym separate

---

## C.2 Modello permission consigliato (capability-first)

### Capability core
- `manage_gym_challenges`
- `publish_gym_challenges`
- `manage_gym_rewards`
- `manage_global_templates`
- `manage_sponsor_challenges`
- `manage_global_rewards`
- `manage_global_policies`
- `view_global_analytics`
- `cross_gym_operations`

### Mapping ruoli -> capability
- `gym_admin`: prime 3 (scoped su gym gestita)
- `superadmin`: **tutte**

---

## C.3 Capability matrix (target)

| Capability | gym_admin | superadmin |
|---|---:|---:|
| Creare/modificare/pubblicare sfide palestra (propria gym) | ✅ | ✅ |
| Gestire reward locali palestra | ✅ | ✅ |
| Operare su una gym specifica “come admin” | ✅ | ✅ |
| Creare template globali | ❌ | ✅ |
| Creare sfide sponsor | ❌ | ✅ |
| Gestire reward globali | ❌ | ✅ |
| Definire policy punti/reward globali | ❌ | ✅ |
| Operare cross-gym | ❌ | ✅ |
| Vedere analytics globali | ❌ | ✅ |

---

## C.4 Helper da introdurre (frontend + backend service layer)

```js
canManageGymChallenges(user, gymId)
canPublishGymChallenges(user, gymId)
canManageGlobalTemplates(user)
canManageSponsorChallenges(user)
canManageRewards(user, scope) // scope: 'gym' | 'global' | 'sponsor'
canViewGlobalAnalytics(user)
```

Regole suggerite:
- `canManageGymChallenges`: true se `user.role==='superadmin'` oppure (`user.role==='gym_admin'` e `user.gymManaged===gymId`)
- `canManageGlobalTemplates`, `canManageSponsorChallenges`, `canViewGlobalAnalytics`: true solo superadmin
- `canManageRewards(scope='gym')`: gym_admin locale + superadmin; scope global/sponsor solo superadmin

---

## C.5 Semplificazione UX: superadmin deve usare anche il pannello admin

### Linea guida
- Mantenere un solo **Gym Challenge Manager** riusabile, apribile:
  - da Admin (gym implicita)
  - da Superadmin (gym selezionata)

### UX concreta
- Nel pannello superadmin aggiungere sezione fissa:
  - `Agisci come Gym Admin` + select gym + monta **stesso identico componente** admin.
- Eliminare gating rigido `userRole==='admin'` nei render principali; passare da capability + gym context.

---

## C.6 File da modificare (repo, concreti)

1. `src/utils/core-normalizers.js`
- Uniformare ruolo base a `gym_admin` (eventuale alias in ingresso, output canonico unico).

2. `climby.html`
- `runAuthenticatedBootstrap`: mantenere `userRole` canonico e separare `currentMode` da role.
- `initDashboard`: non usare branch mutuamente esclusivi che impediscono al superadmin il flow admin.
- `renderGymAdminChallengesPanel`: sostituire check `userRole === 'admin'` con capability helper.
- `switchMode`: permettere a superadmin di entrare in mode admin anche scegliendo gym context (non solo `realUserGymId`).

3. `src/features/challenges/challenge-ui.js`
- Esporre un manager unico gym-scoped usabile sia da admin sia da superadmin.
- Ridurre duplicazioni tra `renderSuperadminChallengeManager` e `renderGymAdminChallengeManager` per le parti shared.

4. `src/features/challenges/challenge-repository.js`
- Introdurre helper opzionali di authorization pre-write lato client/service (non sostituiscono rules, ma evitano UX incoerente).

5. `rules_firestore.txt`
- Rinominare semanticamente `isGymAdminRole` -> `isGymManagerRole` (accetta alias legacy).
- Mantenere `isSuperadmin()` come superset esplicito nelle funzioni `canManageGym*`.
- (Opzionale) introdurre funzioni rules più granulari su challenge/reward capability.

6. `tests/firestore-challenges.rules.test.js`
- Aggiungere casi: "superadmin può fare tutte le operazioni consentite a gym_admin su challenge gym".
- Aggiungere caso cross-gym superadmin + deny gym_admin fuori gym.

7. (Nuovo) `src/features/challenges/permissions.js`
- Centralizzare helper capability FE.

---

## D) Output finale richiesto

### 1) Sintesi stato attuale
- Lato rules, il superadmin è già un superset forte del gym admin per la gestione challenge (incluso canManageGym).
- Lato frontend, i flussi sono separati e il superadmin non eredita in modo naturale il pannello admin: deve passare da mode switching e dipende da gym context.
- Esiste incoerenza di naming (`admin` vs `gym_admin`) tra normalizzazione FE e dominio/rules.

### 2) Problemi principali
- Ereditarietà UX incompleta (non capability-first).
- Duplicazione componenti/flussi admin vs superadmin.
- Naming ruolo incoerente tra layer.
- Controlli distribuiti tra rules e orchestrazione monolitica.

### 3) Struttura ruoli consigliata
- `gym_admin` = ruolo base operativo palestra.
- `superadmin` = superset di tutte le capability gym_admin + capability globali extra.
- Decisioni autorizzative guidate da capability helper condivisi.

### 4) Lista concreta modifiche file-by-file
- `src/utils/core-normalizers.js`: role canonicalization.
- `src/features/challenges/permissions.js` (nuovo): helper capability.
- `climby.html`: bootstrap/mode/render gating capability-based.
- `src/features/challenges/challenge-ui.js`: manager gym-scoped riusabile da superadmin.
- `rules_firestore.txt`: naming/rules helper più espliciti su ereditarietà.
- `tests/firestore-challenges.rules.test.js`: test ereditarietà superadmin=>gym_admin.

---

## Riferimenti diretti usati nell’analisi
- Normalizzazione ruolo FE: `src/utils/core-normalizers.js`
- Orchestrazione mode/pannelli: `climby.html`
- Manager Sfide FE: `src/features/challenges/challenge-ui.js`
- Repo Sfide: `src/features/challenges/challenge-repository.js`
- Rules ruoli/challenge/reward/progress: `rules_firestore.txt`

