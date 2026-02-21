import type jsPDF from 'jspdf';
import type { RoomLabel, FloorMaterial } from '../../types';
import type { PdfTransform } from '../../types/pdf';

const floorMaterialLabels: Record<FloorMaterial, string> = {
  parquet: 'Parquet',
  carrelage: 'Carrelage',
  pelouse: 'Pelouse',
};

/** Render room labels with names, areas, and floor hatching */
export function renderLabelsPdf(
  doc: jsPDF,
  labels: RoomLabel[],
  t: PdfTransform
): void {
  // First pass: floor material hatching
  for (const label of labels) {
    if (label.floorMaterial && label.polygon && label.polygon.length >= 3) {
      renderFloorHatching(doc, label, t);
    }
  }

  // Second pass: text labels with white background for contrast
  for (const label of labels) {
    const x = t.toX(label.cx);
    const y = t.toY(label.cy);

    // Compute the widest text line to size the background
    let maxTextW = 0;
    let blockH = 0;

    if (label.name) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      maxTextW = Math.max(maxTextW, doc.getTextWidth(label.name));
      blockH += 3.5;
    }

    if (label.area > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const areaText = `${label.area.toFixed(2)} m\u00B2`;
      maxTextW = Math.max(maxTextW, doc.getTextWidth(areaText));
      blockH += 3.5;
    }

    if (label.floorMaterial) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      maxTextW = Math.max(maxTextW, doc.getTextWidth(floorMaterialLabels[label.floorMaterial]));
      blockH += 2.5;
    }

    // White background behind text group
    if (blockH > 0) {
      const bgW = maxTextW + 4;
      const bgH = blockH + 2;
      doc.setFillColor(255, 255, 255);
      doc.rect(x - bgW / 2, y - 3.5, bgW, bgH, 'F');
    }

    // Room name
    if (label.name) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(label.name, x, y, { align: 'center' });
    }

    // Area
    if (label.area > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(60);
      doc.text(`${label.area.toFixed(2)} m\u00B2`, x, y + 4, { align: 'center' });
    }

    // Floor material label
    if (label.floorMaterial) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(100);
      doc.text(floorMaterialLabels[label.floorMaterial], x, y + 7.5, { align: 'center' });
    }
  }
}

/** Render diagonal hatching lines clipped to the room polygon */
function renderFloorHatching(
  doc: jsPDF,
  label: RoomLabel,
  t: PdfTransform
): void {
  const polygon = label.polygon!;
  const material = label.floorMaterial!;

  // Determine hatching style
  let spacing: number;
  let angle: number;
  let color: [number, number, number];

  switch (material) {
    case 'parquet':
      spacing = 0.2; // meters
      angle = Math.PI / 4; // 45 degrees
      color = [180, 160, 130];
      break;
    case 'carrelage':
      spacing = 0.25;
      angle = 0; // horizontal + vertical grid
      color = [160, 170, 180];
      break;
    case 'pelouse':
      spacing = 0.3;
      angle = Math.PI / 6; // 30 degrees
      color = [120, 170, 100];
      break;
  }

  // Scale hatching spacing if at a very small scale to avoid overly dense lines
  const mmSpacing = t.toLen(spacing);
  if (mmSpacing < 2) {
    spacing = 2 / t.scale;
  }

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.08);

  // Compute polygon bounding box in meters
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  // Generate hatching lines
  if (material === 'carrelage') {
    // Grid pattern: horizontal + vertical lines
    for (let y = minY; y <= maxY; y += spacing) {
      clipLineToPolygon(doc, polygon, minX, y, maxX, y, t);
    }
    for (let x = minX; x <= maxX; x += spacing) {
      clipLineToPolygon(doc, polygon, x, minY, x, maxY, t);
    }
  } else {
    // Diagonal hatching
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const diag = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    for (let d = -diag; d <= diag; d += spacing) {
      // Line perpendicular to hatch angle, offset by d
      const lx1 = cx + d * cos - diag * sin;
      const ly1 = cy + d * sin + diag * cos;
      const lx2 = cx + d * cos + diag * sin;
      const ly2 = cy + d * sin - diag * cos;
      clipLineToPolygon(doc, polygon, lx1, ly1, lx2, ly2, t);
    }
  }
}

/** Clip a line segment to a polygon and draw visible parts */
function clipLineToPolygon(
  doc: jsPDF,
  polygon: { x: number; y: number }[],
  x1: number, y1: number,
  x2: number, y2: number,
  t: PdfTransform
): void {
  // Find all intersections of the line with polygon edges
  const intersections: number[] = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const ex1 = polygon[i]!.x;
    const ey1 = polygon[i]!.y;
    const ex2 = polygon[j]!.x;
    const ey2 = polygon[j]!.y;

    const edx = ex2 - ex1;
    const edy = ey2 - ey1;
    const denom = dx * edy - dy * edx;
    if (Math.abs(denom) < 0.0001) continue;

    const tLine = ((ex1 - x1) * edy - (ey1 - y1) * edx) / denom;
    const tEdge = ((ex1 - x1) * dy - (ey1 - y1) * dx) / denom;

    if (tEdge >= 0 && tEdge <= 1 && tLine >= 0 && tLine <= 1) {
      intersections.push(tLine);
    }
  }

  intersections.sort((a, b) => a - b);

  // Draw line segments inside the polygon (between pairs of intersections)
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const t1 = intersections[i]!;
    const t2 = intersections[i + 1]!;
    const sx = t.toX(x1 + dx * t1);
    const sy = t.toY(y1 + dy * t1);
    const ex = t.toX(x1 + dx * t2);
    const ey = t.toY(y1 + dy * t2);
    doc.line(sx, sy, ex, ey);
  }
}
