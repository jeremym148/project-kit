import type { Wall, Opening, FloorPlan, RoomLabel, DoorStyle, FurnitureType, Furniture } from '../types';
import { uid } from './ids';

/** Default dimensions per furniture type: [width, depth, height] in meters */
export const FURNITURE_DEFAULTS: Record<FurnitureType, { width: number; depth: number; height: number; label: string }> = {
  'toilet':           { width: 0.40, depth: 0.65, height: 0.40, label: 'Toilette' },
  'bed':              { width: 1.40, depth: 2.00, height: 0.50, label: 'Lit' },
  'kitchen-counter':  { width: 2.00, depth: 0.60, height: 0.90, label: 'Plan de travail' },
  'armchair':         { width: 0.80, depth: 0.80, height: 0.80, label: 'Fauteuil' },
  'table':            { width: 1.20, depth: 0.80, height: 0.75, label: 'Table' },
  'chair':            { width: 0.45, depth: 0.45, height: 0.85, label: 'Chaise' },
  'shower':           { width: 0.90, depth: 0.90, height: 2.10, label: 'Douche' },
  'bathtub':          { width: 0.70, depth: 1.70, height: 0.55, label: 'Baignoire' },
  'bathroom-cabinet': { width: 0.80, depth: 0.50, height: 0.85, label: 'Meuble SdB' },
  'bookshelf':        { width: 1.20, depth: 0.35, height: 2.00, label: 'Bibliothèque' },
  'plant':            { width: 0.40, depth: 0.40, height: 1.00, label: 'Plante' },
  'cabinet':          { width: 1.00, depth: 0.50, height: 0.80, label: 'Meuble' },
  'fridge':           { width: 0.60, depth: 0.65, height: 1.80, label: 'Frigo' },
};

export function createFurniture(
  furnitureType: FurnitureType,
  cx: number,
  cy: number,
  rotation = 0
): Furniture {
  const def = FURNITURE_DEFAULTS[furnitureType];
  return {
    id: uid('furn'),
    type: 'furniture',
    furnitureType,
    cx,
    cy,
    width: def.width,
    depth: def.depth,
    height: def.height,
    rotation,
  };
}

export function createWall(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label?: string
): Wall {
  return {
    id: uid('w'),
    type: 'wall',
    x1, y1, x2, y2,
    thickness: 0.15,
    height: 2.8,
    color: '#e8e0d4',
    label,
  };
}

export function createDoor(
  wallId: string,
  position = 0.5,
  width = 0.9,
  doorStyle: DoorStyle = 'standard'
): Opening {
  return {
    id: uid('d'),
    type: 'door',
    wallId,
    position,
    width,
    height: 2.1,
    doorStyle,
  };
}

export function createLabel(
  cx: number,
  cy: number,
  name = '',
  area = 0
): RoomLabel {
  return {
    id: uid('lbl'),
    type: 'label',
    name,
    cx,
    cy,
    area,
  };
}

export function createWindow(
  wallId: string,
  position = 0.5,
  width = 1.2
): Opening {
  return {
    id: uid('win'),
    type: 'window',
    wallId,
    position,
    width,
    height: 1.2,
    sillHeight: 0.9,
  };
}

