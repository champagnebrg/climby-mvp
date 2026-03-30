# Proposta tecnica — Settori con contenuto `3d` o `photo`

Data: 2026-03-30

## Obiettivo
Supportare due modalità di settore (`3d`, `photo`) mantenendo invariato il flusso prodotto esistente (apertura da piantina, apertura da lista vie, toggle visibilità vie, apertura via selezionata), cambiando solo il renderer del contenuto settore.

## 1) Stato attuale (sintesi tecnica)
- Viewer: il contenitore è unico e oggi usa `<model-viewer id="main-viewer">`.
- Apertura settore: `open3D(gId, sId, options)` carica il documento settore, risolve l'URL del `.glb`, imposta `viewer.src`, e sottoscrive le vie.
- Hotspot vie: `renderViewerRouteHotspots()` crea pulsanti `.hotspot` su `model-viewer`, usando `position`/`normal` dalla route.
- Admin settore: creazione/sostituzione via `handleUpload()` con file `.glb` e persistenza in `Sectors/{sectorId}.meshUrl` + storage `meshes/{gymId}/{sectorId}.glb`.
- Routes: salvate in `gyms/{gymId}/Sectors/{sectorId}/routes/{routeId}`; nuove vie salvano `position` e `normal`.

## 2) Modello dati consigliato

### Settore (`gyms/{gymId}/Sectors/{sectorId}`)
Aggiungere campi **nuovi**, mantenendo `meshUrl` per compatibilità:

```json
{
  "name": "Sala Boulder",
  "contentType": "3d", // "3d" | "photo"
  "media": {
    "glbUrl": "https://...",      // usato se contentType=3d
    "photoUrl": "https://...",    // usato se contentType=photo
    "photoWidth": 2048,
    "photoHeight": 1365
  },
  "meshUrl": "https://..." // legacy; letto come fallback per settori storici
}
```

Regola di risoluzione runtime:
1. se `contentType` assente e `meshUrl` presente => trattare come `3d` (backward compatibility);
2. se `contentType=3d` usare `media.glbUrl` (fallback a `meshUrl`);
3. se `contentType=photo` usare `media.photoUrl`.

### Snapshot versione modello (`gyms/{gymId}/models/{modelVersionId}`)
Estendere `sectors[]` con:
- `contentType`
- `media` (solo metadati minimi/URL)
- mantenere `meshGlbUrl` per compatibilità nelle letture esistenti.

## 3) Modello dati vie consigliato (compatibile)

### Route (`gyms/{gymId}/Sectors/{sectorId}/routes/{routeId}`)
Introdurre un blocco unificato:

```json
{
  "grade": "6b",
  "color": "#ff0000",
  "active": true,
  "anchor": {
    "type": "3d", // "3d" | "2d"
    "p3d": { "position": "...", "normal": "..." },
    "p2d": { "x": 0.41, "y": 0.63 }
  },
  "position": "...", // legacy 3d
  "normal": "..."    // legacy 3d
}
```

Strategia compatibilità:
- route legacy: se `anchor` manca ma `position`/`normal` esistono => interpretare come `anchor.type=3d`.
- route foto: scrivere `anchor.type=2d` + `anchor.p2d`; opzionalmente non valorizzare `position`/`normal`.

## 4) Strategia viewer consigliata

### Architettura
Creare un orchestratore unico (es. `openSectorViewer`) con pipeline condivisa:
1. resolve sector + resolve content;
2. apply route visibility state (`map`, `route-list`, toggle);
3. subscribe routes;
4. render hotspot via adapter;
5. gestire pannelli social/admin invariati.

### Renderer adapter
- `viewer3dAdapter`
  - mount su `<model-viewer>`
  - camera smart/default invariata
  - hotspot 3D con `dataset.position/dataset.normal`
- `viewerPhotoAdapter`
  - mount su `<img>`/`<div>` dedicato nel medesimo `viewer-container`
  - overlay assoluto per hotspot 2D normalizzati (x,y in [0..1])
  - click hotspot identico (apre social o editor admin)

### Riuso logica (no duplicazioni)
Condividere:
- stato `viewerRouteVisibilityState`
- `applyViewerRouteVisibilityOptions`, `shouldRenderRouteHotspot`, `refreshViewerRouteVisibilityToggle`
- sottoscrizione route e apertura social

Duplicare solo il minimo:
- `mountContent` (GLB vs photo)
- `projectAnchorToUI` (3D slot vs 2D posizione CSS)
- `captureAnchorFromAdminTap` (raycast 3D vs click 2D)

