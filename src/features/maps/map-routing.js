export function openSector3D(open3DFn, gymId, sectorId, options) {
  if (typeof open3DFn !== 'function') return;
  if (!gymId || !sectorId) return;
  open3DFn(gymId, sectorId, options);
}
