import type { Terrain } from '../../types';
import { toScreen } from '../../utils/geometry';

export function renderTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain
): void {
  const x = toScreen(terrain.offsetX);
  const y = toScreen(terrain.offsetY);
  const w = toScreen(terrain.width);
  const d = toScreen(terrain.depth);

  // Terrain fill (subtle green)
  ctx.fillStyle = 'rgba(74,222,128,0.04)';
  ctx.fillRect(x, y, w, d);

  // Dashed border
  ctx.strokeStyle = 'rgba(74,222,128,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, w, d);
  ctx.setLineDash([]);

  // Corner markers
  ctx.fillStyle = 'rgba(74,222,128,0.5)';
  const cs = 5;
  ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs);
  ctx.fillRect(x + w - cs / 2, y - cs / 2, cs, cs);
  ctx.fillRect(x - cs / 2, y + d - cs / 2, cs, cs);
  ctx.fillRect(x + w - cs / 2, y + d - cs / 2, cs, cs);

  // Dimensions text
  ctx.fillStyle = 'rgba(74,222,128,0.4)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${terrain.width.toFixed(1)}m`, x + w / 2, y - 4);
  ctx.save();
  ctx.translate(x - 4, y + d / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${terrain.depth.toFixed(1)}m`, 0, 0);
  ctx.restore();

  // Area
  const area = terrain.width * terrain.depth;
  ctx.textBaseline = 'top';
  ctx.fillText(`Terrain: ${area.toFixed(1)}m²`, x + w / 2, y + d + 4);
}
