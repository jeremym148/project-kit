# FloorPlan Studio — CLAUDE.md

## Project Overview
Interactive 2D/3D floor plan editor for architecture and interior design. Users draw or import floor plans in 2D, see them rendered in real-time 3D, and can modify walls, doors, windows, furniture, room labels, floor materials, and terrain in either view.

## Stack
- **Vite** + **React 18** + **TypeScript** (strict)
- **Zustand** for state management (with zundo temporal middleware for undo/redo, limit: 50)
- **Three.js** for 3D rendering (direct, not react-three-fiber)
- **Canvas 2D API** for the 2D editor (direct, not a library)
- **Anthropic Claude Vision API** for AI floor plan import

## Architecture Principles

### Data Model is the Source of Truth
The `FloorPlan` type is the single source of truth. Both the 2D canvas and 3D scene read from it. Mutations go through the Zustand store only.

### Rendering is Pure
2D renderers are pure functions: `(ctx, data, state) → void`. They don't manage state. Same for 3D builders: `(scene, data) → void`.

### 3D Scene Diffing
Don't clear and rebuild the entire 3D scene on every change. Tag meshes with `userData.building = true`. On data change, remove old building meshes and rebuild. This is critical for performance.

### Coordinate System
- All coordinates are in **meters** in the data model
- 2D canvas converts via `toScreen(meters)` = meters × SCALE (SCALE = 50)
- 3D scene uses meters directly (1 unit = 1 meter)
- **SNAP_SIZE = 0.1m** (positioning snap, 10cm) — used by `snap()` for placement
- **GRID_SIZE = 0.5m** (visual grid spacing) — used by grid renderer
- Origin (0,0) is top-left of the floor plan

## Data Model Reference

### Wall
`{ id, type: 'wall', x1, y1, x2, y2, height, wallStyle?, thickness? }`
- `wallStyle`: `'standard' | 'porteur' | 'cloison' | 'exterieur'`
- `thickness`: number in meters (default 0.2)

### Opening
`{ id, type: 'door' | 'window', wallId, position, width, height, sillHeight?, doorStyle?, flipDoor?, swingOut?, windowStyle? }`
- `doorStyle`: `'standard' | 'sliding' | 'french' | 'sliding-glass' | 'arcade'`
- `windowStyle`: `'standard' | 'baie-vitree'`
- `flipDoor`: hinge side toggle
- `swingOut`: interior/exterior swing (standard doors only)

### RoomLabel
`{ id, type: 'label', name, cx, cy, area, floorMaterial? }`
- `floorMaterial`: `'parquet' | 'carrelage' | 'pelouse'`
- Auto-detected via room detection algorithm, or placed manually with label tool

### Furniture
`{ id, type: 'furniture', furnitureType, cx, cy, width, depth, height, rotation }`
- 13 types: `toilet, bed, kitchen-counter, armchair, table, chair, shower, bathtub, bathroom-cabinet, bookshelf, plant, cabinet, fridge`

### Terrain
`{ width, depth, offsetX, offsetY }` — optional outdoor ground plane, draggable

### FloorPlan
`{ walls, openings, labels, furniture, terrain? }`

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
| `src/types/tools.ts` | ToolType, DrawingState, DragState, PanState |
| `src/store/useFloorPlan.ts` | Floor plan CRUD + undo/redo — all mutations go here |
| `src/store/useEditor.ts` | UI state: tool, selection, view mode, showLabels, furnitureType |
| `src/editor2d/Canvas2D.tsx` | Main 2D component — zoom, pan, delegates to renderers |
| `src/editor2d/useCanvasInteraction.ts` | Mouse handlers: drawing, selection, dragging, panning |
| `src/editor2d/renderers/` | Pure 2D renderers (grid, walls, openings, labels, furniture, terrain) |
| `src/viewer3d/Scene3D.tsx` | Three.js scene setup + orbit controls |
| `src/viewer3d/SceneUpdater.ts` | Diffs data and updates 3D scene |
| `src/viewer3d/builders/` | 3D mesh builders (walls, doors, windows, floor, furniture, terrain) |
| `src/viewer3d/builders/materials.ts` | Shared Three.js materials (define once, reuse) |
| `src/utils/geometry.ts` | Math: snap, toScreen, toWorld, hitTest functions |
| `src/utils/defaults.ts` | Factory functions: createWall, createDoor, createWindow, createLabel, createFurniture |
| `src/utils/roomDetection.ts` | Planar face enumeration for auto room detection |
| `src/components/Toolbar.tsx` | Tool selection buttons |
| `src/components/PropertiesPanel.tsx` | Edit properties of selected element |
| `src/components/Header.tsx` | Top bar: file ops, AI import, detect rooms, terrain |
| `src/ai/prompts.ts` | AI prompts for floor plan detection |
| `src/ai/analyzeFloorPlan.ts` | AI response parsing → FloorPlan |

