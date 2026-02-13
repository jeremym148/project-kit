import * as THREE from 'three';
import type { Furniture } from '../../types';

const furnitureMaterials: Record<string, THREE.MeshStandardMaterial> = {
  'toilet': new THREE.MeshStandardMaterial({ color: '#e8e4e0', roughness: 0.3, metalness: 0.1 }),
  'bed': new THREE.MeshStandardMaterial({ color: '#6b8cae', roughness: 0.8 }),
  'kitchen-counter': new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.4, metalness: 0.1 }),
  'armchair': new THREE.MeshStandardMaterial({ color: '#5a7d5a', roughness: 0.9 }),
  'table': new THREE.MeshStandardMaterial({ color: '#a0845c', roughness: 0.5 }),
  'chair': new THREE.MeshStandardMaterial({ color: '#a0845c', roughness: 0.5 }),
  'shower': new THREE.MeshStandardMaterial({ color: '#c8d8e8', roughness: 0.2, metalness: 0.3 }),
  'bathtub': new THREE.MeshStandardMaterial({ color: '#e8e4e0', roughness: 0.2, metalness: 0.1 }),
  'bathroom-cabinet': new THREE.MeshStandardMaterial({ color: '#b8a088', roughness: 0.5 }),
  'bookshelf': new THREE.MeshStandardMaterial({ color: '#8b6914', roughness: 0.6 }),
  'plant': new THREE.MeshStandardMaterial({ color: '#3a7a3a', roughness: 0.8 }),
  'cabinet': new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.5 }),
  'fridge': new THREE.MeshStandardMaterial({ color: '#d0d4d8', roughness: 0.3, metalness: 0.4 }),
};

function getMaterial(ft: string): THREE.MeshStandardMaterial {
  return furnitureMaterials[ft] || furnitureMaterials['table']!;
}

export function buildFurniture(
  scene: THREE.Scene,
  items: Furniture[]
): void {
  for (const f of items) {
    const group = new THREE.Group();
    group.position.set(f.cx, 0, f.cy);
    group.rotation.y = -f.rotation;
    group.userData.building = true;
    group.userData.furnitureId = f.id;

    switch (f.furnitureType) {
      case 'toilet':
        buildToilet(group, f);
        break;
      case 'bed':
        buildBed(group, f);
        break;
      case 'kitchen-counter':
        buildKitchenCounter(group, f);
        break;
      case 'armchair':
        buildArmchair(group, f);
        break;
      case 'table':
        buildTable(group, f);
        break;
      case 'chair':
        buildChair(group, f);
        break;
      case 'shower':
        buildShower(group, f);
        break;
      case 'bathtub':
        buildBathtub(group, f);
        break;
      case 'bathroom-cabinet':
        buildBathroomCabinet(group, f);
        break;
      case 'bookshelf':
        buildBookshelf(group, f);
        break;
      case 'plant':
        buildPlant(group, f);
        break;
      case 'cabinet':
        buildCabinet(group, f);
        break;
      case 'fridge':
        buildFridge(group, f);
        break;
    }

    scene.add(group);
  }
}

function buildToilet(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('toilet');
  // Base / bowl
  const bowlGeo = new THREE.BoxGeometry(f.width * 0.8, f.height * 0.6, f.depth * 0.65);
  const bowl = new THREE.Mesh(bowlGeo, mat);
  bowl.position.y = f.height * 0.3;
  bowl.castShadow = true;
  bowl.userData.building = true;
  group.add(bowl);
  // Tank
  const tankGeo = new THREE.BoxGeometry(f.width * 0.7, f.height, f.depth * 0.25);
  const tank = new THREE.Mesh(tankGeo, mat);
  tank.position.set(0, f.height * 0.5, -f.depth * 0.35);
  tank.castShadow = true;
  tank.userData.building = true;
  group.add(tank);
}

function buildBed(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('bed');
  // Mattress
  const mattGeo = new THREE.BoxGeometry(f.width, f.height * 0.5, f.depth);
  const matt = new THREE.Mesh(mattGeo, mat);
  matt.position.y = f.height * 0.25;
  matt.castShadow = true;
  matt.userData.building = true;
  group.add(matt);
  // Headboard
  const headMat = new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.6 });
  const headGeo = new THREE.BoxGeometry(f.width, f.height * 1.4, 0.06);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, f.height * 0.7, -f.depth / 2 + 0.03);
  head.castShadow = true;
  head.userData.building = true;
  group.add(head);
  // Pillow
  const pillowMat = new THREE.MeshStandardMaterial({ color: '#d4d0c8', roughness: 0.9 });
  const pillowGeo = new THREE.BoxGeometry(f.width * 0.35, 0.08, 0.3);
  const p1 = new THREE.Mesh(pillowGeo, pillowMat);
  p1.position.set(-f.width * 0.22, f.height * 0.54, -f.depth * 0.35);
  p1.userData.building = true;
  group.add(p1);
  const p2 = new THREE.Mesh(pillowGeo, pillowMat);
  p2.position.set(f.width * 0.22, f.height * 0.54, -f.depth * 0.35);
  p2.userData.building = true;
  group.add(p2);
}

