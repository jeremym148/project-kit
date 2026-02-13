import type { FloorPlan, FloorPlanDiff } from '../../types';
import { toScreen } from '../../utils/geometry';

const ADDED_COLOR = 'rgba(52,211,153,0.45)';
const REMOVED_COLOR = 'rgba(239,68,68,0.45)';
const MODIFIED_COLOR = 'rgba(245,158,11,0.35)';

/**
 * Renders diff overlay on top of the normal 2D render.
 * - Removed elements: drawn from baseline data with red dashed lines
 * - Modified elements: yellow halo behind the element
 * - Added elements: green halo behind the element
 */
export function renderDiffOverlay(
  ctx: CanvasRenderingContext2D,
  currentData: FloorPlan,
  baselineData: FloorPlan,
  diff: FloorPlanDiff
): void {
  ctx.save();

  // 1. Draw halos for added elements in current data
  for (const w of currentData.walls) {
    if (diff.addedIds.has(w.id)) {
      drawWallHighlight(ctx, w.x1, w.y1, w.x2, w.y2, ADDED_COLOR, false);
    } else if (diff.modifiedIds.has(w.id)) {
      drawWallHighlight(ctx, w.x1, w.y1, w.x2, w.y2, MODIFIED_COLOR, false);
    }
  }

  for (const o of currentData.openings) {
    const wall = currentData.walls.find((w) => w.id === o.wallId);
    if (!wall) continue;
    const ox = wall.x1 + (wall.x2 - wall.x1) * o.position;
    const oy = wall.y1 + (wall.y2 - wall.y1) * o.position;
    if (diff.addedIds.has(o.id)) {
      drawCircleHighlight(ctx, ox, oy, ADDED_COLOR);
    } else if (diff.modifiedIds.has(o.id)) {
      drawCircleHighlight(ctx, ox, oy, MODIFIED_COLOR);
    }
  }

  for (const f of currentData.furniture) {
    if (diff.addedIds.has(f.id)) {
      drawRectHighlight(ctx, f.cx, f.cy, f.width, f.depth, f.rotation, ADDED_COLOR);
    } else if (diff.modifiedIds.has(f.id)) {
      drawRectHighlight(ctx, f.cx, f.cy, f.width, f.depth, f.rotation, MODIFIED_COLOR);
    }
  }

  for (const l of currentData.labels) {
    if (diff.addedIds.has(l.id)) {
      drawCircleHighlight(ctx, l.cx, l.cy, ADDED_COLOR);
    } else if (diff.modifiedIds.has(l.id)) {
      drawCircleHighlight(ctx, l.cx, l.cy, MODIFIED_COLOR);
    }
  }

  // 2. Draw removed elements from baseline (red dashed)
  for (const w of baselineData.walls) {
    if (diff.removedIds.has(w.id)) {
      drawWallHighlight(ctx, w.x1, w.y1, w.x2, w.y2, REMOVED_COLOR, true);
    }
  }

  for (const o of baselineData.openings) {
    if (!diff.removedIds.has(o.id)) continue;
    const wall = baselineData.walls.find((w) => w.id === o.wallId);
    if (!wall) continue;
    const ox = wall.x1 + (wall.x2 - wall.x1) * o.position;
    const oy = wall.y1 + (wall.y2 - wall.y1) * o.position;
    drawCircleHighlight(ctx, ox, oy, REMOVED_COLOR);
  }

  for (const f of baselineData.furniture) {
    if (diff.removedIds.has(f.id)) {
      drawRectHighlight(ctx, f.cx, f.cy, f.width, f.depth, f.rotation, REMOVED_COLOR);
    }
  }

  for (const l of baselineData.labels) {
    if (diff.removedIds.has(l.id)) {
      drawCircleHighlight(ctx, l.cx, l.cy, REMOVED_COLOR);
    }
  }

  ctx.restore();
}

function drawWallHighlight(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(toScreen(x1), toScreen(y1));
  ctx.lineTo(toScreen(x2), toScreen(y2));
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
}

function drawCircleHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(toScreen(cx), toScreen(cy), 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawRectHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  width: number, depth: number,
  rotation: number, color: string
): void {
  const sx = toScreen(cx);
  const sy = toScreen(cy);
  const sw = toScreen(width);
  const sd = toScreen(depth);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.fillRect(-sw / 2 - 4, -sd / 2 - 4, sw + 8, sd + 8);
  ctx.restore();
}
