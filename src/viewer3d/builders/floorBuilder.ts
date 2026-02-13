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

      let patchGeo: THREE.BufferGeometry;

      if (label.polygon && label.polygon.length >= 3) {
        // Use actual room polygon shape
        patchGeo = buildPolygonGeometry(label.polygon);
      } else {
        // Fallback: use bounding rectangle from nearby walls
        const bounds = computeRoomBounds(label, walls);
        const pw = bounds.maxX - bounds.minX;
        const ph = bounds.maxY - bounds.minY;
        patchGeo = new THREE.PlaneGeometry(pw, ph);
        // PlaneGeometry is centered at origin, position it at room center
        const patch = new THREE.Mesh(patchGeo, mat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(
          bounds.minX + pw / 2,
          0.02,
          bounds.minY + ph / 2
        );
        patch.receiveShadow = true;
        patch.userData.building = true;
        scene.add(patch);
        continue;
      }

      const patch = new THREE.Mesh(patchGeo, mat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(0, 0.02, 0);
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

/** Build a ShapeGeometry from polygon vertices (in XZ plane, rendered as XY) */
function buildPolygonGeometry(
  polygon: { x: number; y: number }[]
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(polygon[0]!.x, polygon[0]!.y);
  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]!.x, polygon[i]!.y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/** Compute room bounds by ray-casting from label center to nearest walls */
function computeRoomBounds(
  label: RoomLabel,
  walls: Wall[]
): { minX: number; maxX: number; minY: number; maxY: number } {
  // Start with a generous default based on area
  const halfSide = Math.sqrt(label.area) / 2 || 2;
  let lMinX = label.cx - halfSide;
  let lMaxX = label.cx + halfSide;
  let lMinY = label.cy - halfSide;
  let lMaxY = label.cy + halfSide;

  // Cast rays from label center in 4 directions, find nearest wall
  const MAX_DIST = 20;

  for (const wall of walls) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.05) continue;

    // Check if wall is roughly horizontal (affects Y bounds)
    if (Math.abs(dy) < len * 0.3) {
      const wallY = (wall.y1 + wall.y2) / 2;
      const wallMinX = Math.min(wall.x1, wall.x2);
      const wallMaxX = Math.max(wall.x1, wall.x2);
      if (label.cx >= wallMinX - 0.1 && label.cx <= wallMaxX + 0.1) {
        if (wallY > label.cy && wallY < label.cy + MAX_DIST) {
          lMaxY = Math.min(lMaxY, wallY);
        }
        if (wallY < label.cy && wallY > label.cy - MAX_DIST) {
          lMinY = Math.max(lMinY, wallY);
        }
      }
    }

    // Check if wall is roughly vertical (affects X bounds)
    if (Math.abs(dx) < len * 0.3) {
      const wallX = (wall.x1 + wall.x2) / 2;
      const wallMinY = Math.min(wall.y1, wall.y2);
      const wallMaxY = Math.max(wall.y1, wall.y2);
      if (label.cy >= wallMinY - 0.1 && label.cy <= wallMaxY + 0.1) {
        if (wallX > label.cx && wallX < label.cx + MAX_DIST) {
          lMaxX = Math.min(lMaxX, wallX);
        }
        if (wallX < label.cx && wallX > label.cx - MAX_DIST) {
          lMinX = Math.max(lMinX, wallX);
        }
      }
    }
  }

  return { minX: lMinX, maxX: lMaxX, minY: lMinY, maxY: lMaxY };
}
