import * as THREE from 'three';
import type { FloorPlan } from '../types';
import { buildFloor } from './builders/floorBuilder';
import { buildWall } from './builders/wallBuilder';
import { buildFurniture } from './builders/furnitureBuilder';

/**
 * Reconcile the 3D scene with the current floor plan data.
 * Removes old building meshes, then rebuilds from data.
 */
export function updateScene(
  scene: THREE.Scene,
  data: FloorPlan,
  showCeiling: boolean
): void {
  // Remove existing building meshes
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((c) => {
    if (c.userData.building) toRemove.push(c);
  });
  for (const c of toRemove) {
    scene.remove(c);
    if ((c as THREE.Mesh).geometry) {
      (c as THREE.Mesh).geometry.dispose();
    }
  }

  // Build floor (and optional ceiling) with per-room materials
  buildFloor(scene, data.walls, showCeiling, data.labels);

  // Build walls with their openings
  for (const wall of data.walls) {
    const wallOpenings = data.openings.filter((o) => o.wallId === wall.id);
    buildWall(scene, wall, wallOpenings);
  }

  // Build furniture
  if (data.furniture?.length) {
    buildFurniture(scene, data.furniture);
  }

  // Build terrain ground plane
  if (data.terrain) {
    const t = data.terrain;
    const terrainGeo = new THREE.PlaneGeometry(t.width, t.depth);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: '#4a7a4a', roughness: 0.9, side: THREE.DoubleSide,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(
      t.offsetX + t.width / 2,
      -0.01,
      t.offsetY + t.depth / 2
    );
    terrainMesh.receiveShadow = true;
    terrainMesh.userData.building = true;
    scene.add(terrainMesh);
  }
}
