import type { Furniture } from '../../types';
import { toScreen } from '../../utils/geometry';
import { FURNITURE_DEFAULTS } from '../../utils/defaults';

const FURNITURE_COLORS: Record<string, string> = {
  'toilet': '#a78bfa',
  'bed': '#60a5fa',
  'kitchen-counter': '#f97316',
  'armchair': '#34d399',
  'table': '#fbbf24',
  'chair': '#fb923c',
  'shower': '#38bdf8',
  'bathtub': '#818cf8',
  'bathroom-cabinet': '#c084fc',
  'bookshelf': '#a0845c',
  'plant': '#4ade80',
  'cabinet': '#94a3b8',
  'fridge': '#e2e8f0',
};

export function renderFurniture(
  ctx: CanvasRenderingContext2D,
  furniture: Furniture[],
  selectedId: string | null
): void {
  for (const f of furniture) {
    const cx = toScreen(f.cx);
    const cy = toScreen(f.cy);
    const w = toScreen(f.width);
    const d = toScreen(f.depth);
    const isSel = f.id === selectedId;
    const color = isSel ? '#f59e0b' : (FURNITURE_COLORS[f.furnitureType] || '#888');

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.rotation);

    // Background fill
    ctx.fillStyle = isSel ? 'rgba(245,158,11,0.15)' : `${color}22`;
    ctx.fillRect(-w / 2, -d / 2, w, d);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = isSel ? 2.5 : 1.5;
    ctx.strokeRect(-w / 2, -d / 2, w, d);

    // Type-specific details
    drawFurnitureIcon(ctx, f, w, d, color);

    // Label
    ctx.fillStyle = color;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const label = FURNITURE_DEFAULTS[f.furnitureType]?.label || f.furnitureType;
    ctx.fillText(label, 0, d / 2 + 3);

    ctx.restore();
  }
}

function drawFurnitureIcon(
  ctx: CanvasRenderingContext2D,
  f: Furniture,
  w: number,
  d: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  switch (f.furnitureType) {
    case 'toilet': {
      // Bowl shape
      ctx.beginPath();
      ctx.ellipse(0, d * 0.1, w * 0.3, d * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Tank
      ctx.fillRect(-w * 0.3, -d / 2 + 1, w * 0.6, d * 0.2);
      break;
    }
    case 'bed': {
      // Pillow area
      ctx.fillStyle = `${color}44`;
      ctx.fillRect(-w / 2 + 3, -d / 2 + 3, w - 6, d * 0.2);
      ctx.strokeRect(-w / 2 + 3, -d / 2 + 3, w - 6, d * 0.2);
      // Center line
      ctx.beginPath();
      ctx.moveTo(0, -d / 2 + 3);
      ctx.lineTo(0, d / 2 - 3);
      ctx.stroke();
      break;
    }
    case 'kitchen-counter': {
      // Sink circles
      ctx.beginPath();
      ctx.arc(-w * 0.2, 0, Math.min(w, d) * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.2, 0, Math.min(w, d) * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      // Faucet dot
      ctx.beginPath();
      ctx.arc(0, -d * 0.25, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'armchair': {
      // Seat
      ctx.strokeRect(-w * 0.3, -d * 0.3, w * 0.6, d * 0.6);
      // Backrest
      ctx.fillStyle = `${color}44`;
      ctx.fillRect(-w * 0.35, -d / 2 + 2, w * 0.7, d * 0.15);
      break;
    }
    case 'table': {
      // X pattern for table
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, -d / 2 + 4);
      ctx.lineTo(w / 2 - 4, d / 2 - 4);
      ctx.moveTo(w / 2 - 4, -d / 2 + 4);
      ctx.lineTo(-w / 2 + 4, d / 2 - 4);
      ctx.stroke();
      break;
    }
    case 'chair': {
      // Seat
      ctx.strokeRect(-w * 0.35, -d * 0.2, w * 0.7, d * 0.5);
      // Backrest
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -d * 0.35);
      ctx.lineTo(w * 0.35, -d * 0.35);
      ctx.stroke();
      break;
    }
    case 'shower': {
      // Shower tray with drain
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, d) * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      // Water lines
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, -d * 0.3);
      ctx.lineTo(-w * 0.2, d * 0.3);
      ctx.moveTo(0, -d * 0.3);
      ctx.lineTo(0, d * 0.3);
      ctx.moveTo(w * 0.2, -d * 0.3);
      ctx.lineTo(w * 0.2, d * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case 'bathtub': {
      // Tub outline (rounded inner)
      const rx = w * 0.35;
      const ry = d * 0.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Faucet
      ctx.beginPath();
      ctx.arc(0, -d * 0.35, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bathroom-cabinet': {
      // Sink basin
      ctx.beginPath();
      ctx.ellipse(0, -d * 0.1, w * 0.25, d * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Faucet
      ctx.beginPath();
      ctx.arc(0, -d * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Cabinet line
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, d * 0.2);
      ctx.lineTo(w * 0.4, d * 0.2);
      ctx.stroke();
      break;
    }
    case 'bookshelf': {
      // Shelf lines
      const shelves = 4;
      for (let i = 1; i < shelves; i++) {
        const sy = -d / 2 + (d / shelves) * i;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, sy);
        ctx.lineTo(w * 0.4, sy);
        ctx.stroke();
      }
      break;
    }
    case 'plant': {
      // Pot
      ctx.fillStyle = `${color}44`;
      ctx.fillRect(-w * 0.25, d * 0.05, w * 0.5, d * 0.35);
      ctx.strokeRect(-w * 0.25, d * 0.05, w * 0.5, d * 0.35);
      // Leaves (circle)
      ctx.beginPath();
      ctx.arc(0, -d * 0.1, Math.min(w, d) * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'cabinet': {
      // Door line
      ctx.beginPath();
      ctx.moveTo(0, -d * 0.4);
      ctx.lineTo(0, d * 0.4);
      ctx.stroke();
      // Handles
      ctx.beginPath();
      ctx.arc(-w * 0.08, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.08, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'fridge': {
      // Door split (top freezer)
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -d * 0.1);
      ctx.lineTo(w * 0.4, -d * 0.1);
      ctx.stroke();
      // Handle
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, -d * 0.3);
      ctx.lineTo(w * 0.3, d * 0.3);
      ctx.stroke();
      break;
    }
  }
}
