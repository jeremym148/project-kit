# 🏗️ FloorPlan Studio — Claude Code Init Prompt

Paste this into Claude Code to bootstrap the project.

---

## PROMPT TO PASTE:

```
I want to build "FloorPlan Studio" — a web app that converts 2D floor plans into interactive 3D models. I have a working monolithic React prototype (~900 lines in one file) that I need to restructure into a proper, scalable project.

## What the prototype already does:
- 2D canvas editor: draw walls, place doors/windows, select/drag/delete
- 3D Three.js viewer: walls extruded with doors, windows, glass, shadows
- Real-time 2D↔3D sync (shared data model)
- AI Import: upload floor plan image → Claude Vision API analyzes → generates digital plan
- Properties panel with sliders (wall height, door/window width & position)
- Split/2D/3D view modes, ceiling toggle, room labels
- Support for Israeli architectural plans (Hebrew labels, ממ"ד, etc.)

## What I need you to do NOW:

### 1. Init project structure
Create a Vite + React + TypeScript project with this architecture:

```
floorplan-studio/
├── CLAUDE.md                    # Project instructions for Claude Code
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # Main layout + state management
│   ├── types/
│   │   ├── index.ts             # All shared types (Wall, Door, Window, Opening, FloorPlan)
│   │   └── tools.ts             # Tool enum, editor state types
│   ├── store/
│   │   ├── useFloorPlan.ts      # Zustand store: walls, openings, CRUD, undo/redo
│   │   └── useEditor.ts         # Zustand store: tool, selection, view mode, UI state
│   ├── utils/
│   │   ├── geometry.ts          # snap, toScreen, toWorld, distance, wallHitTest, etc.
│   │   ├── wallOps.ts           # Wall segment splitting for openings, corner detection
│   │   ├── defaults.ts          # Default apartments (simple + Israeli plan)
│   │   └── ids.ts               # ID generation
│   ├── components/
│   │   ├── Header.tsx           # Top bar: logo, view toggle, AI import btn, stats
│   │   ├── Toolbar.tsx          # Left sidebar: tool buttons, delete, reset
│   │   ├── PropertiesPanel.tsx  # Right sidebar: selected item properties
│   │   ├── ViewportSplit.tsx    # Split/2D/3D layout manager
│   │   └── RoomLabels.tsx       # Room name/area overlay logic
│   ├── editor2d/
│   │   ├── Canvas2D.tsx         # Main 2D canvas component
│   │   ├── useCanvasInteraction.ts  # Mouse handlers: draw, select, drag, pan
│   │   ├── renderers/
│   │   │   ├── gridRenderer.ts      # Draw grid + meter lines
│   │   │   ├── wallRenderer.ts      # Draw walls + dimensions
│   │   │   ├── openingRenderer.ts   # Draw doors (arcs) + windows
│   │   │   ├── labelRenderer.ts     # Draw room labels
│   │   │   └── drawingPreview.ts    # Draw in-progress wall preview
│   │   └── backgroundImage.ts       # Reference image overlay
│   ├── viewer3d/
│   │   ├── Scene3D.tsx              # Three.js scene setup, camera, lights
│   │   ├── useOrbitControls.ts      # Manual orbit/pan/zoom controls
│   │   ├── builders/
│   │   │   ├── wallBuilder.ts       # Build wall meshes with opening cutouts
│   │   │   ├── floorBuilder.ts      # Build floor + optional ceiling
│   │   │   ├── doorBuilder.ts       # Build door meshes + frames
│   │   │   ├── windowBuilder.ts     # Build window glass + frames
│   │   │   └── materials.ts         # All Three.js materials (PBR)
│   │   └── SceneUpdater.ts          # Reconcile data model → 3D scene
│   ├── ai/
│   │   ├── AIImportModal.tsx        # Upload modal UI
│   │   ├── analyzeFloorPlan.ts      # Claude Vision API call + response parsing
│   │   └── prompts.ts              # AI system prompts (separate for easy iteration)
│   └── styles/
│       └── theme.ts                 # Color tokens, shared style constants
```

### 2. Key technical decisions:
- **Zustand** for state (lightweight, no boilerplate, supports undo/redo with middleware)
- **TypeScript** strict mode — all types defined upfront
- **Vite** for dev speed
- **Three.js** directly (not react-three-fiber — we need low-level scene control for performance)
- **Canvas 2D API** directly (not a canvas library — full control)
- Separate rendering into pure functions that take (ctx, data, state) → draw

### 3. The data model (source of truth):
```typescript
interface Wall {
  id: string;
  x1: number; y1: number;  // start point in meters
  x2: number; y2: number;  // end point in meters
  thickness: number;        // default 0.15m
  height: number;           // default 2.8m
  label?: string;
}

interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;           // parent wall reference
  position: number;         // 0-1 along wall
  width: number;            // meters
  height: number;           // meters
  sillHeight?: number;      // windows only
}

interface FloorPlan {
  walls: Wall[];
  openings: Opening[];
  metadata?: {
    name: string;
    rooms: RoomLabel[];
  };
}
```

### 4. CRITICAL performance patterns:
- 3D scene: don't recreate all meshes on every change. Diff the data and update only changed meshes.
- 2D canvas: use requestAnimationFrame, only redraw on data change.
- Split views: lazy-mount 3D viewer (heavy) only when visible.

### 5. Copy my prototype
Here's my working prototype code for reference. Extract logic from it but restructure into the architecture above:

[I will paste the prototype file separately]

### 6. After scaffolding, create CLAUDE.md with:
- Project overview and architecture
- How to run (npm run dev)
- Key conventions (file naming, state management patterns)
- Common tasks and where to find code
- Testing approach

Start by creating all files with the proper structure. Use the prototype as reference for the actual logic — don't lose any functionality. Every feature in the prototype must work in the restructured version.
```

---

## FOLLOW-UP PROMPTS (use after init):

### Paste the prototype:
```
Here's my working prototype. Extract all logic and distribute into the architecture you just created. Don't lose any feature:

[paste apartment-editor.jsx content]
```

### Add undo/redo:
```
Add undo/redo support to the Zustand store using temporal middleware. 
Ctrl+Z = undo, Ctrl+Shift+Z = redo.
Show undo/redo buttons in the toolbar with disabled states.
```

### Add wall snapping:
```
When drawing a new wall, if the endpoint is within 0.3m of an existing wall endpoint, snap to it (magnetic corners). Show a visual indicator (green dot) when snapping will occur. This is critical for making connected rooms.
```

### Add furniture placement:
```
Add a furniture catalog with basic items: bed, desk, table, chair, sofa, bathtub, toilet, sink.
Simple box/cylinder geometries in 3D, simple rectangle/circle outlines in 2D.
Click to place, drag to move, R to rotate 90°.
Store in FloorPlan as a new 'furniture' array.
```

### Improve 3D realism:
```
Upgrade the 3D viewer:
1. Add baseboards (plinths) along wall bottoms - thin dark strip
2. Add a wooden floor texture using a procedural pattern (planks)
3. Improve window glass with environment reflection
4. Add subtle ambient occlusion via SSAO post-processing
5. Add a skybox or gradient background instead of flat color
```

### Export features:
```
Add export capabilities:
1. Export as PNG (screenshot 2D or 3D view)
2. Export floor plan as JSON (for save/load)
3. Import JSON floor plan
4. Calculate and display total area per room
```
