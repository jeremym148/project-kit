import type { RoomLabel, FloorMaterial } from '../../types';
import { toScreen } from '../../utils/geometry';

const floorMaterialLabels: Record<FloorMaterial, string> = {
  parquet: '▤ Parquet',
  carrelage: '▦ Carrelage',
  pelouse: '▧ Pelouse',
};

// Canvas pattern cache (created once, reused)
const patternCache = new Map<string, CanvasPattern | null>();

function getParquetPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (patternCache.has('parquet')) return patternCache.get('parquet')!;
  const c = document.createElement('canvas');
  c.width = 20;
  c.height = 10;
  const pc = c.getContext('2d')!;
  // Light wood plank pattern
  pc.fillStyle = '#c4a06a';
  pc.fillRect(0, 0, 20, 10);
  pc.fillStyle = '#b8935e';
  pc.fillRect(0, 0, 9, 10);
  // Grain lines
  pc.strokeStyle = '#a8844e';
  pc.lineWidth = 0.5;
  pc.beginPath();
  pc.moveTo(2, 0); pc.lineTo(3, 10);
  pc.moveTo(6, 0); pc.lineTo(5, 10);
  pc.moveTo(12, 0); pc.lineTo(13, 10);
  pc.moveTo(16, 0); pc.lineTo(15, 10);
  pc.stroke();
  // Plank gap
  pc.strokeStyle = '#8a6e3e';
  pc.lineWidth = 0.8;
  pc.beginPath();
  pc.moveTo(9.5, 0); pc.lineTo(9.5, 10);
  pc.stroke();
  const pat = ctx.createPattern(c, 'repeat');
  patternCache.set('parquet', pat);
  return pat;
}

function getCarrelagePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (patternCache.has('carrelage')) return patternCache.get('carrelage')!;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const pc = c.getContext('2d')!;
  // Tile base
  pc.fillStyle = '#c8cdd3';
  pc.fillRect(0, 0, 16, 16);
  // Slight gradient variation between tiles
  pc.fillStyle = '#bfc5cc';
  pc.fillRect(0, 0, 7, 7);
  pc.fillStyle = '#d0d4d9';
  pc.fillRect(9, 9, 7, 7);
  // Grout lines
  pc.strokeStyle = '#9aa0a8';
  pc.lineWidth = 0.8;
  pc.beginPath();
  pc.moveTo(8, 0); pc.lineTo(8, 16);
  pc.moveTo(0, 8); pc.lineTo(16, 8);
  pc.stroke();
  const pat = ctx.createPattern(c, 'repeat');
  patternCache.set('carrelage', pat);
  return pat;
}

function getPelousePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (patternCache.has('pelouse')) return patternCache.get('pelouse')!;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const pc = c.getContext('2d')!;
  // Base grass
  pc.fillStyle = '#5a8f4a';
  pc.fillRect(0, 0, 12, 12);
  // Darker patches
  pc.fillStyle = '#4d7a3f';
  pc.fillRect(2, 1, 3, 3);
  pc.fillRect(8, 7, 3, 3);
  // Lighter patches
  pc.fillStyle = '#6b9e5a';
  pc.fillRect(6, 3, 3, 2);
  pc.fillRect(0, 8, 3, 2);
  // Tiny grass blades
  pc.strokeStyle = '#4a7338';
  pc.lineWidth = 0.6;
  pc.beginPath();
  pc.moveTo(1, 6); pc.lineTo(1.5, 4);
  pc.moveTo(5, 9); pc.lineTo(5.5, 7);
  pc.moveTo(9, 2); pc.lineTo(9.5, 0.5);
  pc.moveTo(7, 11); pc.lineTo(7.5, 9.5);
  pc.stroke();
  const pat = ctx.createPattern(c, 'repeat');
  patternCache.set('pelouse', pat);
  return pat;
}

function getFloorPattern(
  ctx: CanvasRenderingContext2D,
  material: FloorMaterial
): CanvasPattern | null {
  switch (material) {
    case 'parquet': return getParquetPattern(ctx);
    case 'carrelage': return getCarrelagePattern(ctx);
    case 'pelouse': return getPelousePattern(ctx);
  }
}

export function renderLabels(
  ctx: CanvasRenderingContext2D,
  labels: RoomLabel[],
  selectedId: string | null,
  showDetails = true
): void {
  // First pass: render floor material fills (behind everything)
  for (const label of labels) {
    if (!label.floorMaterial) continue;

    const pattern = getFloorPattern(ctx, label.floorMaterial);

    if (label.polygon && label.polygon.length >= 3) {
      // Fill room polygon with pattern
      ctx.save();
      ctx.globalAlpha = 0.5;
      if (pattern) {
        ctx.fillStyle = pattern;
      } else {
        ctx.fillStyle = 'rgba(128,128,128,0.2)';
      }
      ctx.beginPath();
      ctx.moveTo(toScreen(label.polygon[0]!.x), toScreen(label.polygon[0]!.y));
      for (let i = 1; i < label.polygon.length; i++) {
        ctx.lineTo(toScreen(label.polygon[i]!.x), toScreen(label.polygon[i]!.y));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Second pass: render label text/boxes
  for (const label of labels) {
    const x = toScreen(label.cx);
    const y = toScreen(label.cy);
    const isSelected = label.id === selectedId;

    // When details are hidden, show a small clickable dot
    if (!showDetails && !isSelected) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      // Show name as tiny label
      if (label.name) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label.name, x, y - 7);
      }
      continue;
    }

    // Build display lines
    const lines: string[] = [];
    if (label.name) lines.push(label.name);
    if (label.area > 0) lines.push(`${label.area.toFixed(2)}m²`);
    if (label.floorMaterial) lines.push(floorMaterialLabels[label.floorMaterial]);
    if (lines.length === 0) lines.push('Room');

    const boxW = Math.max(...lines.map((l) => l.length)) * 7 + 16;
    const boxH = lines.length * 14 + 10;

    // Background
    ctx.fillStyle = isSelected
      ? 'rgba(245,158,11,0.2)'
      : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);

    // Selection border
    if (isSelected) {
      ctx.strokeStyle = 'rgba(245,158,11,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
    }

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      const isFloorLine = Object.values(floorMaterialLabels).includes(line);
      const isAreaLine = line.endsWith('m²');
      ctx.fillStyle = isFloorLine
        ? 'rgba(139,92,246,0.7)'
        : isAreaLine
          ? 'rgba(245,158,11,0.7)'
          : 'rgba(255,255,255,0.6)';
      ctx.font = isFloorLine ? '9px monospace' : isAreaLine ? '10px monospace' : 'bold 11px monospace';
      ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * 14);
    });

    // Draw vertex handles when selected and has polygon
    if (isSelected && label.polygon && label.polygon.length >= 3) {
      const poly = label.polygon;
      // Outline
      ctx.strokeStyle = 'rgba(245,158,11,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toScreen(poly[0]!.x), toScreen(poly[0]!.y));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(toScreen(poly[i]!.x), toScreen(poly[i]!.y));
      }
      ctx.closePath();
      ctx.stroke();

      // Vertex handles
      for (const v of poly) {
        const vx = toScreen(v.x);
        const vy = toScreen(v.y);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}
