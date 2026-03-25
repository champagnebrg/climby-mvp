# Climby — Piano di refactor SAFE (behaviour-preserving)

## Scopo
Questo documento propone un piano **conservativo e incrementale** per ridurre il monolite `climby.html` senza alterare comportamento, UI/UX, ordine di inizializzazione, side effects, eventi, API calls, naming contrattuale lato backend o stato applicativo.

> Regola guida: in caso di dubbio tra pulizia e sicurezza, vince la sicurezza.

## 1) Analisi architetturale del monolite

### Evidenze strutturali principali
- File monolitico: `climby.html` con **8874 righe**.
- CSS inline in `<style>`: da riga 14 a 1163 (**~1150 righe**).
- Script applicativo inline `type="module"`: da riga 1793 a 8853 (**~7061 righe**).
- Funzioni dichiarate nel file: **257**.
- Riferimenti/assegnazioni globali `window.*`: **84**.
- Handler inline in HTML `onclick="..."`: **36**.

### Pattern di accoppiamento individuati
1. **Global state molto esteso nello script principale**
   - Numerosi `let` globali condivisi tra feature diverse (auth, social, viewer 3D, admin, eventi, progress tracker).
   - Rischio: effetto domino su regressioni quando si sposta codice senza preservare ordine e scope.

2. **Contratti tra markup e script basati su ID e callback globali**
   - L’HTML usa molti `onclick="window.xxx()"`.
   - Rischio: rompersi facilmente se cambia timing di bootstrap o esposizione su `window`.

3. **Mix di responsabilità nello stesso modulo**
   - nello stesso script convivono: bootstrap Firebase, auth, dashboard, social feed, review, progress, admin editor 3D, notifiche, onboarding.
   - Rischio: alta superficie per side effects involontari.

4. **Logica sensibile all’ordine di inizializzazione**
   - Import, inizializzazione Firebase, set di variabili globali, binding listener e funzioni `window.*` sono nello stesso flusso.
   - Rischio: anche micro-spostamenti possono alterare startup sequence.

5. **Uso misto di import modulari + logica locale monolitica**
   - Sono già presenti moduli in `src/` (`config`, `utils`, `features/events`, `features/maps`), ma la “regia” resta nel file monolitico.
   - Opportunità SAFE: estrarre prima wrapper puri e costanti, poi solo funzioni leaf.

## 2) Strategia a fasi (ordine per rischio crescente)

## Fase 0 — Baseline e rete di sicurezza (prima di toccare codice)
- **Interventi**
  - Congelare baseline: snapshot comportamento (manual checklist), percorsi critici mobile/desktop, smoke auth/admin/user.
  - Definire “no-go rules” operative nel team (nessun cambio logico, nessun rename contratto DB/API).
- **Rischio**: basso
- **Impatto**: alto
- **Motivo rischio**: quasi nullo perché non modifica runtime, ma abilita rollback rapido.

## Fase 1 — Estrazioni puramente statiche (senza cambiare esecuzione JS)
- **Interventi**
  - Spostare CSS inline in `src/styles/climby.css` mantenendo stesso ordine regole.
  - In HTML sostituire `<style>` con `<link rel="stylesheet" ...>`.
- **Rischio**: basso
- **Impatto**: medio
- **Motivo rischio**: eventuali differenze di cascata/precedenza se cambia accidentalmente ordine o media context.

## Fase 2 — Hardening dei confini (senza cambiare comportamento)
- **Interventi**
  - Introdurre nel monolite una sezione “public API binding” unica (solo riordino interno), mantenendo identici nomi `window.*`.
  - Catalogare gli ID DOM “contrattuali” in una costante locale documentata (nessuna modifica uso).
- **Rischio**: basso
- **Impatto**: medio
- **Motivo rischio**: rischio solo se si anticipa/posticipa binding rispetto al momento attuale.

## Fase 3 — Estrazione di utility pure (leaf functions)
- **Interventi**
  - Spostare in `src/utils/` solo funzioni deterministiche senza side effects (es. normalizzazioni/formatter locali non dipendenti da stato globale o DOM).
  - Reimportare dal modulo mantenendo stessa firma e stessi valori di ritorno.
- **Rischio**: medio-basso
- **Impatto**: medio
- **Motivo rischio**: possibile regressione su coercion/null handling se cambia anche minimamente implementazione.

## Fase 4 — Estrazione costanti/config non dinamiche
- **Interventi**
  - Spostare costanti statiche interne (chiavi localStorage, soglie gesture, literal ripetuti) in `src/config/constants.js` o file dedicati.
  - Non toccare costanti che fungono da chiavi backend se non copia 1:1.
- **Rischio**: medio
- **Impatto**: medio
- **Motivo rischio**: typo o rename accidentale su stringhe contrattuali.

## Fase 5 — Micro-moduli per feature isolate (solo orchestrazione invariata)
- **Interventi**
  - Estrarre gruppi coesi con poche dipendenze globali (es. rendering pannelli puramente UI, helper onboarding non critici) in `src/features/...`.
  - Il file monolitico resta orchestratore e mantiene stesso ordine di init.
