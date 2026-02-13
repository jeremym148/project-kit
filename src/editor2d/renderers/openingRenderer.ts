import type { Wall, Opening } from '../../types';
import { toScreen } from '../../utils/geometry';

export function renderOpenings(
  ctx: CanvasRenderingContext2D,
  openings: Opening[],
  walls: Wall[],
  selectedId: string | null
): void {
  for (const o of openings) {
    const w = walls.find((ww) => ww.id === o.wallId);
    if (!w) continue;

    const ox = toScreen(w.x1 + (w.x2 - w.x1) * o.position);
    const oy = toScreen(w.y1 + (w.y2 - w.y1) * o.position);
    const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
    const isSel = o.id === selectedId;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle);

    if (o.type === 'door') {
      const style = o.doorStyle || 'standard';
      if (style === 'sliding') {
        renderSlidingDoor(ctx, o, isSel);
      } else if (style === 'french') {
        renderFrenchDoor(ctx, o, isSel);
      } else if (style === 'sliding-glass') {
        renderSlidingGlassDoor(ctx, o, isSel);
      } else if (style === 'arcade') {
        renderArcade(ctx, o, isSel);
      } else {
        renderDoor(ctx, o, isSel);
      }
    } else {
      const wStyle = o.windowStyle || 'standard';
      if (wStyle === 'baie-vitree') {
        renderBaieVitree(ctx, o, isSel);
      } else {
        renderWindow(ctx, o, isSel);
      }
    }

    ctx.restore();
  }
}

function renderDoor(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const dw = toScreen(o.width);
  const flip = o.flipDoor ?? false;
  const out = o.swingOut ?? false;
  const hingeX = flip ? dw / 2 : -dw / 2;
  // swingDir: -1 = upward (interior), +1 = downward (exterior)
  const swingDir = out ? 1 : -1;

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, 0);
  ctx.lineTo(dw / 2, 0);
  ctx.stroke();

  // Swing arc
  ctx.strokeStyle = isSel ? '#f59e0b' : '#60a5fa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (flip && !out) {
    ctx.arc(hingeX, 0, dw, Math.PI, Math.PI + Math.PI / 2, false);
  } else if (flip && out) {
    ctx.arc(hingeX, 0, dw, Math.PI, Math.PI - Math.PI / 2, true);
  } else if (!flip && !out) {
    ctx.arc(hingeX, 0, dw, 0, -Math.PI / 2, true);
  } else {
    ctx.arc(hingeX, 0, dw, 0, Math.PI / 2, false);
  }
  ctx.stroke();

  // Door panel line — perpendicular to wall from hinge
  ctx.beginPath();
  ctx.moveTo(hingeX, 0);
  ctx.lineTo(hingeX, swingDir * dw);
  ctx.stroke();

  // Hinge dot (highlighted side)
  ctx.fillStyle = isSel ? '#f59e0b' : '#60a5fa';
  ctx.beginPath();
  ctx.arc(hingeX, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  // Other end
  ctx.fillStyle = 'rgba(96,165,250,0.3)';
  ctx.beginPath();
  ctx.arc(-hingeX, 0, 3, 0, Math.PI * 2);
  ctx.fill();
}

function renderArcade(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const dw = toScreen(o.width);
  const color = isSel ? '#f59e0b' : '#a78bfa';

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, 0);
  ctx.lineTo(dw / 2, 0);
  ctx.stroke();

  // Side pillars
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, -8);
  ctx.lineTo(-dw / 2, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(dw / 2, -8);
  ctx.lineTo(dw / 2, 8);
  ctx.stroke();

  // Arch on top (semicircle)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, dw / 2, Math.PI, 0, false);
  ctx.stroke();

  // Dashed line across to show passage
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-dw / 2 + 4, 0);
  ctx.lineTo(dw / 2 - 4, 0);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderSlidingDoor(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const dw = toScreen(o.width);
  const color = isSel ? '#f59e0b' : '#60a5fa';

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, 0);
  ctx.lineTo(dw / 2, 0);
  ctx.stroke();

  // Two parallel sliding panels
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, -3);
  ctx.lineTo(dw * 0.1, -3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-dw * 0.1, 3);
  ctx.lineTo(dw / 2, 3);
  ctx.stroke();

  // Dashed track lines
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(dw * 0.1, -3);
  ctx.lineTo(dw / 2, -3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-dw / 2, 3);
  ctx.lineTo(-dw * 0.1, 3);
  ctx.stroke();
  ctx.setLineDash([]);

  // End markers
  ctx.fillStyle = color;
  ctx.fillRect(-dw / 2 - 2, -5, 4, 10);
  ctx.fillRect(dw / 2 - 2, -5, 4, 10);
}

