# SAFE Refactor Step 1 Inventory (Behaviour-Preserving)

Questo inventario è puramente descrittivo e non modifica il runtime.

## Funzioni esposte su `window` (assegnazione esplicita)

- `window.activeUsersLast30Days`
- `window.adminFeedbackModalNext`
- `window.adminFeedbackModalPrev`
- `window.cancelAdminEdit`
- `window.closeAdminFeedbackModal`
- `window.closeCompetitionLivePanel`
- `window.closeDeleteSectorModal`
- `window.closeGymOwnerRequest`
- `window.closeSocialCommentsModal`
- `window.closeSocialListModal`
- `window.closeSocialPanel`
- `window.closeViewer`
- `window.confirmDeleteSector`
- `window.deleteRoute`
- `window.exitCompetitionLiveMode`
- `window.followUserEndpoint`
- `window.getFollowingSharedProgressEndpoint`
- `window.getRouteProgressEndpoint`
- `window.goToAuth`
- `window.handleUpload`
- `window.logout`
- `window.open3D`
- `window.openAdminFeedbackModal`
- `window.openGymOwnerRequest`
- `window.openProfileQuick`
- `window.retryOpen3D`
- `window.saveRoute`
- `window.searchUsersByUsernameEndpoint`
- `window.setLang`
- `window.showUserGymList`
- `window.submitReview`
- `window.switchMode`
- `window.t`
- `window.toggleAuthMode`
- `window.toggleFavourite`
- `window.toggleGymNotifications`
- `window.topActiveUsersBySector`
- `window.totalUsersGym`
- `window.unfollowUserEndpoint`
- `window.updateRouteProgressEndpoint`

## `onclick` inline individuati in `climby.html`

- `document.getElementById('file-mesh-new').click()`
- `document.getElementById('file-update-${d.id}').click()`
- `event.stopPropagation(); window.toggleFavourite('${g.id}')`
- `event.stopPropagation(); window.toggleGymNotifications('${g.id}')`
- `open3D('${realUserGymId}', '${d.id}')`
- `window.adminFeedbackModalNext()`
- `window.adminFeedbackModalPrev()`
- `window.cancelAdminEdit()`
- `window.closeAdminFeedbackModal()`
- `window.closeCompetitionLivePanel()`
- `window.closeDeleteSectorModal()`
- `window.closeGymOwnerRequest()`
- `window.closeSocialCommentsModal()`
- `window.closeSocialListModal()`
- `window.closeSocialPanel()`
- `window.closeViewer()`
- `window.confirmDeleteSector('${d.id}', '${escapeHtml(sec.name || d.id)}')`
- `window.deleteRoute()`
- `window.exitCompetitionLiveMode()`
- `window.goToAuth('login')`
- `window.goToAuth('register')`
- `window.handleUpload(null)`
- `window.logout()`
- `window.retryOpen3D()`
- `window.saveRoute()`
- `window.setLang('en')`
- `window.setLang('it')`
- `window.showUserGymList()`
- `window.submitReview()`
- `window.switchMode()`
- `window.toggleAuthMode()`

## Aree a rischio da NON toccare nei prossimi step

- Bootstrap Firebase e ordine di inizializzazione nel blocco `<script type="module">`.
- Funzioni invocate via `window.*` da HTML inline e markup generato dinamicamente.
- Flussi auth/login/register e transizioni tra view.
- Viewer 3D (`open3D`, `retryOpen3D`, upload file mesh).
- Social panel/modali/commenti/follow-toggle e relative chiamate API.
- Progress/tracker/classifiche e endpoint contrattuali lato backend.
- Notifiche/prompt utente e side effect asincroni (fetch, listener, timer).
