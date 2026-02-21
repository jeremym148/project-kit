import { jsPDF } from 'jspdf';
import type { FloorPlan } from '../types';
import type { PdfExportConfig, TechnicalDomain } from '../types/pdf';
import { createPdfTransform } from './pdfTransform';
import { renderPdfBorder } from './pdfBorder';
import { renderPdfCartouche } from './pdfCartouche';
import { renderPdfScaleBar, renderPdfNorthArrow } from './pdfScaleBar';
import { renderArchitecturalPlan } from './renderers/pdfArchitecturalRenderer';
import { renderBasePlanPdf } from './renderers/pdfBaseRenderer';
import { generateAllTechnicalPlans } from './technical/autoGenerate';
import { renderElectricalPlan } from './technicalRenderers/pdfElectricalRenderer';
import { renderPlumbingPlan } from './technicalRenderers/pdfPlumbingRenderer';
import { renderDrainagePlan } from './technicalRenderers/pdfDrainageRenderer';
import { renderHeatingPlan } from './technicalRenderers/pdfHeatingRenderer';
import { renderLegend } from './technicalRenderers/pdfLegend';

/** Main entry point: generate and download the professional PDF */
export function exportFloorPlanPdf(data: FloorPlan, config: PdfExportConfig): void {
  // Count total pages
  const enabledPlans: { domain: TechnicalDomain; configKey: keyof PdfExportConfig }[] = [
    { domain: 'electrical', configKey: 'includeElectrical' },
    { domain: 'plumbing', configKey: 'includePlumbing' },
    { domain: 'drainage', configKey: 'includeDrainage' },
    { domain: 'heating', configKey: 'includeHeating' },
  ];

  const activeTechPlans = enabledPlans.filter((p) => config[p.configKey]);
  const totalPages = (config.includeArchitectural ? 1 : 0) + activeTechPlans.length;

  if (totalPages === 0) return;

  // Create jsPDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: config.pageSize.toLowerCase() as 'a3' | 'a4',
  });

  // Compute transform
  const t = createPdfTransform(data, config);

  // Generate technical data
  const techPlans = generateAllTechnicalPlans(data);

  let currentPage = 0;

  // ─── Page 1: Architectural Plan ───
  if (config.includeArchitectural) {
    currentPage++;

    // Draw the full architectural plan
    renderArchitecturalPlan(doc, data, t);

    // Page decorations
    renderPdfBorder(doc, t);
    renderPdfScaleBar(doc, t);
    renderPdfNorthArrow(doc, t);
    renderPdfCartouche(doc, t, config, "Plan d'Architecture", currentPage, totalPages);
  }

  // ─── Technical Plan Pages ───
  const techRenderers: Record<TechnicalDomain, (doc: jsPDF, points: import('../types/pdf').TechnicalPoint[], t: import('../types/pdf').PdfTransform) => void> = {
    electrical: renderElectricalPlan,
    plumbing: renderPlumbingPlan,
    drainage: renderDrainagePlan,
    heating: renderHeatingPlan,
  };

  for (const activePlan of activeTechPlans) {
    const plan = techPlans.find((tp) => tp.domain === activePlan.domain);
    if (!plan) continue;

    // Add new page
    doc.addPage(config.pageSize.toLowerCase() as 'a3' | 'a4', 'landscape');
    currentPage++;

    // Base floor plan (light gray background)
    renderBasePlanPdf(doc, data, t);

    // Technical overlay
    const renderer = techRenderers[activePlan.domain];
    if (renderer) {
      renderer(doc, plan.points, t);
    }

    // Legend
    renderLegend(doc, activePlan.domain, t.pageW, t.pageH);

    // Page decorations
    renderPdfBorder(doc, t);
    renderPdfScaleBar(doc, t);
    renderPdfNorthArrow(doc, t);
    renderPdfCartouche(doc, t, config, plan.title, currentPage, totalPages);
  }

  // Download the PDF
  const fileName = (config.projectName || 'plan').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s-]/g, '').replace(/\s+/g, '_');
  doc.save(`${fileName}.pdf`);
}
