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
    mapHotspot: {
      type: 'marker',
      version: Number(floorMapVersion),
      marker: { x: Number(x), y: Number(y) },
      rect: null,
      polygon: null,
    },
    mapMarker: { x: Number(x), y: Number(y) },
    mapMarkerVersion: Number(floorMapVersion),
  }, { merge: true });
}

export async function saveSectorMapRectHotspot({
  db,
  doc,
  setDoc,
  gymId,
  sectorId,
  x,
  y,
  w,
  h,
  floorMapVersion,
} = {}) {
  if (!db || typeof doc !== 'function' || typeof setDoc !== 'function') return;
  if (!gymId || !sectorId) return;

  await setDoc(doc(db, 'gyms', gymId, 'Sectors', sectorId), {
    mapHotspot: {
      type: 'rect',
      version: Number(floorMapVersion),
      rect: { x: Number(x), y: Number(y), w: Number(w), h: Number(h) },
      marker: null,
      polygon: null,
    },
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
    mapHotspot: null,
    mapMarker: null,
    mapMarkerVersion: null,
  }, { merge: true });
}
