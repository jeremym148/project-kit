import * as THREE from 'three';
import type { FloorPlan, FloorPlanDiff } from '../types';
import { buildFloor } from './builders/floorBuilder';
import { buildWall } from './builders/wallBuilder';
import { buildFurniture } from './builders/furnitureBuilder';
import { diffAddedMaterial, diffRemovedMaterial, diffModifiedMaterial } from './builders/materials';

/**
 * Builds the 3D scene with diff highlighting.
 * - Current elements rendered normally, with added/modified tinted
 * - Removed elements rendered from baseline with semi-transparent red
 */
export function updateDiffScene(
  scene: THREE.Scene,
  currentData: FloorPlan,
  baselineData: FloorPlan,
  diff: FloorPlanDiff,
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

  // Build floor normally
  buildFloor(scene, currentData.walls, showCeiling, currentData.labels);

  // Build current walls
  for (const wall of currentData.walls) {
    const wallOpenings = currentData.openings.filter((o) => o.wallId === wall.id);
    buildWall(scene, wall, wallOpenings);
  }

  // Build current furniture
  if (currentData.furniture?.length) {
    buildFurniture(scene, currentData.furniture);
  }

  // Build terrain
  if (currentData.terrain) {
    const t = currentData.terrain;
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

  // Now apply diff coloring to existing meshes
  applyDiffTints(scene, diff);

  // Build removed elements from baseline with red material
  buildRemovedElements(scene, baselineData, diff);
}

function applyDiffTints(scene: THREE.Scene, diff: FloorPlanDiff): void {
  scene.traverse((obj) => {
    if (!obj.userData.building) return;
    const id = obj.userData.elementId as string | undefined;
    if (!id) return;

    if (diff.addedIds.has(id) && (obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      // Add a green tint overlay box around the mesh
      addTintOverlay(scene, mesh, diffAddedMaterial);
    } else if (diff.modifiedIds.has(id) && (obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      addTintOverlay(scene, mesh, diffModifiedMaterial);
    }
  });
}

function addTintOverlay(
  scene: THREE.Scene,
  sourceMesh: THREE.Mesh,
  material: THREE.MeshStandardMaterial
): void {
  // Create a slightly enlarged copy with diff material
  const overlay = new THREE.Mesh(sourceMesh.geometry.clone(), material);
  overlay.position.copy(sourceMesh.position);
  overlay.rotation.copy(sourceMesh.rotation);
  overlay.scale.copy(sourceMesh.scale).multiplyScalar(1.02);
  overlay.userData.building = true;
  overlay.renderOrder = 1;
  scene.add(overlay);
}

function buildRemovedElements(
  scene: THREE.Scene,
  baselineData: FloorPlan,
  diff: FloorPlanDiff
): void {
  // Build removed walls
  for (const wall of baselineData.walls) {
    if (!diff.removedIds.has(wall.id)) continue;
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) continue;

    const angle = Math.atan2(dy, dx);
    const height = wall.height || 2.8;
    const thickness = wall.thickness || 0.15;

    const geo = new THREE.BoxGeometry(len, height, thickness);
    const mesh = new THREE.Mesh(geo, diffRemovedMaterial);
    mesh.position.set(wall.x1 + dx / 2, height / 2, wall.y1 + dy / 2);
    mesh.rotation.y = -angle;
    mesh.userData.building = true;
    scene.add(mesh);
  }

  // Build removed furniture
  for (const f of baselineData.furniture) {
    if (!diff.removedIds.has(f.id)) continue;
    const geo = new THREE.BoxGeometry(f.width, f.height, f.depth);
    const mesh = new THREE.Mesh(geo, diffRemovedMaterial);
    mesh.position.set(f.cx, f.height / 2, f.cy);
    mesh.rotation.y = -f.rotation;
    mesh.userData.building = true;
    scene.add(mesh);
  }
}