function renderFrenchDoor(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const dw = toScreen(o.width);
  const half = dw / 2;
  const color = isSel ? '#f59e0b' : '#818cf8';

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.lineTo(half, 0);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Left swing arc
  ctx.beginPath();
  ctx.arc(0, 0, half, Math.PI, Math.PI / 2, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, half);
  ctx.stroke();

  // Right swing arc
  ctx.beginPath();
  ctx.arc(0, 0, half, 0, -Math.PI / 2, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -half);
  ctx.stroke();

  // Glass hatching
  ctx.strokeStyle = isSel ? 'rgba(245,158,11,0.3)' : 'rgba(129,140,248,0.3)';
  ctx.lineWidth = 1;
  for (let i = -half + 6; i < half; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, -2);
    ctx.lineTo(i, 2);
    ctx.stroke();
  }

  // Center + end points
  ctx.fillStyle = color;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.fillRect(-half - 2, -2, 4, 4);
  ctx.fillRect(half - 2, -2, 4, 4);
}

function renderSlidingGlassDoor(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const dw = toScreen(o.width);
  const color = isSel ? '#f59e0b' : '#38bdf8';

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-dw / 2, 0);
  ctx.lineTo(dw / 2, 0);
  ctx.stroke();

  // Outer frame
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-dw / 2, -6, dw, 12);

  // Two glass panels (sliding) — left panel on top track, right on bottom
  const panelW = dw * 0.52;

  // Left panel
  ctx.fillStyle = isSel ? 'rgba(245,158,11,0.12)' : 'rgba(56,189,248,0.12)';
  ctx.fillRect(-dw / 2 + 2, -5, panelW, 10);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-dw / 2 + 2, -5, panelW, 10);

  // Right panel
  ctx.fillRect(dw / 2 - panelW - 2, -5, panelW, 10);
  ctx.strokeRect(dw / 2 - panelW - 2, -5, panelW, 10);

  // Center mullion line
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 6);
  ctx.stroke();

  // Glass cross-hatching on each panel
  ctx.strokeStyle = isSel ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = -dw / 2 + 8; i < dw / 2; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -4);
    ctx.lineTo(i, 4);
    ctx.stroke();
  }

  // Sliding arrows
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  // Left arrow
  ctx.beginPath();
  ctx.moveTo(-dw / 4, -8);
  ctx.lineTo(-dw / 4 + 8, -8);
  ctx.stroke();
  // Right arrow
  ctx.beginPath();
  ctx.moveTo(dw / 4, -8);
  ctx.lineTo(dw / 4 - 8, -8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow tips
  ctx.fillStyle = color;
  // Right tip on left arrow
  ctx.beginPath();
  ctx.moveTo(-dw / 4 + 8, -10);
  ctx.lineTo(-dw / 4 + 8, -6);
  ctx.lineTo(-dw / 4 + 12, -8);
  ctx.fill();
  // Left tip on right arrow
  ctx.beginPath();
  ctx.moveTo(dw / 4 - 8, -10);
  ctx.lineTo(dw / 4 - 8, -6);
  ctx.lineTo(dw / 4 - 12, -8);
  ctx.fill();
}

function renderBaieVitree(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const ww = toScreen(o.width);
  const color = isSel ? '#f59e0b' : '#22d3ee';

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-ww / 2, 0);
  ctx.lineTo(ww / 2, 0);
  ctx.stroke();

  // Outer frame
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-ww / 2, -7, ww, 14);

  // Large glass pane fill
  ctx.fillStyle = isSel ? 'rgba(245,158,11,0.15)' : 'rgba(34,211,238,0.15)';
  ctx.fillRect(-ww / 2 + 2, -6, ww - 4, 12);

  // Glass cross-hatching
  ctx.strokeStyle = isSel ? 'rgba(245,158,11,0.2)' : 'rgba(34,211,238,0.25)';
  ctx.lineWidth = 0.5;
  for (let i = -ww / 2 + 6; i < ww / 2; i += 5) {
    ctx.beginPath();
    ctx.moveTo(i, -5);
    ctx.lineTo(i, 5);
    ctx.stroke();
  }

  // Center mullion (if wide enough)
  if (o.width > 1.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();
  }

  // Side frames
  ctx.fillStyle = color;
  ctx.fillRect(-ww / 2 - 1, -7, 3, 14);
  ctx.fillRect(ww / 2 - 2, -7, 3, 14);
}

function renderWindow(
  ctx: CanvasRenderingContext2D,
  o: Opening,
  isSel: boolean
): void {
  const ww = toScreen(o.width);

  // Gap in wall
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-ww / 2, 0);
  ctx.lineTo(ww / 2, 0);
  ctx.stroke();

  // Double lines + center divider
  ctx.strokeStyle = isSel ? '#f59e0b' : '#34d399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-ww / 2, -4);
  ctx.lineTo(ww / 2, -4);
  ctx.moveTo(-ww / 2, 4);
  ctx.lineTo(ww / 2, 4);
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 4);
  ctx.stroke();

  // Outline
  ctx.strokeRect(-ww / 2, -5, ww, 10);
}
