export function openSector3D(open3DFn, gymId, sectorId) {
  if (typeof open3DFn !== 'function') return;
  if (!gymId || !sectorId) return;
  open3DFn(gymId, sectorId);
}
