import { GRID_SIZE, toScreen } from '../../utils/geometry';

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panX: number,
  panY: number,
  zoom = 1
): void {
  const gp = toScreen(GRID_SIZE);
  const viewW = width / zoom;
  const viewH = height / zoom;
  const vpX = panX / zoom;
  const vpY = panY / zoom;

  // Sub-grid (0.5m) — hide when zoomed out too much
  if (zoom >= 0.4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1 / zoom;
    for (let x = -vpX - gp; x < viewW - vpX; x += gp) {
      const sx = Math.round(x / gp) * gp;
      ctx.beginPath();
      ctx.moveTo(sx, -vpY);
      ctx.lineTo(sx, viewH - vpY);
      ctx.stroke();
    }
    for (let y = -vpY - gp; y < viewH - vpY; y += gp) {
      const sy = Math.round(y / gp) * gp;
      ctx.beginPath();
      ctx.moveTo(-vpX, sy);
      ctx.lineTo(viewW - vpX, sy);
      ctx.stroke();
    }
  }

  // Main grid (1m)
  const mp = toScreen(1);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1 / zoom;
  for (let x = -vpX - mp; x < viewW - vpX; x += mp) {
    const sx = Math.round(x / mp) * mp;
    ctx.beginPath();
    ctx.moveTo(sx, -vpY);
    ctx.lineTo(sx, viewH - vpY);
    ctx.stroke();
  }
  for (let y = -vpY - mp; y < viewH - vpY; y += mp) {
    const sy = Math.round(y / mp) * mp;
    ctx.beginPath();
    ctx.moveTo(-vpX, sy);
    ctx.lineTo(viewW - vpX, sy);
    ctx.stroke();
  }
}
