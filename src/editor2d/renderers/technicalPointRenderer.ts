import type { TechnicalPoint, TechnicalDomain } from '../../types';
import { toScreen } from '../../utils/geometry';
import { TECHNICAL_POINT_DEFAULTS } from '../../utils/defaults';

const DOMAIN_COLORS: Record<TechnicalDomain, string> = {
  electrical: '#f59e0b', // amber
  plumbing:   '#3b82f6', // blue
  drainage:   '#92400e', // brown
  heating:    '#ef4444', // red
};

const SYMBOL_RADIUS = 8;

export function renderTechnicalPoints(
  ctx: CanvasRenderingContext2D,
  points: TechnicalPoint[],
  selectedId: string | null
): void {
  for (const pt of points) {
    const cx = toScreen(pt.cx);
    const cy = toScreen(pt.cy);
    const isSel = pt.id === selectedId;
    const color = isSel ? '#f59e0b' : DOMAIN_COLORS[pt.domain];
    const r = SYMBOL_RADIUS;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(pt.rotation);

    // Selection highlight
    if (isSel) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,158,11,0.15)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw symbol
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;

    switch (pt.pointType) {
      case 'outlet':
        drawOutlet(ctx, r, color);
        break;
      case 'switch':
        drawSwitch(ctx, r, color);
        break;
      case 'ceiling-light':
        drawCeilingLight(ctx, r, color);
        break;
      case 'wall-light':
        drawWallLight(ctx, r, color);
        break;
      case 'electrical-panel':
        drawPanel(ctx, r, color);
        break;
      case 'water-supply-cold':
        drawWaterSupply(ctx, r, color, false);
        break;
      case 'water-supply-hot':
        drawWaterSupply(ctx, r, color, true);
        break;
      case 'drain':
        drawDrain(ctx, r, color);
        break;
      case 'gas-supply':
        drawGasSupply(ctx, r, color);
        break;
      case 'radiator':
        drawRadiator(ctx, r, color);
        break;
      case 'boiler':
        drawBoiler(ctx, r, color);
        break;
    }

    // Label below symbol
    ctx.rotate(-pt.rotation); // un-rotate for text
    const label = pt.label || TECHNICAL_POINT_DEFAULTS[pt.pointType].label;
    ctx.fillStyle = color;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, 0, r + 3);

    ctx.restore();
  }
}

function drawOutlet(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Circle with two vertical bars (plug symbol)
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(-3, 4);
  ctx.moveTo(3, -4);
  ctx.lineTo(3, 4);
  ctx.stroke();
}

function drawSwitch(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Circle with diagonal line (switch symbol)
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.lineTo(4, -4);
  ctx.stroke();
  // dot at base
  ctx.beginPath();
  ctx.arc(-4, 4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCeilingLight(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Circle with rays (sun-like)
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
  }
}

function drawWallLight(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Half circle (wall-mounted)
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // rays
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    const angle = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.65, Math.sin(angle) * r * 0.65);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
  }
}

function drawPanel(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Rectangle with grid lines
  ctx.strokeRect(-r, -r * 0.8, r * 2, r * 1.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.lineTo(0, r * 0.8);
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
}

function drawWaterSupply(ctx: CanvasRenderingContext2D, r: number, color: string, hot: boolean): void {
  // Triangle (pointing down)
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r * 0.8, r * 0.6);
  ctx.lineTo(r * 0.8, r * 0.6);
  ctx.closePath();
  ctx.stroke();
  if (hot) {
    ctx.fillStyle = color + '44';
    ctx.fill();
  }
}

function drawDrain(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Circle with X
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.5);
  ctx.lineTo(r * 0.5, r * 0.5);
  ctx.moveTo(r * 0.5, -r * 0.5);
  ctx.lineTo(-r * 0.5, r * 0.5);
  ctx.stroke();
}

function drawGasSupply(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.7, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.7, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = color + '33';
  ctx.fill();
}

function drawRadiator(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Horizontal rectangle with vertical lines (radiator fins)
  const hw = r * 1.2;
  const hh = r * 0.6;
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.lineWidth = 1;
  const fins = 5;
  for (let i = 1; i < fins; i++) {
    const x = -hw + (hw * 2 / fins) * i;
    ctx.beginPath();
    ctx.moveTo(x, -hh);
    ctx.lineTo(x, hh);
    ctx.stroke();
  }
}

function drawBoiler(ctx: CanvasRenderingContext2D, r: number, _color: string): void {
  // Rectangle with flame
  ctx.strokeRect(-r * 0.8, -r, r * 1.6, r * 2);
  // Flame icon
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.3);
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.1, 0, -r * 0.5);
  ctx.quadraticCurveTo(r * 0.3, -r * 0.1, 0, r * 0.3);
  ctx.stroke();
}
