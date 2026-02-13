import * as THREE from 'three';
import type { Wall, Opening } from '../../types';
import { wallMaterial, barrierMaterial } from './materials';
import { splitWallByOpenings } from '../../utils/wallOps';
import { buildDoor } from './doorBuilder';
import { buildWindow } from './windowBuilder';

export function buildWall(
  scene: THREE.Scene,
  wall: Wall,
  wallOpenings: Opening[]
): void {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;

  const angle = Math.atan2(dy, dx);
  const isBarrier = wall.wallStyle === 'barrier';
  const height = wall.height || (isBarrier ? 1.0 : 2.8);
  const thickness = wall.thickness || (isBarrier ? 0.08 : 0.15);
  const mat = isBarrier ? barrierMaterial : wallMaterial;

  if (wallOpenings.length === 0) {
    // Simple wall — no openings
    const geo = new THREE.BoxGeometry(len, height, thickness);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wall.x1 + dx / 2, height / 2, wall.y1 + dy / 2);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.building = true;
    mesh.userData.wallId = wall.id;
    scene.add(mesh);
    return;
  }

  // Build openings (doors, windows)
  for (const o of wallOpenings) {
    const posAlongWall = o.position * len;
    const cx = wall.x1 + (dx / len) * posAlongWall;
    const cy = wall.y1 + (dy / len) * posAlongWall;

    if (o.type === 'door') {
      buildDoor(scene, o, cx, cy, angle, thickness);
    } else {
      buildWindow(scene, o, cx, cy, angle, thickness);
    }
  }

  // Build wall segments around openings
  const segments = splitWallByOpenings(len, height, wallOpenings);
  for (const seg of segments) {
    const segLen = seg.end - seg.start;
    if (segLen < 0.05) continue;

    const sc = (seg.start + seg.end) / 2;
    const cx = wall.x1 + (dx / len) * sc;
    const cy = wall.y1 + (dy / len) * sc;

    let h: number;
    let yPos: number;

    if (seg.type === 'wall') {
      h = seg.height ?? height;
      yPos = h / 2;
    } else if (seg.type === 'above') {
      h = (seg.topY ?? height) - (seg.bottomY ?? 0);
      yPos = (seg.bottomY ?? 0) + h / 2;
    } else if (seg.type === 'below') {
      h = seg.topY ?? 0;
      yPos = h / 2;
    } else {
      continue;
    }

    const geo = new THREE.BoxGeometry(segLen, h, thickness);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, yPos, cy);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.building = true;
    mesh.userData.wallId = wall.id;
    scene.add(mesh);
  }
}