function buildKitchenCounter(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('kitchen-counter');
  // Counter top
  const topGeo = new THREE.BoxGeometry(f.width, 0.04, f.depth);
  const top = new THREE.Mesh(topGeo, mat);
  top.position.y = f.height;
  top.castShadow = true;
  top.userData.building = true;
  group.add(top);
  // Cabinets
  const cabGeo = new THREE.BoxGeometry(f.width - 0.02, f.height - 0.04, f.depth - 0.02);
  const cab = new THREE.Mesh(cabGeo, mat);
  cab.position.y = (f.height - 0.04) / 2;
  cab.castShadow = true;
  cab.userData.building = true;
  group.add(cab);
}

function buildArmchair(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('armchair');
  // Seat
  const seatGeo = new THREE.BoxGeometry(f.width * 0.8, f.height * 0.35, f.depth * 0.8);
  const seat = new THREE.Mesh(seatGeo, mat);
  seat.position.y = f.height * 0.35;
  seat.castShadow = true;
  seat.userData.building = true;
  group.add(seat);
  // Backrest
  const backGeo = new THREE.BoxGeometry(f.width * 0.8, f.height * 0.45, 0.1);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, f.height * 0.6, -f.depth * 0.35);
  back.castShadow = true;
  back.userData.building = true;
  group.add(back);
  // Armrests
  const armGeo = new THREE.BoxGeometry(0.08, f.height * 0.3, f.depth * 0.7);
  const leftArm = new THREE.Mesh(armGeo, mat);
  leftArm.position.set(-f.width * 0.44, f.height * 0.45, -f.depth * 0.05);
  leftArm.userData.building = true;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, mat);
  rightArm.position.set(f.width * 0.44, f.height * 0.45, -f.depth * 0.05);
  rightArm.userData.building = true;
  group.add(rightArm);
}

function buildTable(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('table');
  // Tabletop
  const topGeo = new THREE.BoxGeometry(f.width, 0.04, f.depth);
  const top = new THREE.Mesh(topGeo, mat);
  top.position.y = f.height;
  top.castShadow = true;
  top.userData.building = true;
  group.add(top);
  // 4 legs
  const legGeo = new THREE.BoxGeometry(0.04, f.height - 0.04, 0.04);
  const positions = [
    [-f.width / 2 + 0.05, (f.height - 0.04) / 2, -f.depth / 2 + 0.05],
    [f.width / 2 - 0.05, (f.height - 0.04) / 2, -f.depth / 2 + 0.05],
    [-f.width / 2 + 0.05, (f.height - 0.04) / 2, f.depth / 2 - 0.05],
    [f.width / 2 - 0.05, (f.height - 0.04) / 2, f.depth / 2 - 0.05],
  ];
  for (const [x, y, z] of positions) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x!, y!, z!);
    leg.userData.building = true;
    group.add(leg);
  }
}

function buildChair(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('chair');
  const seatH = f.height * 0.52;
  // Seat
  const seatGeo = new THREE.BoxGeometry(f.width * 0.9, 0.03, f.depth * 0.85);
  const seat = new THREE.Mesh(seatGeo, mat);
  seat.position.y = seatH;
  seat.castShadow = true;
  seat.userData.building = true;
  group.add(seat);
  // Backrest
  const backGeo = new THREE.BoxGeometry(f.width * 0.85, f.height - seatH, 0.03);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, seatH + (f.height - seatH) / 2, -f.depth * 0.4);
  back.castShadow = true;
  back.userData.building = true;
  group.add(back);
  // 4 legs
  const legGeo = new THREE.BoxGeometry(0.03, seatH, 0.03);
  const legPositions = [
    [-f.width * 0.38, seatH / 2, -f.depth * 0.35],
    [f.width * 0.38, seatH / 2, -f.depth * 0.35],
    [-f.width * 0.38, seatH / 2, f.depth * 0.35],
    [f.width * 0.38, seatH / 2, f.depth * 0.35],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x!, y!, z!);
    leg.userData.building = true;
    group.add(leg);
  }
}

function buildShower(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('shower');
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#a0c8e8', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.3,
  });
  // Tray
  const trayGeo = new THREE.BoxGeometry(f.width, 0.05, f.depth);
  const tray = new THREE.Mesh(trayGeo, mat);
  tray.position.y = 0.025;
  tray.userData.building = true;
  group.add(tray);
  // Glass wall (front)
  const glassGeo = new THREE.BoxGeometry(f.width, f.height, 0.02);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, f.height / 2, f.depth / 2);
  glass.userData.building = true;
  group.add(glass);
  // Shower head
  const headGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
  const head = new THREE.Mesh(headGeo, getMaterial('fridge'));
  head.position.set(0, f.height * 0.9, -f.depth * 0.35);
  head.userData.building = true;
  group.add(head);
}

