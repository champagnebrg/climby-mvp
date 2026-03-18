export async function saveSectorMapMarker({
  db,
  doc,
  setDoc,
  gymId,
  sectorId,
  x,
  y,
  floorMapVersion,
} = {}) {
  if (!db || typeof doc !== 'function' || typeof setDoc !== 'function') return;
  if (!gymId || !sectorId) return;

  await setDoc(doc(db, 'gyms', gymId, 'Sectors', sectorId), {
    mapMarker: { x: Number(x), y: Number(y) },
    mapMarkerVersion: Number(floorMapVersion),
  }, { merge: true });
}

export async function removeSectorMapMarker({
  db,
  doc,
  setDoc,
  gymId,
  sectorId,
} = {}) {
  if (!db || typeof doc !== 'function' || typeof setDoc !== 'function') return;
  if (!gymId || !sectorId) return;

  await setDoc(doc(db, 'gyms', gymId, 'Sectors', sectorId), {
    mapMarker: null,
    mapMarkerVersion: null,
  }, { merge: true });
}
