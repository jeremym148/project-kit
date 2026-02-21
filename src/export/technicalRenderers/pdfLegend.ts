import type jsPDF from 'jspdf';
import type { TechnicalDomain } from '../../types/pdf';
import {
  drawOutletSymbol, drawSwitchSymbol, drawCeilingLightSymbol, drawElectricalPanelSymbol,
  drawColdWaterSymbol, drawHotWaterSymbol,
  drawDrainSymbol,
  drawRadiatorSymbol, drawGasSupplySymbol, drawBoilerSymbol,
} from './symbols';

interface LegendItem {
  draw: (doc: jsPDF, x: number, y: number, size: number) => void;
  label: string;
}

const LEGENDS: Record<TechnicalDomain, LegendItem[]> = {
  electrical: [
    { draw: drawOutletSymbol, label: 'Prise de courant' },
    { draw: drawSwitchSymbol, label: 'Interrupteur' },
    { draw: drawCeilingLightSymbol, label: 'Point lumineux' },
    { draw: drawElectricalPanelSymbol, label: 'Tableau électrique' },
  ],
  plumbing: [
    { draw: drawColdWaterSymbol, label: 'Eau froide (EF)' },
    { draw: drawHotWaterSymbol, label: 'Eau chaude (EC)' },
  ],
  drainage: [
    { draw: (d, x, y, s) => drawDrainSymbol(d, x, y, s, 'PVC'), label: 'Point d\'évacuation' },
  ],
  heating: [
    { draw: drawRadiatorSymbol, label: 'Radiateur' },
    { draw: drawGasSupplySymbol, label: 'Arrivée de gaz' },
    { draw: drawBoilerSymbol, label: 'Chaudière' },
  ],
};

const LEGEND_W = 55;
const ROW_H = 10;
const MARGIN = 14;

/** Draw a legend box for a technical plan domain */
export function renderLegend(doc: jsPDF, domain: TechnicalDomain, _pageW: number, pageH: number): void {
  const items = LEGENDS[domain];
  if (!items || items.length === 0) return;

  const legendH = items.length * ROW_H + 12;
  const x = MARGIN + 3;
  const y = pageH - MARGIN - legendH - 75; // above scale bar area

  // Background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, LEGEND_W, legendH, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text('LÉGENDE', x + LEGEND_W / 2, y + 5, { align: 'center' });

  // Items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const iy = y + 10 + i * ROW_H;

    // Draw symbol
    item.draw(doc, x + 8, iy + ROW_H / 2 - 1, 2);

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(0);
    doc.text(item.label, x + 16, iy + ROW_H / 2 + 0.5);
  }
}
