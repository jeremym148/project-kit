import * as THREE from 'three';
import type { Opening } from '../../types';
import { doorMaterial, frameMaterial, glassMaterial } from './materials';

export function buildDoor(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number
): void {
  const style = opening.doorStyle || 'standard';
  const h = opening.height || 2.1;

  if (style === 'sliding') {
    buildSlidingDoor(scene, opening, cx, cy, angle, thickness, h);
  } else if (style === 'french') {
    buildFrenchDoor(scene, opening, cx, cy, angle, thickness, h);
  } else if (style === 'sliding-glass') {
    buildSlidingGlassDoor(scene, opening, cx, cy, angle, thickness, h);
  } else if (style === 'arcade') {
    buildArcade(scene, opening, cx, cy, angle, thickness, h);
  } else {
    buildStandardDoor(scene, opening, cx, cy, angle, thickness, h);
  }
}

function buildStandardDoor(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number,
  h: number
): void {
  const flip = opening.flipDoor ?? false;
  const out = opening.swingOut ?? false;
  const w = opening.width;
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  // Hinge position: at one end of the opening along the wall
  const hingeDir = flip ? 1 : -1;
  const hingeLocalX = hingeDir * w / 2;
  const hingeX = cx + hingeLocalX * cosA;
  const hingeZ = cy - hingeLocalX * sinA;

  // Door panel — geometry offset so hinge edge is at local origin
  const doorGeo = new THREE.BoxGeometry(w * 0.95, h, 0.05);
  doorGeo.translate(-hingeDir * w * 0.475, 0, 0);

  const door = new THREE.Mesh(doorGeo, doorMaterial);
  // Offset perpendicular to wall when swinging outward
  const perpOff = out ? thickness / 2 + 0.03 : 0;
  const perpX = Math.sin(-angle) * perpOff;
  const perpZ = Math.cos(-angle) * perpOff;
  door.position.set(hingeX + perpX, h / 2, hingeZ + perpZ);
  // Slightly ajar (15°) from the hinge, mirrored for swing out
  const ajarSign = flip ? 1 : -1;
  const ajarAngle = (out ? -ajarSign : ajarSign) * Math.PI / 12;
  door.rotation.y = -angle + ajarAngle;
  door.castShadow = true;
  door.userData.building = true;
  scene.add(door);

  // Frame header
  const frameGeo = new THREE.BoxGeometry(
    w + 0.06,
    0.06,
    thickness + 0.02
  );
  const frame = new THREE.Mesh(frameGeo, frameMaterial);
  frame.position.set(cx, h, cy);
  frame.rotation.y = -angle;
  frame.userData.building = true;
  scene.add(frame);
}

function buildSlidingDoor(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number,
  h: number
): void {
  // Thinner sliding panel
  const panelGeo = new THREE.BoxGeometry(opening.width * 0.48, h, 0.03);
  const panel = new THREE.Mesh(panelGeo, doorMaterial);
  panel.position.set(cx, h / 2, cy);
  panel.rotation.y = -angle;
  panel.castShadow = true;
  panel.userData.building = true;
  scene.add(panel);

  // Track rail at top
  const trackGeo = new THREE.BoxGeometry(
    opening.width + 0.1,
    0.04,
    thickness + 0.02
  );
  const track = new THREE.Mesh(trackGeo, frameMaterial);
  track.position.set(cx, h, cy);
  track.rotation.y = -angle;
  track.userData.building = true;
  scene.add(track);

  // Track rail at bottom
  const trackBot = new THREE.Mesh(trackGeo, frameMaterial);
  trackBot.position.set(cx, 0.02, cy);
  trackBot.rotation.y = -angle;
  trackBot.userData.building = true;
  scene.add(trackBot);
}

function buildFrenchDoor(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number,
  h: number
): void {
  const halfW = opening.width * 0.47;

  // Two glass panels
  const panelGeo = new THREE.BoxGeometry(halfW, h, 0.03);

  const leftPanel = new THREE.Mesh(panelGeo, glassMaterial);
  const sinA = Math.sin(-angle);
  const cosA = Math.cos(-angle);
  const offset = opening.width * 0.25;
  leftPanel.position.set(
    cx - offset * cosA,
    h / 2,
    cy + offset * sinA
  );
  leftPanel.rotation.y = -angle;
  leftPanel.castShadow = true;
  leftPanel.userData.building = true;
  scene.add(leftPanel);

  const rightPanel = new THREE.Mesh(panelGeo, glassMaterial);
  rightPanel.position.set(
    cx + offset * cosA,
    h / 2,
    cy - offset * sinA
  );
  rightPanel.rotation.y = -angle;
  rightPanel.castShadow = true;
  rightPanel.userData.building = true;
  scene.add(rightPanel);

  // Frame header
  const frameGeo = new THREE.BoxGeometry(
    opening.width + 0.06,
    0.06,
    thickness + 0.02
  );
  const frame = new THREE.Mesh(frameGeo, frameMaterial);
  frame.position.set(cx, h, cy);
  frame.rotation.y = -angle;
  frame.userData.building = true;
  scene.add(frame);

  // Center mullion
  const mullionGeo = new THREE.BoxGeometry(0.03, h, thickness);
  const mullion = new THREE.Mesh(mullionGeo, frameMaterial);
  mullion.position.set(cx, h / 2, cy);
  mullion.rotation.y = -angle;
  mullion.userData.building = true;
  scene.add(mullion);
}

