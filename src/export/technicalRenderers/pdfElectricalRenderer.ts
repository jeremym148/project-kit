import type jsPDF from 'jspdf';
import type { TechnicalPoint, PdfTransform } from '../../types/pdf';
import {
  drawOutletSymbol,
  drawSwitchSymbol,
  drawCeilingLightSymbol,
  drawElectricalPanelSymbol,
} from './symbols';

/** Render all electrical points on the PDF */
export function renderElectricalPlan(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  for (const p of points) {
    const x = t.toX(p.cx);
    const y = t.toY(p.cy);

    switch (p.pointType) {
      case 'outlet':
        drawOutletSymbol(doc, x, y, 2.5);
        break;
      case 'switch':
        drawSwitchSymbol(doc, x, y, 2.5);
        break;
      case 'ceiling-light':
        drawCeilingLightSymbol(doc, x, y, 3);
        break;
      case 'electrical-panel':
        drawElectricalPanelSymbol(doc, x, y, 3);
        break;
    }
  }

  // Draw dashed lines connecting switches to their nearest ceiling light
  connectSwitchesToLights(doc, points, t);
}

/** Draw light dashed lines from switches to their nearest ceiling lights */
function connectSwitchesToLights(
  doc: jsPDF,
  points: TechnicalPoint[],
  t: PdfTransform
): void {
  const switches = points.filter((p) => p.pointType === 'switch');
  const lights = points.filter((p) => p.pointType === 'ceiling-light');

  if (lights.length === 0) return;

  doc.setDrawColor(100);
  doc.setLineWidth(0.08);
  doc.setLineDashPattern([1, 1.5], 0);

  for (const sw of switches) {
    // Find nearest ceiling light
    let nearestLight = lights[0]!;
    let nearestDist = Infinity;
    for (const light of lights) {
      const dist = Math.sqrt((sw.cx - light.cx) ** 2 + (sw.cy - light.cy) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestLight = light;
      }
    }

    doc.line(
      t.toX(sw.cx), t.toY(sw.cy),
      t.toX(nearestLight.cx), t.toY(nearestLight.cy)
    );
  }

  doc.setLineDashPattern([], 0);
}