## 5) Strategia admin consigliata

### UX creazione/sostituzione settore
Nel tab Settori:
- aggiungere scelta `Tipo contenuto` (`3D` / `Foto`) vicino a nome+file;
- input file dinamico:
  - 3D: `.glb`
  - Foto: `image/*` (jpg/png/webp)
- stessa azione `Crea settore` / `Sostituisci contenuto`.

### Persistenza upload
Generalizzare `handleUpload()` in `handleSectorMediaUpload({ sectorId?, contentType })`:
- storage path consigliato:
  - `sectors-media/{gymId}/{sectorId}/model.glb`
  - `sectors-media/{gymId}/{sectorId}/photo.jpg`
- aggiornare `Sectors/{sectorId}` con `contentType` + `media.*` + compatibilità `meshUrl` se 3D.

### Tracciatura vie in modalità foto
In admin viewer foto:
- click/tap sull'immagine => salva `anchor.p2d` normalizzato.
- editor via (grado/colore/salva/elimina) invariato.
- se settore passa da 3D a foto (o viceversa):
  - preservare route attive e azzerare/invalidare solo anchor incompatibili, mantenendo routeId/storico.

## 6) Ordine implementativo consigliato
1. **Data contract**: lettura con fallback legacy (`meshUrl`, `position/normal`).
2. **Viewer orchestrator** + adapter interfaccia (senza UI admin).
3. **Photo viewer read-only** (apertura settore + hotspot 2D render + social).
4. **Admin contentType + upload foto**.
5. **Admin route authoring foto** (click 2D e salvataggio `anchor.p2d`).
6. **Migrazione soft** (solo write nuovo formato per nuovi update; legacy letto sempre).
7. **Hardening**: validazioni, analytics, test regressione sui flussi map/list/toggle.

## 7) Rischi/limiti principali
- **Monolite**: molte responsabilità in `climby.html`; rischio regressioni trasversali.
- **Doppia semantica route**: gestione anchor 3D/2D richiede validazioni forti per evitare vie “invisibili”.
- **Switch tipo settore**: mantenere route attive ma con anchor invalido finché non riposizionate.
- **Compatibilità model versions**: estendere snapshot senza rompere letture che oggi si aspettano `meshGlbUrl`.
- **UI consistency**: mantenere identico comportamento toggle/entry-mode su renderer diversi.

## 8) Analisi puntuale route data: cosa preservare vs cosa resettare

### 8.1 Dove i dati route vengono usati davvero

1. **Filtri/liste vie lato user**
   - Lista vie settore mostra `routeId`, `grade`, `color`, stato completamento derivato da `users/{uid}/routeProgress.state`.
   - Le vie visualizzate sono filtrate per `activeModelVersionId` (snapshot `models`) o fallback `route.active !== false`.

2. **Viewer/social pannello route**
   - Apertura route in social usa soprattutto `grade` e `color` dalla route del settore.
   - Review route (`reviews`) salvano e leggono rating/commenti/gradeFeel.

3. **Progressi utente / tracker**
   - I progressi sono in `users/{uid}/routeProgress/{gymId__sectorId__routeId}` e usano chiave stabile gym/sector/route.
   - Side effects di una route segnata `climbed` alimentano `gymStats`, `progressHistory`, `climbEvents`, `socialActivities`.

4. **Leaderboard**
   - La leaderboard mensile non usa position/normal route: deriva da `climbEvents` (primario) o fallback da `routeProgress` con `state='climbed'`.

5. **Statistiche/admin coverage/analytics**
   - Snapshot admin (`adminCoverageSnapshot.routeMeta`) usa route fields: `name|grade`, `gradeOrder`, `color`, `active`, e `hasStart = !!(position && normal)`.
   - Filtri admin escludono route senza start (`hasStart=false`) e opzionalmente inattive/non recensite.
   - Le review possono essere filtrate da `analyticsResetAt` del settore.

6. **Snapshot/versioning modello**
   - In `gyms/{gymId}/models/{modelVersionId}` viene serializzato per ogni route: `routeId`, `grade`, `color`, `active`, `startPosition3D` (`position/normal`).

### 8.2 Campi route rilevati e classificazione

#### A) Identità / metadati permanenti (preservare)
- `routeId` (ID documento route)
- `grade`
- `color`
- `name` (quando presente)
- `gradeOrder` (quando presente)
- `colorLabel` / `colorName` (quando presenti)

#### B) Lifecycle route (preservare, aggiornare con policy)
- `active`
- `deactivatedAt`

