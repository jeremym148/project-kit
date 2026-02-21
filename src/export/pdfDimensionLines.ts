import type jsPDF from 'jspdf';
import type { Wall } from '../types';
import type { PdfTransform, DimensionLine } from '../types/pdf';

const TICK_SIZE = 1.5;       // mm — 45-degree tick length
const EXTENSION_GAP = 1;      // mm — gap between wall face and extension line
const EXTENSION_OVERSHOOT = 1.5; // mm — extension past dimension line

/** Compute and render professional dimension lines for all walls + overall */
export function renderDimensionLines(
  doc: jsPDF,
  walls: Wall[],
  t: PdfTransform
): void {
  const dims = computeWallDimensions(walls);

  doc.setDrawColor(0);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);

  for (const dim of dims) {
    renderSingleDimensionLine(doc, dim, t);
  }
}

/** Compute dimension lines for all walls with smart offset levels */
function computeWallDimensions(walls: Wall[]): DimensionLine[] {
  if (walls.length === 0) return [];

  const dims: DimensionLine[] = [];

  // Compute plan bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.x1, w.x2);
    minY = Math.min(minY, w.y1, w.y2);
    maxX = Math.max(maxX, w.x1, w.x2);
    maxY = Math.max(maxY, w.y1, w.y2);
  }

  const boundsW = maxX - minX;
  const boundsH = maxY - minY;
  if (boundsW < 0.1 || boundsH < 0.1) return [];

  const planCx = (minX + maxX) / 2;
  const planCy = (minY + maxY) / 2;

  // Perimeter detection tolerance
  const EDGE_TOL = Math.min(boundsW, boundsH) * 0.08 + 0.25;
  const MIN_LEN = 0.3;                // skip walls shorter than 30cm
  const PERIMETER_OFFSET = 0.7;       // meters — perimeter wall dims
  const INTERIOR_OFFSET = 0.4;        // meters — interior wall dims (closer)
  const OVERALL_OFFSET = 1.3;         // meters — overall building dims

  for (const w of walls) {
    // Skip barriers (garde-corps) — not structural
    if (w.wallStyle === 'barrier') continue;

    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < MIN_LEN) continue;

    const midX = (w.x1 + w.x2) / 2;
    const midY = (w.y1 + w.y2) / 2;

    // Determine if wall is on the perimeter
    const onPerimeter =
      Math.abs(midY - minY) < EDGE_TOL ||
      Math.abs(midY - maxY) < EDGE_TOL ||
      Math.abs(midX - minX) < EDGE_TOL ||
      Math.abs(midX - maxX) < EDGE_TOL;

    // Perpendicular direction
    const nx = -dy / len;
    const ny = dx / len;

    // Push dimension to the side AWAY from plan center
    const distToCenter = (midX + nx - planCx) ** 2 + (midY + ny - planCy) ** 2;
    const distOpposite = (midX - nx - planCx) ** 2 + (midY - ny - planCy) ** 2;

    const dimOffset = onPerimeter ? PERIMETER_OFFSET : INTERIOR_OFFSET;
    const offset = distToCenter > distOpposite ? dimOffset : -dimOffset;

    dims.push({
      x1: w.x1, y1: w.y1,
      x2: w.x2, y2: w.y2,
      offset,
      label: `${len.toFixed(2)}`,
    });
  }

  // ── Overall building dimensions ──

  // Total width (horizontal) — below the bottom edge
  dims.push({
    x1: minX, y1: maxY,
    x2: maxX, y2: maxY,
    offset: OVERALL_OFFSET,
    label: `${boundsW.toFixed(2)}`,
  });

  // Total height (vertical) — to the left of the left edge
  dims.push({
    x1: minX, y1: minY,
    x2: minX, y2: maxY,
    offset: -OVERALL_OFFSET,
    label: `${boundsH.toFixed(2)}`,
  });

  return dims;
}