function buildBathtub(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('bathtub');
  // Outer shell
  const outerGeo = new THREE.BoxGeometry(f.width, f.height, f.depth);
  const outer = new THREE.Mesh(outerGeo, mat);
  outer.position.y = f.height / 2;
  outer.castShadow = true;
  outer.userData.building = true;
  group.add(outer);
  // Inner cavity (darker)
  const innerMat = new THREE.MeshStandardMaterial({ color: '#d8d4d0', roughness: 0.2 });
  const innerGeo = new THREE.BoxGeometry(f.width - 0.08, f.height * 0.3, f.depth - 0.08);
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = f.height * 0.65;
  inner.userData.building = true;
  group.add(inner);
}

function buildBathroomCabinet(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('bathroom-cabinet');
  // Cabinet body
  const bodyGeo = new THREE.BoxGeometry(f.width, f.height, f.depth);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = f.height / 2;
  body.castShadow = true;
  body.userData.building = true;
  group.add(body);
  // Sink basin on top
  const sinkMat = new THREE.MeshStandardMaterial({ color: '#e8e4e0', roughness: 0.2, metalness: 0.1 });
  const sinkGeo = new THREE.CylinderGeometry(f.width * 0.25, f.width * 0.2, 0.08, 16);
  const sink = new THREE.Mesh(sinkGeo, sinkMat);
  sink.position.set(0, f.height + 0.04, 0);
  sink.userData.building = true;
  group.add(sink);
}

function buildBookshelf(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('bookshelf');
  // Back panel
  const backGeo = new THREE.BoxGeometry(f.width, f.height, 0.02);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, f.height / 2, -f.depth / 2 + 0.01);
  back.userData.building = true;
  group.add(back);
  // Side panels
  const sideGeo = new THREE.BoxGeometry(0.02, f.height, f.depth);
  const left = new THREE.Mesh(sideGeo, mat);
  left.position.set(-f.width / 2 + 0.01, f.height / 2, 0);
  left.userData.building = true;
  group.add(left);
  const right = new THREE.Mesh(sideGeo, mat);
  right.position.set(f.width / 2 - 0.01, f.height / 2, 0);
  right.userData.building = true;
  group.add(right);
  // Shelves
  const shelfGeo = new THREE.BoxGeometry(f.width - 0.04, 0.02, f.depth);
  const shelves = 5;
  for (let i = 0; i <= shelves; i++) {
    const shelf = new THREE.Mesh(shelfGeo, mat);
    shelf.position.set(0, (f.height / shelves) * i, 0);
    shelf.userData.building = true;
    group.add(shelf);
  }
}

function buildPlant(group: THREE.Group, f: Furniture): void {
  // Pot
  const potMat = new THREE.MeshStandardMaterial({ color: '#8b5e3c', roughness: 0.7 });
  const potGeo = new THREE.CylinderGeometry(f.width * 0.3, f.width * 0.2, f.height * 0.35, 12);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = f.height * 0.175;
  pot.castShadow = true;
  pot.userData.building = true;
  group.add(pot);
  // Foliage
  const leafMat = getMaterial('plant');
  const foliageGeo = new THREE.SphereGeometry(f.width * 0.4, 12, 10);
  const foliage = new THREE.Mesh(foliageGeo, leafMat);
  foliage.position.y = f.height * 0.65;
  foliage.castShadow = true;
  foliage.userData.building = true;
  group.add(foliage);
}

function buildCabinet(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('cabinet');
  // Body
  const bodyGeo = new THREE.BoxGeometry(f.width, f.height, f.depth);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = f.height / 2;
  body.castShadow = true;
  body.userData.building = true;
  group.add(body);
  // Door lines (handles)
  const handleMat = new THREE.MeshStandardMaterial({ color: '#555', metalness: 0.8, roughness: 0.2 });
  const handleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
  handleGeo.rotateX(Math.PI / 2);
  const h1 = new THREE.Mesh(handleGeo, handleMat);
  h1.position.set(-f.width * 0.15, f.height * 0.5, f.depth / 2 + 0.02);
  h1.userData.building = true;
  group.add(h1);
  const h2 = new THREE.Mesh(handleGeo, handleMat);
  h2.position.set(f.width * 0.15, f.height * 0.5, f.depth / 2 + 0.02);
  h2.userData.building = true;
  group.add(h2);
}

function buildFridge(group: THREE.Group, f: Furniture): void {
  const mat = getMaterial('fridge');
  // Body
  const bodyGeo = new THREE.BoxGeometry(f.width, f.height, f.depth);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = f.height / 2;
  body.castShadow = true;
  body.userData.building = true;
  group.add(body);
  // Freezer door line
  const lineMat = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.3 });
  const lineGeo = new THREE.BoxGeometry(f.width - 0.02, 0.005, f.depth * 0.01);
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.position.set(0, f.height * 0.7, f.depth / 2);
  line.userData.building = true;
  group.add(line);
  // Handle
  const handleMat = new THREE.MeshStandardMaterial({ color: '#666', metalness: 0.7, roughness: 0.2 });
  const handleGeo = new THREE.BoxGeometry(0.02, f.height * 0.3, 0.03);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(f.width * 0.38, f.height * 0.4, f.depth / 2 + 0.02);
  handle.userData.building = true;
  group.add(handle);
}
