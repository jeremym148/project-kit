import type jsPDF from 'jspdf';
import type { FloorPlan } from '../../types';
import type { PdfTransform } from '../../types/pdf';
import { renderWallsPdf } from './pdfWallRenderer';
import { renderOpeningsPdf } from './pdfOpeningRenderer';
import { renderLabelsPdf } from './pdfLabelRenderer';
import { renderFurniturePdf } from './pdfFurnitureRenderer';
import { renderDimensionLines } from '../pdfDimensionLines';

/** Render the full architectural plan (Page 1) */
export function renderArchitecturalPlan(
  doc: jsPDF,
  data: FloorPlan,
  t: PdfTransform
): void {
  // Layer 1: Floor material hatching + room labels (bottom layer)
  renderLabelsPdf(doc, data.labels, t);

  // Layer 2: Furniture (light gray, behind walls)
  if (data.furniture?.length) {
    renderFurniturePdf(doc, data.furniture, t);
  }

  // Layer 3: Walls (main structural elements)
  renderWallsPdf(doc, data.walls, t);

  // Layer 4: Openings (doors, windows — on top of walls)
  renderOpeningsPdf(doc, data.openings, data.walls, t);

  // Layer 5: Dimension lines (outermost layer)
  renderDimensionLines(doc, data.walls, t);
}
