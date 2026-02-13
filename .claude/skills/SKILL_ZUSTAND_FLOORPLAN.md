# Skill: Zustand State Management for Floor Plan Editor

## Purpose
Patterns for managing complex, interconnected architectural data with undo/redo support using Zustand.

## Store Architecture

Split into two stores to avoid unnecessary re-renders:

### 1. FloorPlan Store (data)
```typescript
import { create } from 'zustand';
import { temporal } from 'zundo';

interface FloorPlanStore {
  walls: Wall[];
  openings: Opening[];
  
  // Wall CRUD
  addWall: (wall: Wall) => void;
  updateWall: (id: string, changes: Partial<Wall>) => void;
  removeWall: (id: string) => void;
  moveWall: (id: string, dx: number, dy: number) => void;
  
  // Opening CRUD
  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, changes: Partial<Opening>) => void;
  removeOpening: (id: string) => void;
  
  // Bulk operations
  loadPlan: (plan: FloorPlan) => void;
  clear: () => void;
  
  // Computed
  getWallById: (id: string) => Wall | undefined;
  getOpeningsForWall: (wallId: string) => Opening[];
}

const useFloorPlan = create<FloorPlanStore>()(
  temporal(
    (set, get) => ({
      walls: [],
      openings: [],
      
      addWall: (wall) => set(s => ({ walls: [...s.walls, wall] })),
      
      updateWall: (id, changes) => set(s => ({
        walls: s.walls.map(w => w.id === id ? { ...w, ...changes } : w),
      })),
      
      removeWall: (id) => set(s => ({
        walls: s.walls.filter(w => w.id !== id),
        // CASCADE: remove openings on this wall
        openings: s.openings.filter(o => o.wallId !== id),
      })),
      
      moveWall: (id, dx, dy) => set(s => ({
        walls: s.walls.map(w => w.id === id ? {
          ...w,
          x1: snap(w.x1 + dx), y1: snap(w.y1 + dy),
          x2: snap(w.x2 + dx), y2: snap(w.y2 + dy),
        } : w),
      })),
      
      addOpening: (opening) => set(s => ({ openings: [...s.openings, opening] })),
      
      updateOpening: (id, changes) => set(s => ({
        openings: s.openings.map(o => o.id === id ? { ...o, ...changes } : o),
      })),
      
      removeOpening: (id) => set(s => ({
        openings: s.openings.filter(o => o.id !== id),
      })),
      
      loadPlan: (plan) => set({ walls: plan.walls, openings: plan.openings }),
      clear: () => set({ walls: [], openings: [] }),
      
      getWallById: (id) => get().walls.find(w => w.id === id),
      getOpeningsForWall: (wallId) => get().openings.filter(o => o.wallId === wallId),
    }),
    {
      // Undo/redo config
      limit: 50,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )
);
```

### 2. Editor Store (UI state)
```typescript
interface EditorStore {
  tool: ToolType;
  selectedId: string | null;
  viewMode: '2d' | '3d' | 'split';
  showCeiling: boolean;
  showLabels: boolean;
  bgImage: string | null;
  
  setTool: (tool: ToolType) => void;
  setSelectedId: (id: string | null) => void;
  setViewMode: (mode: '2d' | '3d' | 'split') => void;
  toggleCeiling: () => void;
  toggleLabels: () => void;
  setBgImage: (src: string | null) => void;
}

// No temporal middleware — UI state doesn't need undo
const useEditor = create<EditorStore>((set) => ({
  tool: 'select',
  selectedId: null,
  viewMode: 'split',
  showCeiling: false,
  showLabels: true,
  bgImage: null,
  
  setTool: (tool) => set({ tool }),
  setSelectedId: (id) => set({ selectedId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleCeiling: () => set(s => ({ showCeiling: !s.showCeiling })),
  toggleLabels: () => set(s => ({ showLabels: !s.showLabels })),
  setBgImage: (src) => set({ bgImage: src }),
}));
```

## Undo/Redo with Zundo

```typescript
// In a keyboard handler:
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        useFloorPlan.temporal.getState().redo();
      } else {
        useFloorPlan.temporal.getState().undo();
      }
      e.preventDefault();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

// Check if undo/redo is available:
const { pastStates, futureStates } = useFloorPlan.temporal.getState();
const canUndo = pastStates.length > 0;
const canRedo = futureStates.length > 0;
```

## Selector Patterns

### Only re-render when relevant data changes:
```typescript
// BAD — re-renders on ANY store change
const { walls, openings, selectedId } = useFloorPlan();

// GOOD — only re-renders when walls change
const walls = useFloorPlan(s => s.walls);

// GOOD — derived data with shallow comparison
const wallCount = useFloorPlan(s => s.walls.length);

// GOOD — selected item only
const selectedWall = useFloorPlan(s => 
  s.walls.find(w => w.id === useEditor.getState().selectedId)
);
```

### Cross-store selectors:
```typescript
// When a component needs data from both stores:
function PropertiesPanel() {
  const selectedId = useEditor(s => s.selectedId);
  const selectedWall = useFloorPlan(s => s.walls.find(w => w.id === selectedId));
  const selectedOpening = useFloorPlan(s => s.openings.find(o => o.id === selectedId));
  const selected = selectedWall || selectedOpening;
  // ...
}
```

## Cascade Delete Pattern

When removing a wall, always remove its openings:
```typescript
removeWall: (id) => set(s => ({
  walls: s.walls.filter(w => w.id !== id),
  openings: s.openings.filter(o => o.wallId !== id),
})),
```

This must be a single `set()` call so undo restores both wall AND openings.

## Delete Selected (cross-store action)
```typescript
function deleteSelected() {
  const { selectedId, setSelectedId } = useEditor.getState();
  if (!selectedId) return;
  
  const { walls, removeWall, removeOpening } = useFloorPlan.getState();
  const isWall = walls.some(w => w.id === selectedId);
  
  if (isWall) removeWall(selectedId);
  else removeOpening(selectedId);
  
  setSelectedId(null);
}
```

## NPM Dependencies
```json
{
  "zustand": "^5.0.0",
  "zundo": "^2.0.0"
}
```
