import type jsPDF from 'jspdf';
import type { PdfExportConfig, PdfTransform } from '../types/pdf';

const CART_W = 130;
const CART_H = 40;
const MARGIN = 12;

/** Draw professional title block (cartouche) in bottom-right corner */
export function renderPdfCartouche(
  doc: jsPDF,
  t: PdfTransform,
  config: PdfExportConfig,
  planTitle: string,
  pageNum: number,
  totalPages: number
): void {
  const x = t.pageW - MARGIN - CART_W;
  const y = t.pageH - MARGIN - CART_H;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, CART_W, CART_H, 'F');

  // Outer frame
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, CART_W, CART_H);

  // Layout: 3 rows
  // Row 1 (top, 12mm): Project name + plan title
  // Row 2 (mid, 16mm): Client | Architect | Address
  // Row 3 (bot, 12mm): Date | Scale | Page

  const r1H = 12;
  const r2H = 16;
  const r3H = CART_H - r1H - r2H;

  doc.setLineWidth(0.15);

  // ── Row 1: Project name + plan title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(config.projectName || 'Sans titre', x + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60);
  doc.text(planTitle, x + 4, y + 10);

  doc.line(x, y + r1H, x + CART_W, y + r1H);

  // ── Row 2: Client | Architect | Address ──
  const colW = CART_W / 3;
  doc.line(x + colW, y + r1H, x + colW, y + r1H + r2H);
  doc.line(x + colW * 2, y + r1H, x + colW * 2, y + r1H + r2H);

  // Client
  doc.setFontSize(5);
  doc.setTextColor(120);
  doc.text('CLIENT', x + 3, y + r1H + 4);
  doc.setFontSize(7);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(config.clientName || '—', x + 3, y + r1H + 9, { maxWidth: colW - 6 });

  // Architect
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(120);
  doc.text('ARCHITECTE', x + colW + 3, y + r1H + 4);
  doc.setFontSize(7);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(config.architect || '—', x + colW + 3, y + r1H + 9, { maxWidth: colW - 6 });

  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(120);
  doc.text('ADRESSE', x + colW * 2 + 3, y + r1H + 4);
  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text(config.address || '—', x + colW * 2 + 3, y + r1H + 9, { maxWidth: colW - 6 });

  doc.line(x, y + r1H + r2H, x + CART_W, y + r1H + r2H);

  // ── Row 3: Date | Scale | Page ──
  doc.line(x + colW, y + r1H + r2H, x + colW, y + CART_H);
  doc.line(x + colW * 2, y + r1H + r2H, x + colW * 2, y + CART_H);

  const r3y = y + r1H + r2H;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(120);
  doc.text('DATE', x + 3, r3y + 4);
  doc.text('ÉCHELLE', x + colW + 3, r3y + 4);
  doc.text('PAGE', x + colW * 2 + 3, r3y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(config.date || new Date().toLocaleDateString('fr-FR'), x + 3, r3y + r3H - 2);
  doc.text(`1:${t.archScale}`, x + colW + 3, r3y + r3H - 2);
  doc.text(`${pageNum}/${totalPages}`, x + colW * 2 + 3, r3y + r3H - 2);
}
