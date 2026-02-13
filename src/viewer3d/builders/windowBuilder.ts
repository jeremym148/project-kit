import * as THREE from 'three';
import type { Opening } from '../../types';
import { glassMaterial, frameMaterial } from './materials';

export function buildWindow(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number
): void {
  const style = opening.windowStyle || 'standard';
  if (style === 'baie-vitree') {
    buildBaieVitree(scene, opening, cx, cy, angle, thickness);
  } else {
    buildStandardWindow(scene, opening, cx, cy, angle, thickness);
  }
}

function buildStandardWindow(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number
): void {
  const sY = opening.sillHeight ?? 0.9;
  const h = opening.height || 1.2;

  // Glass pane
  const glassGeo = new THREE.BoxGeometry(opening.width * 0.95, h, 0.03);
  const glass = new THREE.Mesh(glassGeo, glassMaterial);
  glass.position.set(cx, sY + h / 2, cy);
  glass.rotation.y = -angle;
  glass.userData.building = true;
  scene.add(glass);

  // Top frame
  const ftGeo = new THREE.BoxGeometry(
    opening.width + 0.04,
    0.04,
    thickness + 0.02
  );
  const ft = new THREE.Mesh(ftGeo, frameMaterial);
  ft.position.set(cx, sY + h, cy);
  ft.rotation.y = -angle;
  ft.userData.building = true;
  scene.add(ft);

  // Sill (bottom frame)
  const fbGeo = new THREE.BoxGeometry(
    opening.width + 0.04,
    0.06,
    thickness + 0.06
  );
  const fb = new THREE.Mesh(fbGeo, frameMaterial);
  fb.position.set(cx, sY, cy);
  fb.rotation.y = -angle;
  fb.userData.building = true;
  scene.add(fb);

  // Center mullion
  const fcGeo = new THREE.BoxGeometry(0.03, h, 0.04);
  const fc = new THREE.Mesh(fcGeo, frameMaterial);
  fc.position.set(cx, sY + h / 2, cy);
  fc.rotation.y = -angle;
  fc.userData.building = true;
  scene.add(fc);
}

function buildBaieVitree(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number
): void {
  const sY = opening.sillHeight ?? 0;
  const h = opening.height || 2.4;
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  // Large fixed glass pane
  const glassGeo = new THREE.BoxGeometry(opening.width * 0.96, h, 0.03);
  const glass = new THREE.Mesh(glassGeo, glassMaterial);
  glass.position.set(cx, sY + h / 2, cy);
  glass.rotation.y = -angle;
  glass.userData.building = true;
  scene.add(glass);

  // Top frame
  const topGeo = new THREE.BoxGeometry(opening.width + 0.06, 0.06, thickness + 0.04);
  const topFrame = new THREE.Mesh(topGeo, frameMaterial);
  topFrame.position.set(cx, sY + h, cy);
  topFrame.rotation.y = -angle;
  topFrame.userData.building = true;
  scene.add(topFrame);

  // Bottom sill
  const botGeo = new THREE.BoxGeometry(opening.width + 0.06, 0.04, thickness + 0.06);
  const botFrame = new THREE.Mesh(botGeo, frameMaterial);
  botFrame.position.set(cx, sY, cy);
  botFrame.rotation.y = -angle;
  botFrame.userData.building = true;
  scene.add(botFrame);

  // Left side frame
  const sideGeo = new THREE.BoxGeometry(0.04, h, thickness);
  const sideOff = opening.width / 2 + 0.02;
  const leftSide = new THREE.Mesh(sideGeo, frameMaterial);
  leftSide.position.set(cx - sideOff * cosA, sY + h / 2, cy + sideOff * sinA);
  leftSide.rotation.y = -angle;
  leftSide.userData.building = true;
  scene.add(leftSide);

  // Right side frame
  const rightSide = new THREE.Mesh(sideGeo, frameMaterial);
  rightSide.position.set(cx + sideOff * cosA, sY + h / 2, cy - sideOff * sinA);
  rightSide.rotation.y = -angle;
  rightSide.userData.building = true;
  scene.add(rightSide);

  // Center mullion (for wide windows)
  if (opening.width > 1.5) {
    const mullionGeo = new THREE.BoxGeometry(0.03, h, thickness);
    const mullion = new THREE.Mesh(mullionGeo, frameMaterial);
    mullion.position.set(cx, sY + h / 2, cy);
    mullion.rotation.y = -angle;
    mullion.userData.building = true;
    scene.add(mullion);
  }
}
