export type ToolType = 'select' | 'wall' | 'door' | 'window' | 'label' | 'furniture';

export type ViewMode = '2d' | '3d' | 'split';

export interface DrawingState {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DragState {
  type: 'wall' | 'wall-endpoint' | 'label' | 'furniture' | 'terrain';
  itemId: string;
  startX: number;
  startY: number;
  origWall?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  endpoint?: 'p1' | 'p2'; // which endpoint is being dragged
  origLabel?: {
    cx: number;
    cy: number;
  };
  origFurniture?: {
    cx: number;
    cy: number;
  };
  origTerrain?: {
    offsetX: number;
    offsetY: number;
  };
}

export interface PanState {
  x: number;
  y: number;
}

export interface ToolDefinition {
  id: ToolType;
  label: string;
  icon: string;
}