/** Render a single professional dimension line */
function renderSingleDimensionLine(
  doc: jsPDF,
  dim: DimensionLine,
  t: PdfTransform
): void {
  const dx = dim.x2 - dim.x1;
  const dy = dim.y2 - dim.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;

  // Direction and perpendicular
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const offset = dim.offset;
  const sign = offset > 0 ? 1 : -1;
  const absOffset = Math.abs(offset);

  // Extension line start (gap from wall face) and end (past dimension line)
  const gapM = EXTENSION_GAP / t.scale;
  const overshootM = EXTENSION_OVERSHOOT / t.scale;

  // Point 1 extension line
  const e1_start_x = dim.x1 + nx * sign * gapM;
  const e1_start_y = dim.y1 + ny * sign * gapM;
  const e1_end_x = dim.x1 + nx * sign * (absOffset + overshootM);
  const e1_end_y = dim.y1 + ny * sign * (absOffset + overshootM);

  // Point 2 extension line
  const e2_start_x = dim.x2 + nx * sign * gapM;
  const e2_start_y = dim.y2 + ny * sign * gapM;
  const e2_end_x = dim.x2 + nx * sign * (absOffset + overshootM);
  const e2_end_y = dim.y2 + ny * sign * (absOffset + overshootM);

  // Dimension line endpoints (at offset distance)
  const d1_x = dim.x1 + nx * sign * absOffset;
  const d1_y = dim.y1 + ny * sign * absOffset;
  const d2_x = dim.x2 + nx * sign * absOffset;
  const d2_y = dim.y2 + ny * sign * absOffset;

  // Draw extension lines (very thin)
  doc.setLineWidth(0.08);
  doc.line(t.toX(e1_start_x), t.toY(e1_start_y), t.toX(e1_end_x), t.toY(e1_end_y));
  doc.line(t.toX(e2_start_x), t.toY(e2_start_y), t.toX(e2_end_x), t.toY(e2_end_y));

  // Draw dimension line
  doc.setLineWidth(0.08);
  doc.line(t.toX(d1_x), t.toY(d1_y), t.toX(d2_x), t.toY(d2_y));

  // Draw 45-degree tick marks at each end
  const tickAngle = Math.atan2(dy, dx) + Math.PI / 4;
  const tickDx = TICK_SIZE * Math.cos(tickAngle) / 2;
  const tickDy = TICK_SIZE * Math.sin(tickAngle) / 2;

  doc.setLineWidth(0.15);
  // Tick at point 1
  const t1x = t.toX(d1_x);
  const t1y = t.toY(d1_y);
  doc.line(t1x - tickDx, t1y - tickDy, t1x + tickDx, t1y + tickDy);

  // Tick at point 2
  const t2x = t.toX(d2_x);
  const t2y = t.toY(d2_y);
  doc.line(t2x - tickDx, t2y - tickDy, t2x + tickDx, t2y + tickDy);

  // Dimension text (centered on dimension line)
  const textX = (t.toX(d1_x) + t.toX(d2_x)) / 2;
  const textY = (t.toY(d1_y) + t.toY(d2_y)) / 2;

  // Compute angle for perpendicular text offset
  const angle = Math.atan2(
    t.toY(d2_y) - t.toY(d1_y),
    t.toX(d2_x) - t.toX(d1_x)
  );

  // Ensure text is never upside down
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;

  const label = dim.label || `${len.toFixed(2)}`;

  // White background behind text for readability
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const textW = doc.getTextWidth(label) + 1.5;

  // Offset text slightly perpendicular to the dimension line for clarity
  const perpOff = 1.5; // mm offset above dimension line
  const cosP = Math.cos(textAngle - Math.PI / 2);
  const sinP = Math.sin(textAngle - Math.PI / 2);
  const finalX = textX + cosP * perpOff;
  const finalY = textY + sinP * perpOff;

  doc.setFillColor(255, 255, 255);
  doc.rect(finalX - textW / 2, finalY - 2, textW, 3.5, 'F');

  doc.setTextColor(0);
  doc.text(label, finalX, finalY, { align: 'center' });
}
