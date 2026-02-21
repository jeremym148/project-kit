import type jsPDF from 'jspdf';
import type { PdfTransform } from '../types/pdf';

const MARGIN = 10;
const INNER_MARGIN = 12;

/** Draw professional double-line border around the page */
export function renderPdfBorder(doc: jsPDF, t: PdfTransform): void {
  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN, MARGIN, t.pageW - MARGIN * 2, t.pageH - MARGIN * 2);

  // Inner border (thinner)
  doc.setLineWidth(0.15);
  doc.rect(INNER_MARGIN, INNER_MARGIN, t.pageW - INNER_MARGIN * 2, t.pageH - INNER_MARGIN * 2);
}
