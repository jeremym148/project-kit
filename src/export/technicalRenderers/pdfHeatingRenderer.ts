import type jsPDF from 'jspdf';
import type { TechnicalPoint, PdfTransform } from '../../types/pdf';
import { drawRadiatorSymbol, drawGasSupplySymbol, drawBoilerSymbol } from './symbols';

/** Render all heating/gas points on the PDF */
export function renderHeatingPlan(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  // Draw heating circuit lines first
  drawHeatingCircuit(doc, points, t);

  // Draw symbols
  for (const p of points) {
    const x = t.toX(p.cx);
    const y = t.toY(p.cy);

    switch (p.pointType) {
      case 'radiator':
        drawRadiatorSymbol(doc, x, y, 2.5);
        break;
      case 'gas-supply':
        drawGasSupplySymbol(doc, x, y, 3);
        break;
      case 'boiler':
        drawBoilerSymbol(doc, x, y, 3);
        break;
    }
  }
}

/** Draw orange dashed lines connecting boiler to radiators */
function drawHeatingCircuit(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  const boiler = points.find((p) => p.pointType === 'boiler');
  const radiators = points.filter((p) => p.pointType === 'radiator');
  const gasSources = points.filter((p) => p.pointType === 'gas-supply');

  if (!boiler) return;

  // Gas line to boiler (yellow dashed)
  for (const gas of gasSources) {
    doc.setDrawColor(200, 160, 0);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 1], 0);
    doc.line(t.toX(gas.cx), t.toY(gas.cy), t.toX(boiler.cx), t.toY(boiler.cy));
  }

  // Heating circuit: boiler → radiators (orange dashed)
  doc.setDrawColor(200, 80, 30);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([1.5, 1], 0);

  for (const rad of radiators) {
    doc.line(t.toX(boiler.cx), t.toY(boiler.cy), t.toX(rad.cx), t.toY(rad.cy));
  }

  doc.setLineDashPattern([], 0);
}