- **Rischio**: medio
- **Impatto**: alto
- **Motivo rischio**: crossing dependencies con stato globale e timing listener.

## Fase 6 — Aree ad alta fragilità (ultima)
- **Interventi**
  - Solo quando coperti da checklist forte/test: auth bootstrap, 3D viewer interactions, social/progress side effects, subscriptions firestore, switching mode admin/user/superadmin.
- **Rischio**: alto
- **Impatto**: alto
- **Motivo rischio**: cluster più accoppiato e side-effect heavy.

## 3) Cosa estrarre subito senza rischio
- CSS inline in file dedicato (ordine invariato).
- Commenti strutturali e sezioni nel monolite (delimitatori “Auth / Dashboard / Social / Viewer / Admin”).
- Utility strettamente pure (dopo verifica input/output snapshot).
- Elenco centralizzato di selettori/ID DOM **senza** cambiare i valori.

## 4) Cosa NON toccare in prima fase
- Sequenza bootstrap app/auth/firestore e callback `onAuthStateChanged`.
- Funzioni esposte su `window` usate da `onclick` inline.
- Logica di side effects progress/reviews/social feed.
- Handler pointer/touch nel viewer 3D e gesture threshold.
- Query/subscription firestore con order/where/limit/startAfter.
- Mapping stringhe contrattuali (collection names, doc ids composti, status enums).

## 5) Cosa proteggere con test/checklist prima di modificare
- **Auth e ruoli**: login/register/logout, email verification, mode switch user/admin/superadmin.
- **Viewer 3D**: apertura settore, tap admin, save/delete route, chiusura viewer.
- **Social + reviews**: pubblicazione review, lista commenti, rating medio, pannello commenti.
- **Route progress**: project/climbed, tentativi, feed update, history append, KPI profilo.
- **Eventi**: lista/admin editor/registrazioni/live competition entry.
- **Notifiche**: subscribe/unsubscribe, mark all read, open target.

## 6) Struttura target minima consigliata (coerente con architettura attuale)
> Obiettivo: cambiare packaging, non comportamento.

- `climby.html`
  - markup + placeholders
  - nessuna business logic nuova
- `src/styles/climby.css`
  - CSS estratto 1:1
- `src/app/main.js` (o mantenere script in html in step iniziale)
  - solo bootstrap/orchestrazione globale
- `src/app/public-api.js`
  - binding centralizzato `window.*`
- `src/features/<feature>/...`
  - moduli già presenti + eventuali estrazioni incrementalissime
- `src/utils/...`
  - helper puri
- `src/config/...`
  - costanti statiche e chiavi

## 7) Prime modifiche da fare SUBITO (rischio basso)
1. **Preparare checklist regressione baseline** (documento operativo, nessun runtime change).
2. **Estrarre CSS in file dedicato** con confronto visuale mobile/desktop.
3. **Introdurre commenti di sezione nel JS monolite** per delimitare blocchi (nessun cambio logico).
4. **Inventario `window.*` + `onclick`** e definizione “contract list” da non rompere.

## 8) Aree pericolose da rimandare
- `onAuthStateChanged` + bootstrap dashboard.
- Gestione subscriptions multiple con unsubscribe condizionali.
- Catena side effects in `upsertRouteProgress`/`handleClimbedProgressSideEffects`.
- Event delegation e pointer/touch handling nel viewer.
- Qualsiasi funzione che scrive su più collection nello stesso flusso.

## 9) Checklist regressione funzionale (da eseguire dopo ogni step)

### Smoke generale
- App carica senza errori console bloccanti.
- Lingua IT/EN cambia testi come prima.
- Navigazione tra viste invariata.

### Auth
- Register utente nuovo.
- Login utente esistente.
- Logout.
- Blocco/gestione email non verificata (se previsto).

### Dashboard e modalità
- Modalità user funziona.
- Modalità admin (se utente admin) funziona.
- Modalità superadmin (se presente) funziona.
- Switch mode mantiene lo stesso risultato.

### Viewer 3D
- Apertura modello 3D settore.
- Chiusura viewer ripristina stato UI.
- Admin: tap su parete apre editor route.
- Save route e delete route invariati.

### Social / Review / Tracker
- Apertura pannello social route.
- Invio review (prima volta consentita, duplicate bloccate).
- Cambio stato tracker project/climbed.
- Salvataggio tracker aggiorna feed/profilo come prima.

### Eventi
- Lista eventi user.
- Dettaglio evento user.
- Editor/lista eventi admin.
- Registrazione/cancellazione evento.
- Competition live path (se attivo).

### Notifiche
- Apertura pannello notifiche.
- Mark all read.
- Click notifica apre target corretto.

### Mobile/desktop
- Verifica tap, scroll, overlay, modali su viewport mobile.
- Verifica layout desktop invariato.

---

## Nota operativa
Per rispettare il criterio “zero regressioni”, applicare **un solo micro-step per commit**, con verifica checklist completa e rollback immediato in caso di anche minima divergenza.
