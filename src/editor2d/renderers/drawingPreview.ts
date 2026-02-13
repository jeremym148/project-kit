import type { DrawingState } from '../../types/tools';
import { toScreen } from '../../utils/geometry';

export function renderDrawingPreview(
  ctx: CanvasRenderingContext2D,
  drawing: DrawingState
): void {
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(toScreen(drawing.x1), toScreen(drawing.y1));
  ctx.lineTo(toScreen(drawing.x2), toScreen(drawing.y2));
  ctx.stroke();
  ctx.setLineDash([]);

  // Length label
  const dx = drawing.x2 - drawing.x1;
  const dy = drawing.y2 - drawing.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${len.toFixed(1)}m`,
    toScreen((drawing.x1 + drawing.x2) / 2),
    toScreen((drawing.y1 + drawing.y2) / 2) - 16
  );
}