function buildSlidingGlassDoor(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number,
  h: number
): void {
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);
  const panelW = opening.width * 0.52;

  // Left glass panel (slightly overlapping center)
  const leftGeo = new THREE.BoxGeometry(panelW, h, 0.03);
  const leftPanel = new THREE.Mesh(leftGeo, glassMaterial);
  const leftOffset = -opening.width * 0.24;
  leftPanel.position.set(
    cx + leftOffset * cosA,
    h / 2,
    cy - leftOffset * sinA
  );
  leftPanel.rotation.y = -angle;
  leftPanel.castShadow = true;
  leftPanel.userData.building = true;
  scene.add(leftPanel);

  // Right glass panel
  const rightGeo = new THREE.BoxGeometry(panelW, h, 0.03);
  const rightPanel = new THREE.Mesh(rightGeo, glassMaterial);
  const rightOffset = opening.width * 0.24;
  rightPanel.position.set(
    cx + rightOffset * cosA,
    h / 2,
    cy - rightOffset * sinA
  );
  rightPanel.rotation.y = -angle;
  rightPanel.castShadow = true;
  rightPanel.userData.building = true;
  scene.add(rightPanel);

  // Top frame rail
  const topGeo = new THREE.BoxGeometry(opening.width + 0.06, 0.06, thickness + 0.04);
  const topFrame = new THREE.Mesh(topGeo, frameMaterial);
  topFrame.position.set(cx, h, cy);
  topFrame.rotation.y = -angle;
  topFrame.userData.building = true;
  scene.add(topFrame);

  // Bottom rail / sill
  const botGeo = new THREE.BoxGeometry(opening.width + 0.06, 0.04, thickness + 0.06);
  const botFrame = new THREE.Mesh(botGeo, frameMaterial);
  botFrame.position.set(cx, 0.02, cy);
  botFrame.rotation.y = -angle;
  botFrame.userData.building = true;
  scene.add(botFrame);

  // Center mullion (where panels meet)
  const mullionGeo = new THREE.BoxGeometry(0.03, h, thickness);
  const mullion = new THREE.Mesh(mullionGeo, frameMaterial);
  mullion.position.set(cx, h / 2, cy);
  mullion.rotation.y = -angle;
  mullion.userData.building = true;
  scene.add(mullion);

  // Left side frame
  const sideGeo = new THREE.BoxGeometry(0.04, h, thickness);
  const leftSide = new THREE.Mesh(sideGeo, frameMaterial);
  const sideOff = opening.width / 2 + 0.02;
  leftSide.position.set(
    cx - sideOff * cosA,
    h / 2,
    cy + sideOff * sinA
  );
  leftSide.rotation.y = -angle;
  leftSide.userData.building = true;
  scene.add(leftSide);

  // Right side frame
  const rightSide = new THREE.Mesh(sideGeo, frameMaterial);
  rightSide.position.set(
    cx + sideOff * cosA,
    h / 2,
    cy - sideOff * sinA
  );
  rightSide.rotation.y = -angle;
  rightSide.userData.building = true;
  scene.add(rightSide);
}

function buildArcade(
  scene: THREE.Scene,
  opening: Opening,
  cx: number,
  cy: number,
  angle: number,
  thickness: number,
  h: number
): void {
  const w = opening.width;
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  // Frame header (lintel)
  const headerGeo = new THREE.BoxGeometry(w + 0.08, 0.08, thickness + 0.02);
  const header = new THREE.Mesh(headerGeo, frameMaterial);
  header.position.set(cx, h, cy);
  header.rotation.y = -angle;
  header.userData.building = true;
  scene.add(header);

  // Left side pillar
  const pillarGeo = new THREE.BoxGeometry(0.06, h, thickness + 0.02);
  const sideOff = w / 2 + 0.03;

  const leftPillar = new THREE.Mesh(pillarGeo, frameMaterial);
  leftPillar.position.set(
    cx - sideOff * cosA,
    h / 2,
    cy + sideOff * sinA
  );
  leftPillar.rotation.y = -angle;
  leftPillar.userData.building = true;
  scene.add(leftPillar);

  // Right side pillar
  const rightPillar = new THREE.Mesh(pillarGeo, frameMaterial);
  rightPillar.position.set(
    cx + sideOff * cosA,
    h / 2,
    cy - sideOff * sinA
  );
  rightPillar.rotation.y = -angle;
  rightPillar.userData.building = true;
  scene.add(rightPillar);
}