#### C) Dati che alimentano progress/statistiche (preservare assolutamente)
- In `users/*/routeProgress`: `userId`, `gymId`, `sectorId`, `routeId`, `state`, `attemptCount`, `finalGrade`, `finalGradeOrder`, `firstAttemptDate`, `completionDate`, `notes`, `updatedAt`, ecc.
- In `users/*/progressHistory` e `users/*/climbEvents`: record storici derivati da climb.
- In `gyms/*/Sectors/*/routes/*/reviews/*`: `rating`, `text`, `gradeFeel`, `climbedGrade*`, `date`, `userId`, `userName`.
- In `.../progressFeed/*`: eventi feed di progresso.

#### D) Dati di ancoraggio visivo 3D (resettabili sul cambio contenuto)
- `position`
- `normal`
- (snapshot models) `startPosition3D.position`, `startPosition3D.normal`

#### E) Dati ancoraggio foto (futuri, anch’essi resettabili quando cambia media)
- Proposto: `anchor.type='2d'` + `anchor.p2d.{x,y}`
- Opzionale: `anchorStatus` (`valid`/`pending_reanchor`) per governance

### 8.3 Reset sicuro al cambio contenuto settore

**Regola proposta:** al replace contenuto (nuovo 3D o nuova foto) preservare route identity/metadati/progress/reviews; invalidare solo l’anchor visuale.

Operativamente:
1. NON toccare docs route come identità (`routeId`, `grade`, `color`, ...).
2. NON toccare `users/*/routeProgress`, `progressHistory`, `climbEvents`, `socialActivities`.
3. NON cancellare `reviews` e `progressFeed` (salvo policy prodotto esplicita).
4. Resettare solo ancoraggi incompatibili:
   - replace a 3D: `position=null`, `normal=null` (già presente nel codice).
   - replace a photo (futuro): `anchor.p2d=null` oppure `anchorStatus='pending_reanchor'`.
5. Mantenere `active` route **invariato** di default (evitare perdita vie da liste/statistiche).
6. Continuare a valorizzare `analyticsResetAt` settore per evitare distorsioni nelle analytics post-reset.

### 8.4 Strategia business logic consigliata (sicura)

Quando admin sostituisce contenuto settore:

- **Step 1 (atomicità logica)**
  - aggiornare settore con nuovo media (`contentType`, URL, metadata)
  - settare `analyticsResetAt = now`

- **Step 2 (route anchoring policy)**
  - per tutte le route del settore:
    - invalidare anchor della modalità precedente
    - opzionale: marcare `anchorStatus='pending_reanchor'`

- **Step 3 (viewer behavior)**
  - route senza anchor valido:
    - appaiono in lista/filtri dati (in base a `active`)
    - NON appaiono come hotspot nel viewer
  - admin vede chiaramente “X vie da riposizionare”.

- **Step 4 (stabilità KPI)**
  - nessuna perdita su leaderboard/progress: perché dipendono da `routeProgress/climbEvents`, non dall’anchor.
  - analytics route di qualità (reviews medie) restano disponibili, con finestra post-reset gestita da `analyticsResetAt` dove già applicato.

### 8.5 Rischi principali

1. **Regressione filtri admin**: oggi `routeMatchesAdminFilters` richiede `hasStart`; se resetti anchor, molte route spariscono da analytics/admin list finché non riposizionate.
2. **Incoerenza snapshot models**: se non rigeneri model version dopo reset anchor/media, il gating vie per user può non riflettere stato reale.
3. **Sovraccarico operativo admin**: senza stato esplicito `pending_reanchor`, manca visibilità su quante vie sono da sistemare.
4. **Migrazione graduale 3d/photo**: durante transizione coesisteranno `position/normal` legacy e nuovo `anchor` unificato.

### 8.6 Punti codice da toccare nei prossimi step

1. `window.handleUpload` e funzioni correlate (`clearSectorRouteStartPoints`, `deactivateSectorRoutes`, `createGymModelVersion`) per separare reset anchor da lifecycle route.
2. `renderViewerRouteHotspots` + futura controparte photo per usare resolver anchor comune.
3. `routeMatchesAdminFilters` / `adminCoverageSnapshot.routeMeta.hasStart` per supportare `hasAnchor` multi-modale (3D o 2D).
4. builder snapshot `buildModelVersionPayload` per serializzare anchor in modo type-safe (`3d` / `2d`).
5. UI admin settori: evidenza route con anchor mancante/pending.
