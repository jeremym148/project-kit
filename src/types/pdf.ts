import type jsPDF from 'jspdf';

// ── PDF Export Configuration ──

export interface PdfExportConfig {
  projectName: string;
  clientName: string;
  architect: string;
  address: string;
  date: string;
  scale: number;            // e.g., 50 for 1:50, 100 for 1:100, 0 for auto
  pageSize: 'A3' | 'A4';
  includeArchitectural: boolean;
  includeElectrical: boolean;
  includePlumbing: boolean;
  includeDrainage: boolean;
  includeHeating: boolean;
}

// ── PDF Coordinate Transform ──

export interface PdfTransform {
  offsetX: number;    // mm offset to center plan on page
  offsetY: number;    // mm offset
  scale: number;      // mm per meter (e.g., 20 for 1:50)
  archScale: number;  // architectural scale denominator (e.g., 50 for 1:50)
  pageW: number;      // page width in mm
  pageH: number;      // page height in mm
  toX(meters: number): number;
  toY(meters: number): number;
  toLen(meters: number): number;
}

// ── Technical Plan Types (re-exported from core types) ──

import type { TechnicalDomain, TechnicalPoint } from '../types';
export type { TechnicalPointType, TechnicalDomain, TechnicalPoint } from '../types';

export interface TechnicalPlan {
  domain: TechnicalDomain;
  title: string;
  points: TechnicalPoint[];
}

// ── Dimension Line ──

export interface DimensionLine {
  x1: number; y1: number;
  x2: number; y2: number;
  offset: number;    // perpendicular offset in meters (positive = right of direction)
  label?: string;
}

// ── Legend Entry ──

export interface LegendEntry {
  symbol: (doc: jsPDF, x: number, y: number, size: number) => void;
  label: string;
}
