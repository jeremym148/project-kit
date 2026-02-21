import type jsPDF from 'jspdf';
import type { Wall, Opening } from '../../types';
import type { PdfTransform } from '../../types/pdf';

/** Render all openings (doors + windows) on the PDF */
export function renderOpeningsPdf(
  doc: jsPDF,
  openings: Opening[],
  walls: Wall[],
  t: PdfTransform
): void {
  for (const o of openings) {
    const w = walls.find((ww) => ww.id === o.wallId);
    if (!w) continue;

    const ox = w.x1 + (w.x2 - w.x1) * o.position;
    const oy = w.y1 + (w.y2 - w.y1) * o.position;
    const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);

    if (o.type === 'door') {
      const style = o.doorStyle || 'standard';
      if (style === 'sliding') {
        renderSlidingDoorPdf(doc, o, ox, oy, angle, t);
      } else if (style === 'french') {
        renderFrenchDoorPdf(doc, o, ox, oy, angle, t);
      } else if (style === 'sliding-glass') {
        renderSlidingGlassDoorPdf(doc, o, ox, oy, angle, t);
      } else if (style === 'arcade') {
        renderArcadePdf(doc, o, ox, oy, angle, t);
      } else {
        renderStandardDoorPdf(doc, o, ox, oy, angle, t);
      }
    } else {
      const wStyle = o.windowStyle || 'standard';
      if (wStyle === 'baie-vitree') {
        renderBaieVitreePdf(doc, o, ox, oy, angle, t);
      } else {
        renderWindowPdf(doc, o, ox, oy, angle, t);
      }
    }
  }
}

/** Render openings in light gray (for technical plan backgrounds) */
export function renderOpeningsLightPdf(
  doc: jsPDF,
  openings: Opening[],
  walls: Wall[],
  t: PdfTransform
): void {
  doc.setDrawColor(180);

  for (const o of openings) {
    const w = walls.find((ww) => ww.id === o.wallId);
    if (!w) continue;

    const ox = w.x1 + (w.x2 - w.x1) * o.position;
    const oy = w.y1 + (w.y2 - w.y1) * o.position;
    const halfW = o.width / 2;
    const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Simple gap representation for light background
    const x1 = t.toX(ox - halfW * cos);
    const y1 = t.toY(oy - halfW * sin);
    const x2 = t.toX(ox + halfW * cos);
    const y2 = t.toY(oy + halfW * sin);

    // Clear the wall line with white
    doc.setDrawColor(255);
    doc.setLineWidth(1);
    doc.line(x1, y1, x2, y2);

    // Draw a thin mark
    doc.setDrawColor(180);
    doc.setLineWidth(0.15);
    if (o.type === 'window') {
      // Double line for windows
      const nx = -sin;
      const ny = cos;
      const off = t.toLen(0.05);
      doc.line(x1 + nx * off, y1 + ny * off, x2 + nx * off, y2 + ny * off);
      doc.line(x1 - nx * off, y1 - ny * off, x2 - nx * off, y2 - ny * off);
    }
  }
}

// ── Helper: rotated coordinates ──

function rotatedPoint(
  cx: number, cy: number,
  dx: number, dy: number,
  angle: number, t: PdfTransform
): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: t.toX(cx + dx * cos - dy * sin),
    y: t.toY(cy + dx * sin + dy * cos),
  };
}

// ── Door Renderers ──

function clearWallGap(
  doc: jsPDF, ox: number, oy: number, halfW: number, angle: number, t: PdfTransform
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // White line to clear the wall
  doc.setDrawColor(255);
  doc.setLineWidth(1.2);
  doc.line(
    t.toX(ox - halfW * cos), t.toY(oy - halfW * sin),
    t.toX(ox + halfW * cos), t.toY(oy + halfW * sin)
  );
}

function renderStandardDoorPdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  const flip = o.flipDoor ?? false;
  const out = o.swingOut ?? false;
  const hingeX = flip ? halfW : -halfW;
  const swingDir = out ? 1 : -1;

  doc.setDrawColor(0);
  doc.setLineWidth(0.15);

  // Door panel line (from hinge perpendicular)
  const hinge = rotatedPoint(ox, oy, hingeX, 0, angle, t);
  const panelEnd = rotatedPoint(ox, oy, hingeX, swingDir * o.width, angle, t);
  doc.line(hinge.x, hinge.y, panelEnd.x, panelEnd.y);

  // Swing arc
  const arcRadius = t.toLen(o.width);

  let arcStart: number;
  let arcEnd: number;

  if (flip && !out) {
    arcStart = angle + Math.PI;
    arcEnd = arcStart + Math.PI / 2;
  } else if (flip && out) {
    arcStart = angle + Math.PI - Math.PI / 2;
    arcEnd = angle + Math.PI;
  } else if (!flip && !out) {
    arcStart = angle - Math.PI / 2;
    arcEnd = angle;
  } else {
    arcStart = angle;
    arcEnd = angle + Math.PI / 2;
  }

  drawArc(doc, hinge.x, hinge.y, arcRadius, arcStart, arcEnd);

  // Hinge point
  doc.setFillColor(0, 0, 0);
  doc.circle(hinge.x, hinge.y, 0.5, 'F');
}

function renderSlidingDoorPdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.25);

  // Two parallel sliding panels
  const p1a = rotatedPoint(ox, oy, -halfW, -0.05, angle, t);
  const p1b = rotatedPoint(ox, oy, halfW * 0.1, -0.05, angle, t);
  doc.line(p1a.x, p1a.y, p1b.x, p1b.y);

  const p2a = rotatedPoint(ox, oy, -halfW * 0.1, 0.05, angle, t);
  const p2b = rotatedPoint(ox, oy, halfW, 0.05, angle, t);
  doc.line(p2a.x, p2a.y, p2b.x, p2b.y);

  // Dashed track lines
  doc.setLineWidth(0.1);
  doc.setLineDashPattern([0.8, 0.8], 0);
  const t1a = rotatedPoint(ox, oy, halfW * 0.1, -0.05, angle, t);
  const t1b = rotatedPoint(ox, oy, halfW, -0.05, angle, t);
  doc.line(t1a.x, t1a.y, t1b.x, t1b.y);

  const t2a = rotatedPoint(ox, oy, -halfW, 0.05, angle, t);
  const t2b = rotatedPoint(ox, oy, -halfW * 0.1, 0.05, angle, t);
  doc.line(t2a.x, t2a.y, t2b.x, t2b.y);
  doc.setLineDashPattern([], 0);

  // End markers
  doc.setFillColor(0, 0, 0);
  const em1 = rotatedPoint(ox, oy, -halfW, 0, angle, t);
  const em2 = rotatedPoint(ox, oy, halfW, 0, angle, t);
  doc.circle(em1.x, em1.y, 0.4, 'F');
  doc.circle(em2.x, em2.y, 0.4, 'F');
}

function renderFrenchDoorPdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.15);

  const center = { x: t.toX(ox), y: t.toY(oy) };
  const arcR = t.toLen(halfW);

  // Left leaf: arc from center going up
  drawArc(doc, center.x, center.y, arcR, angle + Math.PI, angle + Math.PI / 2);
  // Left panel line
  const leftEnd = rotatedPoint(ox, oy, 0, halfW, angle, t);
  doc.line(center.x, center.y, leftEnd.x, leftEnd.y);

  // Right leaf: arc from center going down
  drawArc(doc, center.x, center.y, arcR, angle, angle - Math.PI / 2);
  const rightEnd = rotatedPoint(ox, oy, 0, -halfW, angle, t);
  doc.line(center.x, center.y, rightEnd.x, rightEnd.y);

  // Center point
  doc.setFillColor(0, 0, 0);
  doc.circle(center.x, center.y, 0.4, 'F');
}

function renderSlidingGlassDoorPdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);

  // Outer frame
  const corners = [
    rotatedPoint(ox, oy, -halfW, -0.1, angle, t),
    rotatedPoint(ox, oy, halfW, -0.1, angle, t),
    rotatedPoint(ox, oy, halfW, 0.1, angle, t),
    rotatedPoint(ox, oy, -halfW, 0.1, angle, t),
  ];
  doc.line(corners[0]!.x, corners[0]!.y, corners[1]!.x, corners[1]!.y);
  doc.line(corners[1]!.x, corners[1]!.y, corners[2]!.x, corners[2]!.y);
  doc.line(corners[2]!.x, corners[2]!.y, corners[3]!.x, corners[3]!.y);
  doc.line(corners[3]!.x, corners[3]!.y, corners[0]!.x, corners[0]!.y);

  // Center mullion
  const m1 = rotatedPoint(ox, oy, 0, -0.1, angle, t);
  const m2 = rotatedPoint(ox, oy, 0, 0.1, angle, t);
  doc.line(m1.x, m1.y, m2.x, m2.y);

  // Glass hatching
  doc.setLineWidth(0.05);
  doc.setDrawColor(150);
  const hatchSpacing = 0.12;
  const steps = Math.floor(o.width / hatchSpacing);
  for (let i = 1; i < steps; i++) {
    const fx = -halfW + i * hatchSpacing;
    const ha = rotatedPoint(ox, oy, fx, -0.08, angle, t);
    const hb = rotatedPoint(ox, oy, fx, 0.08, angle, t);
    doc.line(ha.x, ha.y, hb.x, hb.y);
  }
}

function renderArcadePdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.25);

  // Side pillars
  const p1a = rotatedPoint(ox, oy, -halfW, -0.15, angle, t);
  const p1b = rotatedPoint(ox, oy, -halfW, 0.15, angle, t);
  doc.line(p1a.x, p1a.y, p1b.x, p1b.y);

  const p2a = rotatedPoint(ox, oy, halfW, -0.15, angle, t);
  const p2b = rotatedPoint(ox, oy, halfW, 0.15, angle, t);
  doc.line(p2a.x, p2a.y, p2b.x, p2b.y);

  // Arch (semicircle above)
  doc.setLineWidth(0.15);
  const center = { x: t.toX(ox), y: t.toY(oy) };
  const arcR = t.toLen(halfW);
  drawArc(doc, center.x, center.y, arcR, angle + Math.PI, angle);

  // Dashed passage line
  doc.setLineDashPattern([1, 1], 0);
  doc.setLineWidth(0.1);
  const da = rotatedPoint(ox, oy, -halfW + 0.08, 0, angle, t);
  const db = rotatedPoint(ox, oy, halfW - 0.08, 0, angle, t);
  doc.line(da.x, da.y, db.x, db.y);
  doc.setLineDashPattern([], 0);
}

// ── Window Renderers ──

function renderWindowPdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);

  // Double parallel lines
  const off = 0.06;
  const a1 = rotatedPoint(ox, oy, -halfW, -off, angle, t);
  const b1 = rotatedPoint(ox, oy, halfW, -off, angle, t);
  const a2 = rotatedPoint(ox, oy, -halfW, off, angle, t);
  const b2 = rotatedPoint(ox, oy, halfW, off, angle, t);
  doc.line(a1.x, a1.y, b1.x, b1.y);
  doc.line(a2.x, a2.y, b2.x, b2.y);

  // Center divider
  const c1 = rotatedPoint(ox, oy, 0, -off, angle, t);
  const c2 = rotatedPoint(ox, oy, 0, off, angle, t);
  doc.line(c1.x, c1.y, c2.x, c2.y);

  // End caps
  const e1a = rotatedPoint(ox, oy, -halfW, -off, angle, t);
  const e1b = rotatedPoint(ox, oy, -halfW, off, angle, t);
  doc.line(e1a.x, e1a.y, e1b.x, e1b.y);

  const e2a = rotatedPoint(ox, oy, halfW, -off, angle, t);
  const e2b = rotatedPoint(ox, oy, halfW, off, angle, t);
  doc.line(e2a.x, e2a.y, e2b.x, e2b.y);
}

function renderBaieVitreePdf(
  doc: jsPDF, o: Opening,
  ox: number, oy: number, angle: number, t: PdfTransform
): void {
  const halfW = o.width / 2;
  clearWallGap(doc, ox, oy, halfW, angle, t);

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);

  // Outer frame
  const off = 0.1;
  const corners = [
    rotatedPoint(ox, oy, -halfW, -off, angle, t),
    rotatedPoint(ox, oy, halfW, -off, angle, t),
    rotatedPoint(ox, oy, halfW, off, angle, t),
    rotatedPoint(ox, oy, -halfW, off, angle, t),
  ];
  doc.line(corners[0]!.x, corners[0]!.y, corners[1]!.x, corners[1]!.y);
  doc.line(corners[1]!.x, corners[1]!.y, corners[2]!.x, corners[2]!.y);
  doc.line(corners[2]!.x, corners[2]!.y, corners[3]!.x, corners[3]!.y);
  doc.line(corners[3]!.x, corners[3]!.y, corners[0]!.x, corners[0]!.y);

  // Center mullion for wide ones
  if (o.width > 1.5) {
    const m1 = rotatedPoint(ox, oy, 0, -off, angle, t);
    const m2 = rotatedPoint(ox, oy, 0, off, angle, t);
    doc.line(m1.x, m1.y, m2.x, m2.y);
  }

  // Glass hatching
  doc.setLineWidth(0.05);
  doc.setDrawColor(150);
  const hatchSpacing = 0.1;
  const steps = Math.floor(o.width / hatchSpacing);
  for (let i = 1; i < steps; i++) {
    const fx = -halfW + i * hatchSpacing;
    const ha = rotatedPoint(ox, oy, fx, -off * 0.8, angle, t);
    const hb = rotatedPoint(ox, oy, fx, off * 0.8, angle, t);
    doc.line(ha.x, ha.y, hb.x, hb.y);
  }
}

// ── Arc drawing utility ──

function drawArc(
  doc: jsPDF,
  cx: number, cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments = 32
): void {
  // Ensure we go from start to end in the right direction
  let sweep = endAngle - startAngle;
  // Normalize sweep to [-2PI, 2PI]
  while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
  while (sweep < -Math.PI * 2) sweep += Math.PI * 2;

  const step = sweep / segments;
  let prevX = cx + radius * Math.cos(startAngle);
  let prevY = cy + radius * Math.sin(startAngle);

  for (let i = 1; i <= segments; i++) {
    const a = startAngle + step * i;
    const nx = cx + radius * Math.cos(a);
    const ny = cy + radius * Math.sin(a);
    doc.line(prevX, prevY, nx, ny);
    prevX = nx;
    prevY = ny;
  }
}
