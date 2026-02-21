import type jsPDF from 'jspdf';
import type { TechnicalPoint, PdfTransform } from '../../types/pdf';
import { drawDrainSymbol } from './symbols';

/** Render all drainage/evacuation points on the PDF */
export function renderDrainagePlan(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  // Draw drain connection lines first
  drawDrainLines(doc, points, t);

  // Draw symbols
  for (const p of points) {
    if (p.pointType === 'drain') {
      const x = t.toX(p.cx);
      const y = t.toY(p.cy);
      drawDrainSymbol(doc, x, y, 2.5, p.label);
    }
  }
}

/** Draw brown dashed lines indicating drainage routes with flow arrows */
function drawDrainLines(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  if (points.length < 2) return;

  // Find the logical "main drain" (biggest pipe, typically toilet)
  const mainDrain = points.reduce((best, p) =>
    (p.pipeSize || 0) > (best.pipeSize || 0) ? p : best
  , points[0]!);

  doc.setDrawColor(160, 82, 45); // brown
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([2, 1], 0);

  for (const p of points) {
    if (p === mainDrain) continue;

    const x1 = t.toX(p.cx);
    const y1 = t.toY(p.cy);
    const x2 = t.toX(mainDrain.cx);
    const y2 = t.toY(mainDrain.cy);

    doc.line(x1, y1, x2, y2);

    // Flow direction arrow (midpoint)
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 1.5;

    doc.setLineDashPattern([], 0);
    doc.setFillColor(160, 82, 45);
    doc.triangle(
      mx + arrowSize * Math.cos(angle),
      my + arrowSize * Math.sin(angle),
      mx + arrowSize * Math.cos(angle + 2.5),
      my + arrowSize * Math.sin(angle + 2.5),
      mx + arrowSize * Math.cos(angle - 2.5),
      my + arrowSize * Math.sin(angle - 2.5),
      'F'
    );
    doc.setLineDashPattern([2, 1], 0);
  }

  doc.setLineDashPattern([], 0);
}