## 2D Interaction
- **Panning**: Right-click drag, Space+click drag, Alt+click drag, or middle-click drag
- **Zoom**: Scroll wheel (centered on mouse position)
- **Selection**: Uses raw (unsnapped) position for precise hit testing
- **Placement**: Uses snapped position (SNAP_SIZE = 0.1m) for grid-aligned positioning
- **Wall endpoint drag**: Auto-snaps connected walls sharing the same endpoint
- **Hit test priority** (select tool): openings → furniture → walls → labels → terrain

## Conventions
- Files: `camelCase.ts` for utils/hooks, `PascalCase.tsx` for components
- Types: defined in `src/types/`, imported everywhere
- No `any` — use `unknown` + type guards if type is uncertain
- Components: functional only, with hooks
- State: never local state for floor plan data — always Zustand store
- CSS: inline styles with theme tokens from `src/styles/theme.ts`
- IDs: always use `uid()` from `src/utils/ids.ts`
- UI language: French (labels, buttons, panel text)

## Common Tasks

### Add a new tool
1. Add to `ToolType` in `src/types/tools.ts`
2. Add button in `src/components/Toolbar.tsx`
3. Add mouse handler case in `src/editor2d/useCanvasInteraction.ts`
4. Add hint text in `src/components/ViewportSplit.tsx`
5. Add 2D renderer if needed in `src/editor2d/renderers/`
6. Add 3D builder if needed in `src/viewer3d/builders/`

### Add a new property to walls/openings
1. Update type in `src/types/index.ts`
2. Update creation function in `src/utils/defaults.ts`
3. Add UI control in `src/components/PropertiesPanel.tsx`
4. Update 2D renderer if visual change
5. Update 3D builder if visual change

### Add a new furniture type
1. Add to `FurnitureType` union in `src/types/index.ts`
2. Add dimensions in `FURNITURE_DEFAULTS` in `src/utils/defaults.ts`
3. Add to furniture selector in `src/components/Toolbar.tsx`
4. Add 2D rendering case in `src/editor2d/renderers/furnitureRenderer.ts`
5. Add 3D building case in `src/viewer3d/builders/furnitureBuilder.ts`

### Add a new door style
1. Add to `DoorStyle` type in `src/types/index.ts`
2. Add 2D rendering case in `src/editor2d/renderers/openingRenderer.ts`
3. Add 3D building case in `src/viewer3d/builders/doorBuilder.ts`
4. Add to style selector in `src/components/PropertiesPanel.tsx`
5. Update defaults in `src/utils/defaults.ts` if needed

### Add a new floor material
1. Add to `FloorMaterial` type in `src/types/index.ts`
2. Add label in `floorMaterialLabels` in `src/editor2d/renderers/labelRenderer.ts`
3. Create material in `src/viewer3d/builders/materials.ts`
4. Add to `materialMap` in `src/viewer3d/builders/floorBuilder.ts`
5. Add to `floorMaterials` array in `src/components/PropertiesPanel.tsx`

### Improve AI floor plan detection
1. Edit prompts in `src/ai/prompts.ts`
2. Parsing logic in `src/ai/analyzeFloorPlan.ts` — maps AI rooms to RoomLabel[]
3. Test with various floor plan images

## Architecture & Interior Design Guidelines

### Room Types (common French labels)
Salon, Chambre, Cuisine, Salle de bain, WC, Entrée, Couloir, Bureau, Buanderie, Terrasse, Balcon, Garage

### Standard Dimensions (meters)
- Wall height: 2.5m (default), thickness: 0.2m
- Standard door: 0.9m wide, 2.1m high
- French door: 1.4m wide, 2.1m high
- Sliding glass door: 2.0m wide, 2.1m high
- Standard window: 1.2m wide, 1.2m high, sill at 0.9m
- Bay window (baie vitrée): 2.0m wide, 2.1m high

### Floor Materials
- **Parquet**: Living rooms, bedrooms, hallways (warm wood tone)
- **Carrelage**: Kitchens, bathrooms, WC, entries (cool tile)
- **Pelouse**: Outdoor areas, terraces, gardens (green)

### Furniture Placement
- Each furniture type has default dimensions in `FURNITURE_DEFAULTS`
- Rotation via PropertiesPanel (degrees)
- Draggable in select mode with snap

## Performance Gotchas
- THREE.js geometries and materials must be disposed to avoid memory leaks
- Canvas2D: batch draws, avoid save/restore in tight loops
- Zustand: use selectors to prevent unnecessary re-renders
- Don't create new Three.js materials on every render — define once in `materials.ts`, reuse
- 3D scene uses `userData.building = true` tag for cleanup — only remove tagged meshes on rebuild
