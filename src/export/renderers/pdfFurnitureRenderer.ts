import type jsPDF from 'jspdf';
import type { Furniture } from '../../types';
import type { PdfTransform } from '../../types/pdf';
import { FURNITURE_DEFAULTS } from '../../utils/defaults';

/** Render furniture outlines with type-specific icons and labels */
export function renderFurniturePdf(
  doc: jsPDF,
  furniture: Furniture[],
  t: PdfTransform
): void {
  doc.setDrawColor(130);
  doc.setLineWidth(0.15);

  for (const f of furniture) {
    const cx = t.toX(f.cx);
    const cy = t.toY(f.cy);
    const w = t.toLen(f.width);
    const d = t.toLen(f.depth);

    // Apply rotation via manual coordinate calculation
    const cos = Math.cos(f.rotation);
    const sin = Math.sin(f.rotation);

    // Draw rotated rectangle
    const hw = w / 2;
    const hd = d / 2;
    const corners = [
      { x: cx + (-hw * cos - (-hd) * sin), y: cy + (-hw * sin + (-hd) * cos) },
      { x: cx + (hw * cos - (-hd) * sin), y: cy + (hw * sin + (-hd) * cos) },
      { x: cx + (hw * cos - hd * sin), y: cy + (hw * sin + hd * cos) },
      { x: cx + (-hw * cos - hd * sin), y: cy + (-hw * sin + hd * cos) },
    ];

    // Outline
    doc.setDrawColor(130);
    doc.setLineWidth(0.15);
    doc.line(corners[0]!.x, corners[0]!.y, corners[1]!.x, corners[1]!.y);
    doc.line(corners[1]!.x, corners[1]!.y, corners[2]!.x, corners[2]!.y);
    doc.line(corners[2]!.x, corners[2]!.y, corners[3]!.x, corners[3]!.y);
    doc.line(corners[3]!.x, corners[3]!.y, corners[0]!.x, corners[0]!.y);

    // Type-specific interior detail
    drawFurnitureDetail(doc, f, cx, cy, w, d, cos, sin);

    // Label below furniture
    const label = FURNITURE_DEFAULTS[f.furnitureType]?.label || f.furnitureType;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4);
    doc.setTextColor(150);
    const labelY = cy + hd * cos + hw * Math.abs(sin) + 2;
    doc.text(label, cx, labelY, { align: 'center' });
  }
}

function drawFurnitureDetail(
  doc: jsPDF, f: Furniture,
  cx: number, cy: number,
  w: number, d: number,
  cos: number, sin: number
): void {
  doc.setDrawColor(150);
  doc.setLineWidth(0.1);
  const hw = w / 2;
  const hd = d / 2;

  // Helper: rotate local coords to global
  const rot = (lx: number, ly: number) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos,
  });

  switch (f.furnitureType) {
    case 'toilet': {
      // Bowl ellipse (simplified as circle)
      const bowlCenter = rot(0, d * 0.1);
      drawEllipse(doc, bowlCenter.x, bowlCenter.y, w * 0.3, d * 0.3);
      // Tank rectangle
      const ta = rot(-w * 0.3, -hd + 0.5);
      const tb = rot(w * 0.3, -hd + 0.5);
      const tc = rot(w * 0.3, -hd + d * 0.2 + 0.5);
      const td = rot(-w * 0.3, -hd + d * 0.2 + 0.5);
      doc.setFillColor(200, 200, 200);
      drawQuad(doc, ta, tb, tc, td);
      break;
    }
    case 'bed': {
      // Pillow area
      const pa = rot(-hw + 1, -hd + 1);
      const pb = rot(hw - 1, -hd + 1);
      const pc = rot(hw - 1, -hd + d * 0.2);
      const pd = rot(-hw + 1, -hd + d * 0.2);
      doc.line(pa.x, pa.y, pb.x, pb.y);
      doc.line(pb.x, pb.y, pc.x, pc.y);
      doc.line(pc.x, pc.y, pd.x, pd.y);
      doc.line(pd.x, pd.y, pa.x, pa.y);
      // Center line
      const c1 = rot(0, -hd + 1);
      const c2 = rot(0, hd - 1);
      doc.line(c1.x, c1.y, c2.x, c2.y);
      break;
    }
    case 'kitchen-counter': {
      // Sink circles
      const s1 = rot(-w * 0.2, 0);
      const s2 = rot(w * 0.2, 0);
      const r = Math.min(w, d) * 0.12;
      drawCircle(doc, s1.x, s1.y, r);
      drawCircle(doc, s2.x, s2.y, r);
      break;
    }
    case 'shower': {
      // Drain circle
      const center = rot(0, 0);
      drawCircle(doc, center.x, center.y, Math.min(w, d) * 0.1);
      // Water lines
      doc.setLineDashPattern([0.5, 0.5], 0);
      for (const offset of [-0.2, 0, 0.2]) {
        const la = rot(w * offset, -d * 0.3);
        const lb = rot(w * offset, d * 0.3);
        doc.line(la.x, la.y, lb.x, lb.y);
      }
      doc.setLineDashPattern([], 0);
      break;
    }
    case 'bathtub': {
      // Inner ellipse
      const center = rot(0, 0);
      drawEllipse(doc, center.x, center.y, w * 0.35, d * 0.4);
      break;
    }
    case 'table': {
      // X pattern
      const a = rot(-hw + 1.5, -hd + 1.5);
      const b = rot(hw - 1.5, hd - 1.5);
      const c = rot(hw - 1.5, -hd + 1.5);
      const dd = rot(-hw + 1.5, hd - 1.5);
      doc.line(a.x, a.y, b.x, b.y);
      doc.line(c.x, c.y, dd.x, dd.y);
      break;
    }
    case 'bookshelf': {
      // Shelf lines
      const shelves = 4;
      for (let i = 1; i < shelves; i++) {
        const sy = -hd + (d / shelves) * i;
        const la = rot(-w * 0.4, sy);
        const lb = rot(w * 0.4, sy);
        doc.line(la.x, la.y, lb.x, lb.y);
      }
      break;
    }
    case 'fridge': {
      // Freezer divider line
      const la = rot(-w * 0.4, -d * 0.1);
      const lb = rot(w * 0.4, -d * 0.1);
      doc.line(la.x, la.y, lb.x, lb.y);
      // Handle
      doc.setLineWidth(0.2);
      const ha = rot(w * 0.3, -d * 0.3);
      const hb = rot(w * 0.3, d * 0.3);
      doc.line(ha.x, ha.y, hb.x, hb.y);
      doc.setLineWidth(0.1);
      break;
    }
    default:
      break;
  }
}

function drawCircle(doc: jsPDF, cx: number, cy: number, r: number): void {
  doc.circle(cx, cy, r);
}

function drawEllipse(
  doc: jsPDF, cx: number, cy: number,
  rx: number, ry: number
): void {
  doc.ellipse(cx, cy, rx, ry);
}

function drawQuad(
  doc: jsPDF,
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number }
): void {
  doc.line(a.x, a.y, b.x, b.y);
  doc.line(b.x, b.y, c.x, c.y);
  doc.line(c.x, c.y, d.x, d.y);
  doc.line(d.x, d.y, a.x, a.y);
}
