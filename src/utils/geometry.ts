import type { Wall, Opening, RoomLabel } from '../types';

export const GRID_SIZE = 0.5; // visual grid spacing
export const SNAP_SIZE = 0.1; // positioning snap (10cm)
export const SCALE = 50;

export function snap(v: number): number {
  return Math.round(v / SNAP_SIZE) * SNAP_SIZE;
}

export function toScreen(v: number): number {
  return v * SCALE;
}

export function toWorld(v: number): number {
  return v / SCALE;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function wallLength(wall: Wall): number {
  return distance(wall.x1, wall.y1, wall.x2, wall.y2);
}

export interface WallHit {
  wall: Wall;
  t: number;
}

export interface LabelHit {
  label: RoomLabel;
}

export interface LabelVertexHit {
  label: RoomLabel;
  vertexIndex: number;
}

export function labelVertexHitTest(
  labels: RoomLabel[],
  mx: number,
  my: number,
  threshold = 0.8
): LabelVertexHit | null {
  let best: LabelVertexHit | null = null;
  let bestDist = threshold;
  for (const label of labels) {
    if (!label.polygon || label.polygon.length < 3) continue;
    for (let i = 0; i < label.polygon.length; i++) {
      const d = distance(mx, my, label.polygon[i]!.x, label.polygon[i]!.y);
      if (d < bestDist) {
        bestDist = d;
        best = { label, vertexIndex: i };
      }
    }
  }
  return best;
}

export function labelHitTest(
  labels: RoomLabel[],
  mx: number,
  my: number,
  threshold = 0.8
): LabelHit | null {
  for (const label of labels) {
    const dist = distance(mx, my, label.cx, label.cy);
    if (dist < threshold) return { label };
  }
  return null;
}

export function wallHitTest(
  walls: Wall[],
  mx: number,
  my: number,
  threshold = 0.6
): WallHit | null {
  for (const w of walls) {
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const t = Math.max(0, Math.min(1, ((mx - w.x1) * dx + (my - w.y1) * dy) / (len * len)));
    const dist = Math.sqrt((mx - (w.x1 + t * dx)) ** 2 + (my - (w.y1 + t * dy)) ** 2);
    if (dist < threshold) return { wall: w, t };
  }
  return null;
}

export interface OpeningHit {
  opening: Opening;
}

export function openingHitTest(
  openings: Opening[],
  walls: Wall[],
  mx: number,
  my: number,
  threshold = 1.0
): OpeningHit | null {
  let best: OpeningHit | null = null;
  let bestDist = threshold;
  for (const o of openings) {
    const w = walls.find((ww) => ww.id === o.wallId);
    if (!w) continue;
    const ox = w.x1 + (w.x2 - w.x1) * o.position;
    const oy = w.y1 + (w.y2 - w.y1) * o.position;
    const d = distance(mx, my, ox, oy);
    if (d < bestDist) {
      bestDist = d;
      best = { opening: o };
    }
  }
  return best;
}
