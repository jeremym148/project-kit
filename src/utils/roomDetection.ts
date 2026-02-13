import type { Wall, RoomLabel } from '../types';
import { uid } from './ids';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Round coordinates for stable hashing */
function ptKey(x: number, y: number): string {
  return `${Math.round(x * 100)},${Math.round(y * 100)}`;
}

/** Check if point (px, py) lies on the interior of segment s */
function isPointOnSegmentInterior(
  px: number,
  py: number,
  s: Segment,
  tolerance = 0.05
): boolean {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 0.0001) return false;

  const t = ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
  if (t < 0.01 || t > 0.99) return false;

  const projX = s.x1 + t * dx;
  const projY = s.y1 + t * dy;
  const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  return dist < tolerance;
}

/** Split wall segments at T-junctions where endpoints of other walls lie on them */
function splitWallsAtTJunctions(walls: Wall[]): Segment[] {
  // Collect all unique endpoints
  const allPoints: Point[] = [];
  const seen = new Set<string>();
  for (const w of walls) {
    for (const p of [
      { x: w.x1, y: w.y1 },
      { x: w.x2, y: w.y2 },
    ]) {
      const k = ptKey(p.x, p.y);
      if (!seen.has(k)) {
        seen.add(k);
        allPoints.push(p);
      }
    }
  }

  const result: Segment[] = [];

  for (const w of walls) {
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 0.0001) continue;

    // Find points that lie on this wall's interior
    const splits: { point: Point; t: number }[] = [];
    for (const p of allPoints) {
      if (isPointOnSegmentInterior(p.x, p.y, w)) {
        const t = ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / len2;
        splits.push({ point: p, t });
      }
    }

    if (splits.length === 0) {
      result.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 });
      continue;
    }

    // Sort by t and deduplicate close points
    splits.sort((a, b) => a.t - b.t);
    const unique = [splits[0]!];
    for (let i = 1; i < splits.length; i++) {
      if (Math.abs(splits[i]!.t - unique[unique.length - 1]!.t) > 0.01) {
        unique.push(splits[i]!);
      }
    }

    // Create sub-segments
    let prevX = w.x1;
    let prevY = w.y1;
    for (const sp of unique) {
      const segLen = Math.sqrt(
        (sp.point.x - prevX) ** 2 + (sp.point.y - prevY) ** 2
      );
      if (segLen > 0.05) {
        result.push({ x1: prevX, y1: prevY, x2: sp.point.x, y2: sp.point.y });
      }
      prevX = sp.point.x;
      prevY = sp.point.y;
    }
    const lastLen = Math.sqrt((w.x2 - prevX) ** 2 + (w.y2 - prevY) ** 2);
    if (lastLen > 0.05) {
      result.push({ x1: prevX, y1: prevY, x2: w.x2, y2: w.y2 });
    }
  }

  return result;
}

/** Signed area via shoelace formula. Positive = CW in y-down coords = interior room */
function shoelaceArea(polygon: Point[]): number {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i]!.x * polygon[j]!.y;
    area -= polygon[j]!.x * polygon[i]!.y;
  }
  return area / 2;
}

function centroid(polygon: Point[]): Point {
  let cx = 0;
  let cy = 0;
  for (const p of polygon) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / polygon.length, y: cy / polygon.length };
}

/**
 * Detect rooms from wall geometry using planar face enumeration.
 * Returns RoomLabel[] with centroid positions and calculated areas.
 */
export function detectRoomsFromWalls(walls: Wall[]): RoomLabel[] {
  if (walls.length < 3) return [];

  // Step 1: Split walls at T-junctions
  const segments = splitWallsAtTJunctions(walls);

  // Step 2: Build planar graph
  const vertexMap = new Map<string, number>();
  const vertices: Point[] = [];

  function getVertexId(x: number, y: number): number {
    const k = ptKey(x, y);
    let id = vertexMap.get(k);
    if (id === undefined) {
      id = vertices.length;
      vertices.push({ x, y });
      vertexMap.set(k, id);
    }
    return id;
  }

  interface EdgeEntry {
    to: number;
    angle: number;
  }
  const adj = new Map<number, EdgeEntry[]>();
  const edgeSet = new Set<string>();

  for (const seg of segments) {
    const u = getVertexId(seg.x1, seg.y1);
    const v = getVertexId(seg.x2, seg.y2);
    if (u === v) continue;

    // Deduplicate edges
    const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);

    const pu = vertices[u]!;
    const pv = vertices[v]!;
    const angleUV = Math.atan2(pv.y - pu.y, pv.x - pu.x);
    const angleVU = Math.atan2(pu.y - pv.y, pu.x - pv.x);

    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push({ to: v, angle: angleUV });
    adj.get(v)!.push({ to: u, angle: angleVU });
  }

  // Sort edges at each vertex by angle (increasing = CCW in math, CW on screen)
  for (const edges of adj.values()) {
    edges.sort((a, b) => a.angle - b.angle);
  }

  // Step 3: Enumerate faces using "previous in sorted order" rule
  const visited = new Set<string>();
  const faces: Point[][] = [];
  const maxSteps = vertices.length * 2 + 10;

  for (const [u, edges] of adj) {
    for (const edge of edges) {
      const startKey = `${u}->${edge.to}`;
      if (visited.has(startKey)) continue;

      const face: number[] = [];
      let curFrom = u;
      let curTo = edge.to;
      let steps = 0;
      let valid = true;

      while (steps < maxSteps) {
        const heKey = `${curFrom}->${curTo}`;
        if (visited.has(heKey)) break;
        visited.add(heKey);
        face.push(curFrom);

        // Find next half-edge: at curTo, find back-edge to curFrom, take previous
        const edgesAtTo = adj.get(curTo);
        if (!edgesAtTo || edgesAtTo.length === 0) {
          valid = false;
          break;
        }

        const backIdx = edgesAtTo.findIndex((e) => e.to === curFrom);
        if (backIdx === -1) {
          valid = false;
          break;
        }

        const prevIdx =
          (backIdx - 1 + edgesAtTo.length) % edgesAtTo.length;
        curFrom = curTo;
        curTo = edgesAtTo[prevIdx]!.to;
        steps++;
      }

      if (valid && face.length >= 3) {
        faces.push(face.map((i) => vertices[i]!));
      }
    }
  }

  // Step 4: Filter to interior rooms
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
  const totalArea = (maxX - minX) * (maxY - minY);

  const rooms: RoomLabel[] = [];
  for (const face of faces) {
    const area = shoelaceArea(face);
    // Positive = CW in y-down = interior face
    if (area < 0.5) continue;
    if (area > totalArea * 0.8) continue; // exterior face

    const c = centroid(face);
    rooms.push({
      id: uid('room'),
      type: 'label',
      name: '',
      cx: Math.round(c.x * 100) / 100,
      cy: Math.round(c.y * 100) / 100,
      area: Math.round(area * 100) / 100,
      polygon: face.map((p) => ({
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
      })),
    });
  }

  return rooms;
}
