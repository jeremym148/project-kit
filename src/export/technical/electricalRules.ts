import type { FloorPlan, Wall, RoomLabel } from '../../types';
import type { TechnicalPoint } from '../../types/pdf';
import { uid } from '../../utils/ids';

/** Generate electrical technical points from floor plan data */
export function generateElectricalPoints(data: FloorPlan): TechnicalPoint[] {
  const points: TechnicalPoint[] = [];

  // 1. Ceiling lights: one per room at centroid
  for (const label of data.labels) {
    points.push({
      id: uid('elec'),
      type: 'technical-point',
      pointType: 'ceiling-light',
      domain: 'electrical',
      cx: label.cx,
      cy: label.cy,
      rotation: 0,
      label: 'Point lumineux',
      roomId: label.id,
    });
  }

  // 2. Switches: one per door, placed on the hinge side
  for (const opening of data.openings) {
    if (opening.type !== 'door') continue;
    const wall = data.walls.find((w) => w.id === opening.wallId);
    if (!wall) continue;

    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) continue;

    // Door position on wall
    const doorX = wall.x1 + dx * opening.position;
    const doorY = wall.y1 + dy * opening.position;

    // Perpendicular normal
    const nx = -dy / len;
    const ny = dx / len;

    // Place switch 0.15m from wall on one side, offset 0.3m from door along wall
    const flip = opening.flipDoor ?? false;
    const offsetDir = flip ? -1 : 1;
    const switchX = doorX + (dx / len) * 0.3 * offsetDir + nx * 0.15;
    const switchY = doorY + (dy / len) * 0.3 * offsetDir + ny * 0.15;

    points.push({
      id: uid('elec'),
      type: 'technical-point',
      pointType: 'switch',
      domain: 'electrical',
      cx: switchX,
      cy: switchY,
      rotation: Math.atan2(dy, dx),
      label: 'Interrupteur',
      wallId: wall.id,
    });
  }

  // 3. Outlets: place along walls based on room type
  for (const label of data.labels) {
    const roomName = label.name.toLowerCase();
    const isKitchen = roomName.includes('cuisine');
    const isBathroom = roomName.includes('bain') || roomName.includes('sdb');
    const isWC = roomName.includes('wc') || roomName.includes('toilette');

    let outletCount = 3; // default
    if (isKitchen) outletCount = 6;
    else if (isBathroom) outletCount = 1;
    else if (isWC) outletCount = 1;
    else if (roomName.includes('chambre')) outletCount = 4;
    else if (roomName.includes('salon') || roomName.includes('séjour')) outletCount = 5;
    else if (roomName.includes('bureau')) outletCount = 4;

    // Find walls that border this room (using polygon proximity)
    const roomWalls = findRoomWalls(label, data.walls);
    if (roomWalls.length === 0) continue;

    // Distribute outlets along the longest walls
    const sortedWalls = roomWalls
      .map((w) => ({ wall: w, len: Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2) }))
      .sort((a, b) => b.len - a.len);

    let placed = 0;
    for (const { wall } of sortedWalls) {
      if (placed >= outletCount) break;

      const wdx = wall.x2 - wall.x1;
      const wdy = wall.y2 - wall.y1;
      const wlen = Math.sqrt(wdx * wdx + wdy * wdy);
      if (wlen < 0.5) continue;

      const nx = -wdy / wlen;
      const ny = wdx / wlen;

      // Place 1-2 outlets per wall
      const outletsOnWall = Math.min(outletCount - placed, wlen > 2 ? 2 : 1);
      for (let i = 0; i < outletsOnWall; i++) {
        const t = (i + 1) / (outletsOnWall + 1);
        const ox = wall.x1 + wdx * t + nx * 0.1;
        const oy = wall.y1 + wdy * t + ny * 0.1;

        points.push({
          id: uid('elec'),
          type: 'technical-point',
          pointType: 'outlet',
          domain: 'electrical',
          cx: ox,
          cy: oy,
          rotation: Math.atan2(wdy, wdx),
          label: 'Prise',
          wallId: wall.id,
          roomId: label.id,
        });
        placed++;
      }
    }
  }

  // 4. Electrical panel: in entrance/hallway
  const entranceLabel = data.labels.find((l) => {
    const name = l.name.toLowerCase();
    return name.includes('entrée') || name.includes('entree') || name.includes('couloir') || name.includes('hall');
  });

  if (entranceLabel) {
    // Find a wall near the entrance
    const nearWall = findNearestWall(entranceLabel.cx, entranceLabel.cy, data.walls);
    if (nearWall) {
      const dx = nearWall.x2 - nearWall.x1;
      const dy = nearWall.y2 - nearWall.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;

      points.push({
        id: uid('elec'),
        type: 'technical-point',
        pointType: 'electrical-panel',
        domain: 'electrical',
        cx: (nearWall.x1 + nearWall.x2) / 2 + nx * 0.1,
        cy: (nearWall.y1 + nearWall.y2) / 2 + ny * 0.1,
        rotation: Math.atan2(dy, dx),
        label: 'Tableau électrique',
        wallId: nearWall.id,
        roomId: entranceLabel.id,
      });
    }
  }

  return points;
}

/** Find walls that are close to a room label's polygon or centroid */
function findRoomWalls(label: RoomLabel, walls: Wall[]): Wall[] {
  if (label.polygon && label.polygon.length >= 3) {
    // Find walls whose midpoints are close to the polygon boundary
    return walls.filter((w) => {
      const mx = (w.x1 + w.x2) / 2;
      const my = (w.y1 + w.y2) / 2;
      return isPointNearPolygon(mx, my, label.polygon!, 0.5);
    });
  }

  // Fallback: find walls close to centroid
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

function findNearestWall(cx: number, cy: number, walls: Wall[]): Wall | null {
  let best: Wall | null = null;
  let bestDist = Infinity;
  for (const w of walls) {
    const mx = (w.x1 + w.x2) / 2;
    const my = (w.y1 + w.y2) / 2;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = w;
    }
  }
  return best;
}
