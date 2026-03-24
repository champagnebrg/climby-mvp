# Interactive Gym Map ↔ Sector 3D Navigation (Point-Marker MVP Design)

## Goal
Turn each gym floor plan (`piantina`) into an interactive map where users tap/click a **sector marker** and open that sector’s 3D view, while admins configure those links with a minimal, safe workflow.

---

## 1) Updated Data Model (point-based, normalized)

Use explicit map versioning plus one point link per sector.

### `gymMap`
Represents the active floor plan for a gym.

Suggested fields:
- `gymId`
- `imageUrl`
- `imageWidth`
- `imageHeight`
- `mapVersion` (integer/string incremented when image is replaced)
- `updatedAt`
- `updatedBy`

### `sectorMapLink`
Represents the position of one sector on one map version.

Suggested fields:
- `gymId`
- `sectorId`
- `mapVersion` (must match current `gymMap.mapVersion`)
- `point`
  - `x`: number in [0,1]
  - `y`: number in [0,1]
- `createdAt`
- `updatedAt`
- `updatedBy`

### Integrity rules
- One marker per sector per map version:
  - unique key on (`gymId`, `sectorId`, `mapVersion`)
- Only active map links are read:
  - always filter by current `gymMap.mapVersion`
- On map image replace:
  - increment `mapVersion`
  - reset/redefine links (old versions ignored or deleted)

### Why normalized coordinates
- Marker stays correctly positioned across responsive sizes.
- UI renders with `left = x * renderedWidth`, `top = y * renderedHeight`.

---

## 2) Updated Admin UX Flow (click-to-place marker)

### Entry point
- Keep this in **Gym Admin → Sectors / Map** where floor plan is already managed.
- Add section/tab: **Interactive Map**.

### Flow
1. Admin opens gym map settings.
2. Admin sees:
   - floor plan image/canvas
   - sector list with status (`Linked` / `Not linked`)
3. Admin selects a sector from list.
4. Admin clicks once on the map to place/update that sector marker.
5. Marker preview appears immediately.
6. Admin clicks **Save** to persist.

### Edit/remove behavior
- Reposition: select sector → click new point.
- Remove association: sector row action **Remove marker**.

### Guardrails (MVP-safe)
- Reject out-of-bounds coordinates (must be 0..1 after normalization).
- If map image changes, show confirm modal:
  - “Changing the floor plan resets all sector markers. Continue?”
- Disable Save when no changes are pending.

### Feedback
- Toasts:
  - “Marker saved”
  - “Marker removed”
  - “Map changed: markers reset”

---

## 3) Updated User Interaction (clickable markers)

### Viewer behavior
- Render floor plan image plus one clickable marker for each linked sector.
- Marker interaction:
  - Desktop: click marker
  - Mobile: tap marker
- On interaction, navigate to sector page and open/focus existing 3D view section.

### Fallbacks
- If sector has no 3D model:
  - navigate to sector page and show existing fallback message.
- If no markers exist:
  - show static map (no interactive layer).

### Visual clarity (minimal)
- Small circular pin/dot marker.
- Optional tiny label on hover/tap (sector name).
- Keep styling simple for MVP; avoid clustering/advanced map behavior.

---

## 4) MVP-safe Scope (minimal)

### Include
- Single map image per gym.
- One normalized point marker per sector.
- Admin create/update/remove marker.
- User click/tap marker → sector 3D navigation.
- Map image replacement invalidates prior links by version.

### Exclude (later)
- Multiple markers per sector.
- Polygon/area hotspots.
- Auto marker suggestions.
- Analytics dashboards.

---

## 5) Where this should live (current app shape)

Given current `climby.html` monolith + existing utility modules:

- Integrate entry points in `climby.html`.
- Keep logic isolated into map-focused modules:
  1. data access/service
  2. admin marker editor
  3. user marker viewer

This supports incremental delivery without broad refactors.

---

## 6) Suggested module structure (implementation-ready)

- `modules/maps/map-model.js`
  - marker schema/constants
  - normalize/denormalize point helpers

- `modules/maps/map-repository.js`
  - CRUD for `gymMap` + `sectorMapLink`
  - active `mapVersion` filtering

- `modules/maps/map-validation.js`
  - `x`, `y` bounds checks
  - sector↔gym consistency checks

- `modules/maps/admin-map-editor.js`
  - sector selection
  - click-to-place marker
  - save/remove actions

- `modules/maps/map-viewer.js`
  - render clickable markers
  - marker click → navigation callback

- `modules/maps/map-routing.js`
  - canonical navigation to sector 3D view

- `modules/maps/index.js`
  - integration facade for `climby.html`

---

## 7) Updated implementation plan (small steps)

1. **Define data contract**
   - Add `point {x,y}` model with normalized constraints.
   - Add `mapVersion` read/write behavior.

2. **Implement read path first**
   - Fetch active map + sector marker links by current version.

3. **Build minimal viewer**
   - Render markers from stored points.
   - Wire marker click/tap to sector 3D route.

4. **Build admin list/status panel**
   - Show sectors and linked/not-linked status.

5. **Add click-to-place in admin**
   - Select sector, click map, preview marker.
   - Save marker.

6. **Add marker removal**
   - Remove action per sector and persist deletion.

7. **Add map replacement reset behavior**
   - Confirmation modal.
   - Increment map version and invalidate old links.

8. **Validation + permissions hardening**
   - Coordinate bounds, stale-version protection, admin-only writes.

9. **QA pass (desktop/mobile)**
   - Marker alignment on responsive sizes.
   - Correct sector opens from each marker.

---

## 8) Main risks + mitigations (point-marker version)

- **Risk: wrong marker position on different screens**  
  Mitigation: store only normalized coordinates; compute rendered pixel position at runtime.

- **Risk: stale markers after floor plan update**  
  Mitigation: `mapVersion` invalidation contract and reset flow on image replacement.

- **Risk: accidental admin clicks/place errors**  
  Mitigation: require sector selection before placement + Save confirmation state.

- **Risk: navigation inconsistency**  
  Mitigation: centralize route building in `map-routing.js` and reuse sector navigation logic.

- **Risk: scope creep**  
  Mitigation: keep one marker per sector, one map per gym, no advanced geometry in MVP.

---

## 9) Practical MVP acceptance criteria

1. Admin can assign exactly one marker (x,y normalized 0..1) per sector.
2. Admin can update marker by clicking a new position.
3. Admin can remove a sector marker.
4. Replacing map image resets/invalidate existing markers.
5. User can click/tap a marker and open the linked sector 3D view.
6. Marker positions remain accurate across viewport sizes.
7. Non-admin users cannot modify marker links.
