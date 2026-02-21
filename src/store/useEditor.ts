import { create } from 'zustand';
import type { ToolType, ViewMode } from '../types/tools';
import type { FurnitureType, TechnicalPointType } from '../types';

interface EditorState {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  showCeiling: boolean;
  toggleCeiling: () => void;
  showLabels: boolean;
  toggleLabels: () => void;
  showFurniture: boolean;
  toggleFurniture: () => void;
  showTechnical: boolean;
  toggleTechnical: () => void;
  showImport: boolean;
  setShowImport: (show: boolean) => void;
  bgImage: string | null;
  setBgImage: (img: string | null) => void;
  furnitureType: FurnitureType;
  setFurnitureType: (ft: FurnitureType) => void;
  technicalPointType: TechnicalPointType;
  setTechnicalPointType: (tpt: TechnicalPointType) => void;
}

export const useEditor = create<EditorState>((set) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
  selectedId: null,
  setSelectedId: (selectedId) => set({ selectedId }),
  view: 'split',
  setView: (view) => set({ view }),
  showCeiling: false,
  toggleCeiling: () => set((s) => ({ showCeiling: !s.showCeiling })),
  showLabels: true,
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  showFurniture: true,
  toggleFurniture: () => set((s) => ({ showFurniture: !s.showFurniture })),
  showTechnical: true,
  toggleTechnical: () => set((s) => ({ showTechnical: !s.showTechnical })),
  showImport: false,
  setShowImport: (showImport) => set({ showImport }),
  bgImage: null,
  setBgImage: (bgImage) => set({ bgImage }),
  furnitureType: 'table',
  setFurnitureType: (furnitureType) => set({ furnitureType }),
  technicalPointType: 'outlet',
  setTechnicalPointType: (technicalPointType) => set({ technicalPointType }),
}));
