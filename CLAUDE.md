# FloorPlan Studio — CLAUDE.md

## Project Overview
Interactive 2D/3D apartment floor plan editor. Users draw or import floor plans in 2D, see them rendered in real-time 3D, and can modify walls, doors, and windows in either view.

## Stack
- **Vite** + **React 18** + **TypeScript** (strict)
- **Zustand** for state management (with temporal middleware for undo/redo)
- **Three.js** for 3D rendering (direct, not react-three-fiber)
- **Canvas 2D API** for the 2D editor (direct, not a library)
- **Anthropic Claude Vision API** for AI floor plan import

## Architecture Principles

### Data Model is the Source of Truth
The `FloorPlan` type (walls + openings) is the single source of truth. Both the 2D canvas and 3D scene read from it. Mutations go through the Zustand store only.

### Rendering is Pure
2D renderers are pure functions: `(ctx: CanvasRenderingContext2D, data: FloorPlan, state: EditorState) → void`. They don't manage state. Same for 3D builders: `(scene: THREE.Scene, data: FloorPlan) → void`.

### 3D Scene Diffing
Don't clear and rebuild the entire 3D scene on every change. Tag meshes with `userData.wallId` or `userData.openingId`. On data change, diff and update/add/remove only what changed. This is critical for performance with complex floor plans (30+ walls).

### Coordinate System
- All coordinates are in **meters** in the data model
- 2D canvas converts via `toScreen(meters)` = meters × SCALE
- 3D scene uses meters directly (1 unit = 1 meter)
- Grid snaps to 0.5m increments
- Origin (0,0) is top-left of the floor plan

## Running
```bash
npm install
npm run dev     # → http://localhost:5173
npm run build   # production build
npm run preview # preview production build
```

## Key Files
| Path | Purpose |
|------|---------|
| `src/types/index.ts` | All shared types — edit here first when changing data model |
| `src/store/useFloorPlan.ts` | Floor plan CRUD + undo/redo — all mutations go here |
| `src/store/useEditor.ts` | UI state: tool, selection, view mode |
| `src/editor2d/Canvas2D.tsx` | Main 2D component — delegates to renderers |
| `src/viewer3d/Scene3D.tsx` | Three.js scene setup — delegates to builders |
| `src/ai/prompts.ts` | AI prompts — iterate here to improve floor plan detection |
| `src/utils/geometry.ts` | Math utilities — used by both 2D and 3D |

## Conventions
- Files: `camelCase.ts` for utils/hooks, `PascalCase.tsx` for components
- Types: defined in `src/types/`, imported everywhere
- No `any` — use `unknown` + type guards if type is uncertain
- Components: functional only, with hooks
- State: never local state for floor plan data — always Zustand store
- CSS: inline styles with theme tokens from `src/styles/theme.ts`
- IDs: always use `uid()` from `src/utils/ids.ts`

## Common Tasks

### Add a new tool
1. Add to `ToolType` enum in `src/types/tools.ts`
2. Add button in `src/components/Toolbar.tsx`
3. Add mouse handler case in `src/editor2d/useCanvasInteraction.ts`
4. Add 2D renderer if needed in `src/editor2d/renderers/`
5. Add 3D builder if needed in `src/viewer3d/builders/`

### Add a new property to walls/openings
1. Update type in `src/types/index.ts`
2. Update creation function in `src/utils/defaults.ts`
3. Add UI control in `src/components/PropertiesPanel.tsx`
4. Update 2D renderer if visual change
5. Update 3D builder if visual change

### Improve AI floor plan detection
1. Edit prompts in `src/ai/prompts.ts`
2. Test with various floor plan images
3. Parsing logic is in `src/ai/analyzeFloorPlan.ts`

## Performance Gotchas
- THREE.js geometries must be disposed to avoid memory leaks
- Canvas2D: batch draws, avoid save/restore in tight loops
- Zustand: use selectors to prevent unnecessary re-renders
- Split view: use `React.lazy` or conditional mounting for 3D viewer
- Don't create new Three.js materials on every render — define once, reuse

## Testing
- Manual testing is primary (visual app)
- Unit test geometry utils with Vitest
- Test AI response parsing with mock responses
- Test store mutations (add/remove/update wall, undo/redo)
