import type jsPDF from 'jspdf';
import type { TechnicalPoint, PdfTransform } from '../../types/pdf';
import { drawColdWaterSymbol, drawHotWaterSymbol } from './symbols';

/** Render all plumbing (water supply) points on the PDF */
export function renderPlumbingPlan(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  // Draw connection lines first (behind symbols)
  drawWaterLines(doc, points, t);

  // Draw symbols
  for (const p of points) {
    const x = t.toX(p.cx);
    const y = t.toY(p.cy);

    switch (p.pointType) {
      case 'water-supply-cold':
        drawColdWaterSymbol(doc, x, y, 2.5);
        break;
      case 'water-supply-hot':
        drawHotWaterSymbol(doc, x, y, 2.5);
        break;
    }
  }
}

/** Draw dashed lines indicating water supply routes */
function drawWaterLines(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  // Find the main water entry (labeled "Arrivée eau")
  const mainEntry = points.find((p) => p.label === 'Arrivée eau');
  if (!mainEntry) return;

  const coldPoints = points.filter((p) => p.pointType === 'water-supply-cold' && p !== mainEntry);
  const hotPoints = points.filter((p) => p.pointType === 'water-supply-hot');

  // Cold water lines (blue dashed)
  doc.setDrawColor(0, 100, 200);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([1.5, 1], 0);

  for (const p of coldPoints) {
    doc.line(t.toX(mainEntry.cx), t.toY(mainEntry.cy), t.toX(p.cx), t.toY(p.cy));
  }

  // Hot water lines (red dashed)
  doc.setDrawColor(200, 50, 50);
  doc.setLineDashPattern([1.5, 1], 0);

  for (const p of hotPoints) {
    // Connect to nearest cold water point (shared source)
    let source = mainEntry;
    let minDist = Infinity;
    for (const cp of coldPoints) {
      const dist = Math.sqrt((cp.cx - p.cx) ** 2 + (cp.cy - p.cy) ** 2);
      if (dist < minDist && dist < 1) {
        minDist = dist;
        source = cp;
      }
    }
    doc.line(t.toX(source.cx), t.toY(source.cy), t.toX(p.cx), t.toY(p.cy));
  }

  doc.setLineDashPattern([], 0);
}