export function israeliApartment(): FloorPlan {
  const w: Wall[] = [];
  // EXTERIOR - Balcony (18m²)
  w.push(createWall(1.5, 0, 8, 0, 'balc-top'));
  w.push(createWall(8, 0, 8, 2.5, 'balc-right'));
  w.push(createWall(1.5, 0, 1.5, 2.5, 'balc-left'));
  // EXTERIOR - Main building
  w.push(createWall(0, 2.5, 14, 2.5, 'main-top'));
  w.push(createWall(14, 2.5, 14, 10.5, 'right'));
  w.push(createWall(14, 10.5, 10, 10.5, 'bottom-right'));
  w.push(createWall(10, 10.5, 10, 13.5, 'addition-right'));
  w.push(createWall(10, 13.5, 0, 13.5, 'bottom'));
  w.push(createWall(0, 13.5, 0, 2.5, 'left'));
  // INTERIOR - Main vertical dividers
  w.push(createWall(7, 2.5, 7, 5.5, 'div-v1-top'));
  w.push(createWall(7, 5.5, 7, 10.5, 'div-v1-bot'));
  w.push(createWall(10.5, 2.5, 10.5, 5.5, 'div-v2-top'));
  w.push(createWall(10.5, 5.5, 10.5, 10.5, 'div-v2-right'));
  // INTERIOR - Horizontal dividers
  w.push(createWall(7, 5.5, 10.5, 5.5, 'div-h1'));
  w.push(createWall(10.5, 5.5, 14, 5.5, 'div-h1-right'));
  w.push(createWall(0, 8, 7, 8, 'div-h-living'));
  w.push(createWall(7, 9, 10.5, 9, 'div-h-bath-bot'));
  w.push(createWall(10.5, 9, 14, 9, 'div-h-right-bot'));
  // INTERIOR - Bathrooms
  w.push(createWall(8, 5.5, 8, 9, 'bath-left'));
  w.push(createWall(9.5, 5.5, 9.5, 9, 'bath-right'));
  w.push(createWall(8, 7, 9.5, 7, 'bath-divider'));
  // INTERIOR - Entry / Kitchen area
  w.push(createWall(1.5, 8, 1.5, 9.5, 'entry-right'));
  w.push(createWall(0, 9.5, 3.5, 9.5, 'kitchen-bot'));
  w.push(createWall(3.5, 8, 3.5, 10.5, 'kitchen-right'));
  // INTERIOR - Bottom dividers
  w.push(createWall(0, 10.5, 10, 10.5, 'div-h-bottom'));
  w.push(createWall(4.5, 10.5, 4.5, 13.5, 'safe-room-div'));
  // INTERIOR - Small room (2.38m²)
  w.push(createWall(7, 9, 7, 10.5, 'small-left'));
  w.push(createWall(9, 9, 9, 10.5, 'small-right'));

  // DOORS
  const doors: Opening[] = [];
  doors.push(createDoor(w[0]!.id, 0.5, 1.2));
  doors.push(createDoor(w[3]!.id, 0.12, 0.9));
  doors.push(createDoor(w[9]!.id, 0.6, 0.9));
  doors.push(createDoor(w[11]!.id, 0.6, 0.9));
  doors.push(createDoor(w[14]!.id, 0.3, 0.8));
  doors.push(createDoor(w[21]!.id, 0.4, 0.8));
  doors.push(createDoor(w[21]!.id, 0.8, 0.8));
  doors.push(createDoor(w[10]!.id, 0.25, 0.9));
  doors.push(createDoor(w[12]!.id, 0.3, 0.9));
  doors.push(createDoor(w[18]!.id, 0.5, 0.9));
  doors.push(createDoor(w[16]!.id, 0.3, 0.8));
  doors.push(createDoor(w[25]!.id, 0.5, 0.9));
  doors.push(createDoor(w[26]!.id, 0.5, 0.9));

  // WINDOWS
  const windows: Opening[] = [];
  windows.push(createWindow(w[0]!.id, 0.2, 1.5));
  windows.push(createWindow(w[0]!.id, 0.8, 1.5));
  windows.push(createWindow(w[1]!.id, 0.5, 1.0));
  windows.push(createWindow(w[2]!.id, 0.5, 1.0));
  windows.push(createWindow(w[3]!.id, 0.6, 1.2));
  windows.push(createWindow(w[3]!.id, 0.85, 1.2));
  windows.push(createWindow(w[4]!.id, 0.25, 1.2));
  windows.push(createWindow(w[4]!.id, 0.65, 1.2));
  windows.push(createWindow(w[4]!.id, 0.9, 1.0));
  windows.push(createWindow(w[8]!.id, 0.3, 1.0));
  windows.push(createWindow(w[7]!.id, 0.7, 1.2));
  windows.push(createWindow(w[5]!.id, 0.5, 1.0));

  return { walls: w, openings: [...doors, ...windows], labels: [], furniture: [] };
}

export function defaultApartment(): FloorPlan {
  const walls = [
    createWall(0, 0, 8, 0),
    createWall(8, 0, 8, 6),
    createWall(8, 6, 0, 6),
    createWall(0, 6, 0, 0),
    createWall(4, 0, 4, 4),
    createWall(4, 4, 8, 4),
  ];
  return {
    walls,
    openings: [
      createDoor(walls[0]!.id, 0.25),
      createWindow(walls[1]!.id, 0.3),
      createWindow(walls[2]!.id, 0.5),
      createDoor(walls[4]!.id, 0.7),
      createWindow(walls[1]!.id, 0.75),
    ],
    labels: [],
    furniture: [],
  };
}
