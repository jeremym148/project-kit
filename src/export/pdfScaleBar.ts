import type jsPDF from 'jspdf';
import type { PdfTransform } from '../types/pdf';

const MARGIN = 14;
const BAR_H = 3;

/** Draw a graduated scale bar in the bottom-left */
export function renderPdfScaleBar(doc: jsPDF, t: PdfTransform): void {
  const y = t.pageH - MARGIN - 8;
  const x = MARGIN + 5;

  // Determine a nice total length for the scale bar
  // Pick between 1m, 2m, 5m, 10m based on what fits reasonably
  const candidates = [1, 2, 5, 10];
  let totalM = 5;
  for (const c of candidates) {
    const barW = t.toLen(c);
    if (barW >= 30 && barW <= 120) {
      totalM = c;
      break;
    }
  }

  const barW = t.toLen(totalM);
  const divisions = totalM <= 2 ? totalM * 2 : totalM;
  const divW = barW / divisions;

  // Draw alternating black/white segments
  for (let i = 0; i < divisions; i++) {
    const dx = x + i * divW;
    if (i % 2 === 0) {
      doc.setFillColor(0, 0, 0);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(dx, y, divW, BAR_H, 'FD');
  }

  // Outline
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(x, y, barW, BAR_H);

  // Labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text('0', x, y - 1);
  doc.text(`${totalM}m`, x + barW - 2, y - 1);

  // Mid-point label
  if (totalM > 1) {
    const midM = totalM / 2;
    doc.text(`${midM}`, x + barW / 2, y - 1, { align: 'center' });
  }

  // Scale text below
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`Échelle 1:${t.archScale}`, x, y + BAR_H + 4);
}

/** Draw a north arrow in the top-right area */
export function renderPdfNorthArrow(doc: jsPDF, t: PdfTransform): void {
  const cx = t.pageW - 30;
  const cy = 30;
  const size = 8;

  // Arrow shaft
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(cx, cy + size, cx, cy - size);

  // Arrowhead (filled triangle)
  doc.setFillColor(0, 0, 0);
  const headW = 3;
  doc.triangle(
    cx, cy - size,
    cx - headW, cy - size + 5,
    cx + headW, cy - size + 5,
    'F'
  );

  // "N" label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('N', cx, cy - size - 3, { align: 'center' });
}
