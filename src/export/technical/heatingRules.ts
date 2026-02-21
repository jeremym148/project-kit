import type { FloorPlan, Wall, Opening, RoomLabel } from '../../types';
import type { TechnicalPoint } from '../../types/pdf';
import { uid } from '../../utils/ids';

/** Generate heating and gas technical points */
export function generateHeatingPoints(data: FloorPlan): TechnicalPoint[] {
  const points: TechnicalPoint[] = [];

  // 1. Radiators: one per room, preferring walls with windows
  for (const label of data.labels) {
    const roomName = label.name.toLowerCase();
    // Skip outdoor areas
    if (roomName.includes('balcon') || roomName.includes('terrasse') || roomName.includes('garage')) continue;
    // Skip very small rooms like WC
    if (label.area < 1.5) continue;

    // Find the best wall for radiator placement (prefer wall with window)
    const bestWall = findBestRadiatorWall(label, data.walls, data.openings);
    if (!bestWall) continue;

    const dx = bestWall.x2 - bestWall.x1;
    const dy = bestWall.y2 - bestWall.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.3) continue;

    const nx = -dy / len;
    const ny = dx / len;

    // Place radiator at wall midpoint, slightly offset from wall
    points.push({
      id: uid('heat'),
      type: 'technical-point',
      pointType: 'radiator',
      domain: 'heating',
      cx: (bestWall.x1 + bestWall.x2) / 2 + nx * 0.1,
      cy: (bestWall.y1 + bestWall.y2) / 2 + ny * 0.1,
      rotation: Math.atan2(dy, dx),
      label: 'Radiateur',
      wallId: bestWall.id,
      roomId: label.id,
    });
  }

  // 2. Gas supply: at kitchen counter if present
  const hasGasFixture = data.furniture?.some((f) => f.furnitureType === 'kitchen-counter');
  if (hasGasFixture) {
    const counter = data.furniture!.find((f) => f.furnitureType === 'kitchen-counter')!;
    points.push({
      id: uid('heat'),
      type: 'technical-point',
      pointType: 'gas-supply',
      domain: 'heating',
      cx: counter.cx,
      cy: counter.cy - 0.3,
      rotation: 0,
      label: 'Arrivée gaz',
    });
  }

  // 3. Boiler: in utility room or kitchen
  const boilerRoom = data.labels.find((l) => {
    const name = l.name.toLowerCase();
    return name.includes('buanderie') || name.includes('cellier') || name.includes('technique');
  }) || data.labels.find((l) => l.name.toLowerCase().includes('cuisine'));

  if (boilerRoom) {
    // Find a wall in the room for boiler placement
    const roomWalls = findRoomWalls(boilerRoom, data.walls);
    const boilerWall = roomWalls[0];
    if (boilerWall) {
      const dx = boilerWall.x2 - boilerWall.x1;
      const dy = boilerWall.y2 - boilerWall.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;

      points.push({
        id: uid('heat'),
        type: 'technical-point',
        pointType: 'boiler',
        domain: 'heating',
        cx: (boilerWall.x1 + boilerWall.x2) / 2 + nx * 0.2,
        cy: (boilerWall.y1 + boilerWall.y2) / 2 + ny * 0.2,
        rotation: Math.atan2(dy, dx),
        label: 'Chaudière',
        wallId: boilerWall.id,
        roomId: boilerRoom.id,
      });
    }
  }

  return points;
}

/** Find the best wall for radiator placement — prefer walls with windows */
function findBestRadiatorWall(
  label: RoomLabel,
  walls: Wall[],
  openings: Opening[]
): Wall | null {
  const roomWalls = findRoomWalls(label, walls);
  if (roomWalls.length === 0) return null;

  // Find walls that have windows
  const wallsWithWindows = roomWalls.filter((w) =>
    openings.some((o) => o.wallId === w.id && o.type === 'window')
  );

  if (wallsWithWindows.length > 0) {
    // Pick the wall with the widest window
    return wallsWithWindows[0]!;
  }

  // No windows: pick the longest wall
  let bestWall = roomWalls[0]!;
  let bestLen = 0;
  for (const w of roomWalls) {
    const len = Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2);
    if (len > bestLen) {
      bestLen = len;
      bestWall = w;
    }
  }
  return bestWall;
}

function findRoomWalls(label: RoomLabel, walls: Wall[]): Wall[] {
  if (label.polygon && label.polygon.length >= 3) {
    return walls.filter((w) => {
      const mx = (w.x1 + w.x2) / 2;
      const my = (w.y1 + w.y2) / 2;
      return isPointNearPolygon(mx, my, label.polygon!, 0.5);
    });
  }
  return walls.filter((w) => {
    const mx = (w.x1 + w.x2) / 2;
    const my = (w.y1 + w.y2) / 2;
    const dist = Math.sqrt((mx - label.cx) ** 2 + (my - label.cy) ** 2);
    return dist < Math.sqrt(label.area) * 1.5;
  });
}

function isPointNearPolygon(
  px: number, py: number,
  polygon: { x: number; y: number }[],
  threshold: number
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const ax = polygon[i]!.x;
    const ay = polygon[i]!.y;
    const bx = polygon[j]!.x;
    const by = polygon[j]!.y;

    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 < 0.001) continue;

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    if (dist < threshold) return true;
  }
  return false;
}
