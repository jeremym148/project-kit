import * as THREE from 'three';
import type { Wall, RoomLabel, FloorMaterial } from '../../types';
import { floorMaterial, ceilingMaterial, parquetMaterial, carrelageMaterial, pelouseMaterial } from './materials';

const materialMap: Record<FloorMaterial, THREE.MeshStandardMaterial> = {
  parquet: parquetMaterial,
  carrelage: carrelageMaterial,
  pelouse: pelouseMaterial,
};

export function buildFloor(
  scene: THREE.Scene,
  walls: Wall[],
  showCeiling: boolean,
  labels?: RoomLabel[]
): void {
  if (walls.length < 2) return;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const w of walls) {
    minX = Math.min(minX, w.x1, w.x2);
    maxX = Math.max(maxX, w.x1, w.x2);
    minY = Math.min(minY, w.y1, w.y2);
    maxY = Math.max(maxY, w.y1, w.y2);
  }

  const fw = maxX - minX;
  const fh = maxY - minY;
  if (fw <= 0 || fh <= 0) return;

  const floorGeo = new THREE.PlaneGeometry(fw + 0.5, fh + 0.5);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(minX + fw / 2, 0.01, minY + fh / 2);
  floor.receiveShadow = true;
  floor.userData.building = true;
  scene.add(floor);

  // Per-room floor material patches
  if (labels) {
    for (const label of labels) {
      if (!label.floorMaterial) continue;
      const mat = materialMap[label.floorMaterial];
      const side = label.area > 0 ? Math.min(Math.sqrt(label.area), 8) : 2;
      const patchGeo = new THREE.PlaneGeometry(side, side);
      const patch = new THREE.Mesh(patchGeo, mat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(label.cx, 0.02, label.cy);
      patch.receiveShadow = true;
      patch.userData.building = true;
      scene.add(patch);
    }
  }

  if (showCeiling) {
    const ceilGeo = new THREE.PlaneGeometry(fw, fh);
    const ceiling = new THREE.Mesh(ceilGeo, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(minX + fw / 2, 2.8, minY + fh / 2);
    ceiling.userData.building = true;
    scene.add(ceiling);
  }
}
