import type jsPDF from 'jspdf';
import type { Wall } from '../../types';
import type { PdfTransform } from '../../types/pdf';

/** Render walls with professional line weights */
export function renderWallsPdf(
  doc: jsPDF,
  walls: Wall[],
  t: PdfTransform
): void {
  for (const w of walls) {
    const x1 = t.toX(w.x1);
    const y1 = t.toY(w.y1);
    const x2 = t.toX(w.x2);
    const y2 = t.toY(w.y2);
    const style = w.wallStyle || 'standard';

    if (style === 'barrier') {
      // Dashed, thinner gray line
      doc.setDrawColor(120);
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.line(x1, y1, x2, y2);
      doc.setLineDashPattern([], 0);
    } else if (style === 'load-bearing') {
      // Thick black line with cross-hatching
      doc.setDrawColor(0);
      doc.setLineWidth(0.7);
      doc.line(x1, y1, x2, y2);

      // Hatching inside the wall thickness
      renderWallHatching(doc, w, t);
    } else {
      // Standard wall — solid black
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(x1, y1, x2, y2);
    }
  }
}

/** Render walls in light gray (for technical plan backgrounds) */
export function renderWallsLightPdf(
  doc: jsPDF,
  walls: Wall[],
  t: PdfTransform
): void {
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([], 0);

  for (const w of walls) {
    doc.line(t.toX(w.x1), t.toY(w.y1), t.toX(w.x2), t.toY(w.y2));
  }
}

/** Cross-hatching for load-bearing walls */
function renderWallHatching(doc: jsPDF, w: Wall, t: PdfTransform): void {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;

  const nx = -dy / len;
  const ny = dx / len;
  const halfT = (w.thickness || 0.15) / 2;
  const spacing = 0.15; // hatching spacing in meters
  const steps = Math.floor(len / spacing);

  doc.setDrawColor(0);
  doc.setLineWidth(0.1);

  for (let i = 1; i < steps; i++) {
    const frac = i / steps;
    const cx = w.x1 + dx * frac;
    const cy = w.y1 + dy * frac;

    // 45-degree hatching lines across the wall thickness
    const hx1 = t.toX(cx + nx * halfT);
    const hy1 = t.toY(cy + ny * halfT);
    const hx2 = t.toX(cx - nx * halfT);
    const hy2 = t.toY(cy - ny * halfT);
    doc.line(hx1, hy1, hx2, hy2);
  }
}
