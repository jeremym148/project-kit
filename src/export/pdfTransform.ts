import type { FloorPlan } from '../types';
import type { PdfExportConfig, PdfTransform } from '../types/pdf';

/** Page dimensions in mm (landscape) */
const PAGE_SIZES = {
  A3: { w: 420, h: 297 },
  A4: { w: 297, h: 210 },
} as const;

/** Standard architectural scales to try (denominator) */
const STANDARD_SCALES = [50, 75, 100, 150, 200];

/** Margins in mm */
const MARGIN = 15;

/** Compute the bounding box of all walls in meters */
export function computeBounds(data: FloorPlan): {
  minX: number; minY: number; maxX: number; maxY: number;
  width: number; height: number;
} {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const w of data.walls) {
    minX = Math.min(minX, w.x1, w.x2);
    minY = Math.min(minY, w.y1, w.y2);
    maxX = Math.max(maxX, w.x1, w.x2);
    maxY = Math.max(maxY, w.y1, w.y2);
  }

  // Include terrain if present
  if (data.terrain) {
    minX = Math.min(minX, data.terrain.offsetX);
    minY = Math.min(minY, data.terrain.offsetY);
    maxX = Math.max(maxX, data.terrain.offsetX + data.terrain.width);
    maxY = Math.max(maxY, data.terrain.offsetY + data.terrain.depth);
  }

  // Fallback if no walls
  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 10; maxY = 10;
  }

  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Pick the best standard scale that fits the plan on the page */
function autoDetectScale(
  boundsW: number,
  boundsH: number,
  pageSize: 'A3' | 'A4'
): number {
  const page = PAGE_SIZES[pageSize];
  // Available drawing area: full page minus margins, with small padding for dim lines
  // The cartouche is in the bottom-right corner and overlays on top of the drawing
  const drawW = page.w - MARGIN * 2;
  const drawH = page.h - MARGIN * 2;

  // Add 2m padding for dimension lines (1m each side)
  const padW = boundsW + 2;
  const padH = boundsH + 2;

  for (const s of STANDARD_SCALES) {
    const mmPerMeter = 1000 / s;
    const planW = padW * mmPerMeter;
    const planH = padH * mmPerMeter;
    if (planW <= drawW && planH <= drawH) {
      return s;
    }
  }

  return STANDARD_SCALES[STANDARD_SCALES.length - 1]!;
}

/** Create the coordinate transform for PDF rendering */
export function createPdfTransform(
  data: FloorPlan,
  config: PdfExportConfig
): PdfTransform {
  const bounds = computeBounds(data);
  const page = PAGE_SIZES[config.pageSize];

  // Determine scale
  const archScale = config.scale === 0
    ? autoDetectScale(bounds.width, bounds.height, config.pageSize)
    : config.scale;

  const mmPerMeter = 1000 / archScale;

  // Plan dimensions in mm (with 2m padding — 1m each side for dimension lines)
  const planW = (bounds.width + 2) * mmPerMeter;
  const planH = (bounds.height + 2) * mmPerMeter;

  // Available drawing area (full page minus margins)
  const drawW = page.w - MARGIN * 2;
  const drawH = page.h - MARGIN * 2;

  // Shift plan toward top-left to avoid cartouche overlap in bottom-right
  // Only shift if there's free space (proportional, capped)
  const freeW = Math.max(0, drawW - planW);
  const freeH = Math.max(0, drawH - planH);
  const shiftX = Math.min(freeW * 0.2, 25);
  const shiftY = Math.min(freeH * 0.2, 15);

  const offsetX = MARGIN + (drawW - planW) / 2 + 1 * mmPerMeter - shiftX;
  const offsetY = MARGIN + (drawH - planH) / 2 + 1 * mmPerMeter - shiftY;

  const transform: PdfTransform = {
    offsetX,
    offsetY,
    scale: mmPerMeter,
    archScale,
    pageW: page.w,
    pageH: page.h,
    toX(meters: number): number {
      return offsetX + (meters - bounds.minX) * mmPerMeter;
    },
    toY(meters: number): number {
      return offsetY + (meters - bounds.minY) * mmPerMeter;
    },
    toLen(meters: number): number {
      return meters * mmPerMeter;
    },
  };

  return transform;
}
