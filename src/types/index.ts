export interface Wall {
  id: string;
  type: 'wall';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  height: number;
  color: string;
  label?: string;
  wallStyle?: WallStyle; // default 'standard'
  isLoadBearing?: boolean; // structural marker for future phases
}

export type WallStyle = 'standard' | 'barrier' | 'load-bearing';

export type DoorStyle = 'standard' | 'sliding' | 'french' | 'sliding-glass' | 'arcade';

export type WindowStyle = 'standard' | 'baie-vitree';

export interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;
  position: number; // 0–1 along wall
  width: number;
  height: number;
  sillHeight?: number; // windows only
  doorStyle?: DoorStyle; // doors only — default 'standard'
  flipDoor?: boolean; // doors only — flip hinge side (left/right)
  swingOut?: boolean; // doors only — swing outward (other side of wall)
  windowStyle?: WindowStyle; // windows only — default 'standard'
}

export type FloorMaterial = 'parquet' | 'carrelage' | 'pelouse';

export interface RoomLabel {
  id: string;
  type: 'label';
  name: string;
  cx: number;
  cy: number;
  area: number; // m²
  floorMaterial?: FloorMaterial;
}

export type FurnitureType =
  | 'toilet' | 'bed' | 'kitchen-counter' | 'armchair' | 'table' | 'chair'
  | 'shower' | 'bathtub' | 'bathroom-cabinet' | 'bookshelf' | 'plant' | 'cabinet' | 'fridge';

export interface Furniture {
  id: string;
  type: 'furniture';
  furnitureType: FurnitureType;
  cx: number;
  cy: number;
  width: number;   // meters (along local x)
  depth: number;   // meters (along local y)
  height: number;  // meters (3D height)
  rotation: number; // radians
}

export interface Terrain {
  width: number;   // meters
  depth: number;   // meters
  offsetX: number; // origin offset in meters
  offsetY: number;
}

export interface FloorPlan {
  walls: Wall[];
  openings: Opening[];
  labels: RoomLabel[];
  furniture: Furniture[];
  terrain?: Terrain;
}

export interface AIAnalysisResult {
  overall_width_m: number;
  overall_height_m: number;
  walls: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
  }>;
  doors?: Array<{
    wallIndex: number;
    position: number;
    width: number;
    label?: string;
  }>;
  windows?: Array<{
    wallIndex: number;
    position: number;
    width: number;
  }>;
  rooms?: Array<{
    name: string;
    area_m2: number;
    cx: number;
    cy: number;
  }>;
}
