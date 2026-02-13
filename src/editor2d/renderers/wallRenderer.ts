import type { Wall } from '../../types';
import { toScreen } from '../../utils/geometry';

export function renderWalls(
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  selectedId: string | null
): void {
  for (const w of walls) {
    const isSel = w.id === selectedId;
    const style = w.wallStyle || 'standard';

    // Wall line
    if (style === 'barrier') {
      ctx.strokeStyle = isSel ? '#f59e0b' : '#94a3b8';
      ctx.lineWidth = isSel ? 5 : 3;
      ctx.lineCap = 'round';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(toScreen(w.x1), toScreen(w.y1));
      ctx.lineTo(toScreen(w.x2), toScreen(w.y2));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (style === 'load-bearing') {
      // Thicker line with hatching pattern for load-bearing walls
      ctx.strokeStyle = isSel ? '#f59e0b' : '#e2b15a';
      ctx.lineWidth = isSel ? 10 : 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(toScreen(w.x1), toScreen(w.y1));
      ctx.lineTo(toScreen(w.x2), toScreen(w.y2));
      ctx.stroke();
      // Inner line to create double-line effect
      ctx.strokeStyle = '#1a1a1f';
      ctx.lineWidth = isSel ? 6 : 5;
      ctx.beginPath();
      ctx.moveTo(toScreen(w.x1), toScreen(w.y1));
      ctx.lineTo(toScreen(w.x2), toScreen(w.y2));
      ctx.stroke();
    } else {
      ctx.strokeStyle = isSel ? '#f59e0b' : '#c8bea8';
      ctx.lineWidth = isSel ? 8 : 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(toScreen(w.x1), toScreen(w.y1));
      ctx.lineTo(toScreen(w.x2), toScreen(w.y2));
      ctx.stroke();
    }

    // Dimension label
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const mx = toScreen((w.x1 + w.x2) / 2);
    const my = toScreen((w.y1 + w.y2) / 2);
    const angle = Math.atan2(dy, dx);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${len.toFixed(1)}m`,
      mx - Math.sin(angle) * 14,
      my + Math.cos(angle) * 14
    );

    // Endpoints
    ctx.fillStyle = isSel ? '#f59e0b' : 'rgba(255,255,255,0.25)';
    for (const p of [
      { x: w.x1, y: w.y1 },
      { x: w.x2, y: w.y2 },
    ]) {
      ctx.beginPath();
      ctx.arc(toScreen(p.x), toScreen(p.y), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
