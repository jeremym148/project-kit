import type { Opening } from '../types';

export interface WallSegment {
  start: number;
  end: number;
  type: 'wall' | 'above' | 'below';
  height?: number;
  bottomY?: number;
  topY?: number;
}

/**
 * Splits a wall into solid segments and opening gaps.
 * Returns the segments to render as geometry (solid wall parts around openings).
 */
export function splitWallByOpenings(
  wallLength: number,
  wallHeight: number,
  openings: Opening[]
): WallSegment[] {
  if (openings.length === 0) return [];

  const sorted = openings
    .map(o => ({
      ...o,
      posAlongWall: o.position * wallLength,
      halfWidth: o.width / 2,
    }))
    .sort((a, b) => a.posAlongWall - b.posAlongWall);

  const segments: WallSegment[] = [];
  let lastEnd = 0;

  for (const o of sorted) {
    const openStart = Math.max(0, o.posAlongWall - o.halfWidth);
    const openEnd = Math.min(wallLength, o.posAlongWall + o.halfWidth);

    if (openStart > lastEnd + 0.05) {
      segments.push({ start: lastEnd, end: openStart, type: 'wall', height: wallHeight });
    }

    const oH = o.type === 'door'
      ? (o.height || 2.1)
      : ((o.sillHeight ?? 0.9) + (o.height || 1.2));

    if (oH < wallHeight) {
      segments.push({ start: openStart, end: openEnd, type: 'above', bottomY: oH, topY: wallHeight });
    }

    if (o.type === 'window' && (o.sillHeight ?? 0.9) > 0) {
      segments.push({ start: openStart, end: openEnd, type: 'below', topY: o.sillHeight ?? 0.9 });
    }

    lastEnd = openEnd;
  }

  if (lastEnd < wallLength - 0.05) {
    segments.push({ start: lastEnd, end: wallLength, type: 'wall', height: wallHeight });
  }

  return segments;
}
