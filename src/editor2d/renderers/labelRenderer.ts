import type { RoomLabel, FloorMaterial } from '../../types';
import { toScreen } from '../../utils/geometry';

const floorMaterialLabels: Record<FloorMaterial, string> = {
  parquet: '▤ Parquet',
  carrelage: '▦ Carrelage',
  pelouse: '▧ Pelouse',
};

export function renderLabels(
  ctx: CanvasRenderingContext2D,
  labels: RoomLabel[],
  selectedId: string | null,
  showDetails = true
): void {
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
  }
}
