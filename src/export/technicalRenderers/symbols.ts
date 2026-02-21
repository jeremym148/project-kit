import type jsPDF from 'jspdf';

/** Size of technical symbols in mm */
const S = 3;

// ══════════════════════════════════════
//  ELECTRICAL SYMBOLS (NF C 15-100)
// ══════════════════════════════════════

/** Outlet (prise de courant): circle with two horizontal bars */
export function drawOutletSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(0);
  doc.setLineWidth(0.25);
  doc.circle(x, y, size);
  // Two horizontal bars inside
  doc.line(x - size * 0.6, y - size * 0.3, x + size * 0.6, y - size * 0.3);
  doc.line(x - size * 0.6, y + size * 0.3, x + size * 0.6, y + size * 0.3);
}

/** Switch (interrupteur): circle with angled line */
export function drawSwitchSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(0);
  doc.setLineWidth(0.25);
  doc.circle(x, y, size * 0.8);
  // Angled line (45 degrees outward)
  doc.line(x, y, x + size * 1.2, y - size * 1.2);
  // Small dot at hinge
  doc.setFillColor(0, 0, 0);
  doc.circle(x, y, 0.4, 'F');
}

/** Ceiling light (point lumineux): crossed circle with rays */
export function drawCeilingLightSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.circle(x, y, size);
  // Cross inside
  doc.line(x - size, y, x + size, y);
  doc.line(x, y - size, x, y + size);
  // 4 diagonal rays
  const r = size * 1.4;
  const ri = size;
  for (let a = Math.PI / 4; a < Math.PI * 2; a += Math.PI / 2) {
    doc.line(
      x + ri * Math.cos(a), y + ri * Math.sin(a),
      x + r * Math.cos(a), y + r * Math.sin(a)
    );
  }
}

/** Electrical panel (tableau électrique): rectangle with TE */
export function drawElectricalPanelSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  const w = size * 2.5;
  const h = size * 1.8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(x - w / 2, y - h / 2, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(0);
  doc.text('TE', x, y + 1, { align: 'center' });
}

// ══════════════════════════════════════
//  PLUMBING SYMBOLS
// ══════════════════════════════════════

/** Cold water supply (arrivée eau froide): blue downward triangle */
export function drawColdWaterSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(0, 100, 200);
  doc.setFillColor(0, 100, 200);
  doc.setLineWidth(0.2);
  doc.triangle(
    x, y + size,        // bottom vertex
    x - size, y - size * 0.5, // top-left
    x + size, y - size * 0.5, // top-right
    'FD'
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(0, 100, 200);
  doc.text('EF', x, y - size - 1, { align: 'center' });
}

/** Hot water supply (arrivée eau chaude): red downward triangle */
export function drawHotWaterSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(200, 50, 50);
  doc.setFillColor(200, 50, 50);
  doc.setLineWidth(0.2);
  doc.triangle(
    x, y + size,
    x - size, y - size * 0.5,
    x + size, y - size * 0.5,
    'FD'
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(200, 50, 50);
  doc.text('EC', x, y - size - 1, { align: 'center' });
}

// ══════════════════════════════════════
//  DRAINAGE SYMBOLS
// ══════════════════════════════════════

/** Drain point: circle with X cross */
export function drawDrainSymbol(doc: jsPDF, x: number, y: number, size = S, pipeLabel?: string): void {
  doc.setDrawColor(160, 82, 45);  // brown
  doc.setLineWidth(0.25);
  doc.circle(x, y, size);
  // X cross
  const r = size * 0.7;
  doc.line(x - r, y - r, x + r, y + r);
  doc.line(x + r, y - r, x - r, y + r);

  // Pipe size label
  if (pipeLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4);
    doc.setTextColor(160, 82, 45);
    doc.text(pipeLabel, x, y + size + 2.5, { align: 'center' });
  }
}

// ══════════════════════════════════════
//  HEATING / GAS SYMBOLS
// ══════════════════════════════════════

/** Radiator: rectangle with zigzag interior */
export function drawRadiatorSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  const w = size * 3;
  const h = size * 1.5;
  doc.setDrawColor(200, 80, 30); // orange
  doc.setLineWidth(0.25);
  doc.rect(x - w / 2, y - h / 2, w, h);

  // Zigzag pattern inside
  doc.setLineWidth(0.15);
  const steps = 5;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const sx = x - w / 2 + i * stepW;
    const top = i % 2 === 0 ? y - h * 0.35 : y + h * 0.35;
    const bot = i % 2 === 0 ? y + h * 0.35 : y - h * 0.35;
    doc.line(sx + stepW / 2, top, sx + stepW / 2, bot);
  }
}

/** Gas supply: yellow diamond with G */
export function drawGasSupplySymbol(doc: jsPDF, x: number, y: number, size = S): void {
  doc.setDrawColor(200, 160, 0);
  doc.setFillColor(255, 220, 50);
  doc.setLineWidth(0.3);

  // Diamond (rotated square)
  const s = size * 1.2;
  doc.triangle(x, y - s, x + s, y, x, y + s, 'FD');
  doc.triangle(x, y - s, x - s, y, x, y + s, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(0);
  doc.text('G', x, y + 1.2, { align: 'center' });
}

/** Boiler (chaudière): rectangle with CH */
export function drawBoilerSymbol(doc: jsPDF, x: number, y: number, size = S): void {
  const w = size * 2.5;
  const h = size * 2;
  doc.setDrawColor(200, 80, 30);
  doc.setLineWidth(0.3);
  doc.rect(x - w / 2, y - h / 2, w, h);

  // Inner rectangle
  doc.setLineWidth(0.15);
  doc.rect(x - w / 2 + 0.8, y - h / 2 + 0.8, w - 1.6, h - 1.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(200, 80, 30);
  doc.text('CH', x, y + 1, { align: 'center' });
}
