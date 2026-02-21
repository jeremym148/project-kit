import type jsPDF from 'jspdf';
import type { FloorPlan } from '../../types';
import type { PdfTransform } from '../../types/pdf';
import { renderWallsLightPdf } from './pdfWallRenderer';
import { renderOpeningsLightPdf } from './pdfOpeningRenderer';

/** Render a light-gray base floor plan for technical plan backgrounds */
export function renderBasePlanPdf(
  doc: jsPDF,
  data: FloorPlan,
  t: PdfTransform
): void {
  renderWallsLightPdf(doc, data.walls, t);
  renderOpeningsLightPdf(doc, data.openings, data.walls, t);
}
