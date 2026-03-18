import { renderAdminGymMapEditor } from './admin-map-editor.js';
import { saveSectorMapMarker, removeSectorMapMarker } from './map-repository.js';
import { renderUserGymFloorMapMarkers } from './map-viewer.js';

export function renderGymFloorMapMarkersForUser(options = {}) {
  return renderUserGymFloorMapMarkers(options);
}

export function renderGymFloorMapEditorForAdmin(options = {}) {
  return renderAdminGymMapEditor(options);
}

export async function saveGymSectorMarker(options = {}) {
  return saveSectorMapMarker(options);
}

export async function removeGymSectorMarker(options = {}) {
  return removeSectorMapMarker(options);
}
