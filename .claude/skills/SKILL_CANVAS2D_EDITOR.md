# Skill: Canvas 2D Floor Plan Editor

## Purpose
Best practices for building an interactive 2D floor plan editor using the HTML Canvas API with React.

## Architecture: Separate Rendering from Interaction

### Renderers are pure functions
```typescript
// Each renderer takes the same signature:
type Renderer = (
  ctx: CanvasRenderingContext2D,
  data: FloorPlan,
  state: { selectedId: string | null; pan: Point; scale: number },
) => void;

// Compose renderers in order:
function renderFrame(ctx, data, state) {
  clearCanvas(ctx);
  ctx.save();
  ctx.translate(state.pan.x, state.pan.y);
  
  renderGrid(ctx, state);
  renderBackgroundImage(ctx, state);
  renderFloorFill(ctx, data);
  renderWalls(ctx, data, state);
  renderOpenings(ctx, data, state);
  renderLabels(ctx, data, state);
  renderDrawingPreview(ctx, state);
  
  ctx.restore();
}
```

### Interaction hook is separate
```typescript
function useCanvasInteraction(canvasRef, data, setData, tool, setSelectedId) {
  // Returns mouse handlers: onMouseDown, onMouseMove, onMouseUp
  // Manages internal state: drawing, dragging, panning
}
```

## Coordinate Systems

### Two coordinate spaces:
1. **World space** (meters) — what the data model stores
2. **Screen space** (pixels) — what canvas draws

```typescript
const SCALE = 50; // pixels per meter
const GRID_SIZE = 0.5; // meters

const toScreen = (meters: number) => meters * SCALE;
const toWorld = (pixels: number) => pixels / SCALE;
const snap = (meters: number) => Math.round(meters / GRID_SIZE) * GRID_SIZE;
```

### Mouse position → world coordinates:
```typescript
function getWorldPos(event: MouseEvent, canvas: HTMLCanvasElement, pan: Point): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: snap(toWorld(event.clientX - rect.left - pan.x)),
    y: snap(toWorld(event.clientY - rect.top - pan.y)),
  };
}
```

## Wall Hit Testing

For selecting walls with mouse click:
```typescript
function findWallAt(walls: Wall[], mx: number, my: number, threshold = 0.4): { wall: Wall; t: number } | null {
  for (const w of walls) {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    // Project point onto wall line segment
    const t = Math.max(0, Math.min(1, ((mx - w.x1) * dx + (my - w.y1) * dy) / (len * len)));
    const px = w.x1 + t * dx, py = w.y1 + t * dy;
    const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
    if (dist < threshold) return { wall: w, t };
  }
  return null;
}
```

The `t` value (0-1) is useful for placing doors/windows at the click position.

## Drawing Architectural Elements

### Walls
```typescript
function drawWall(ctx, wall, isSelected) {
  ctx.strokeStyle = isSelected ? "#f59e0b" : "#c8bea8";
  ctx.lineWidth = isSelected ? 8 : 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(toScreen(wall.x1), toScreen(wall.y1));
  ctx.lineTo(toScreen(wall.x2), toScreen(wall.y2));
  ctx.stroke();
}
```

### Doors (arc swing + jambs)
```typescript
function drawDoor(ctx, door, wall, isSelected) {
  // 1. Translate to door position on wall
  // 2. Rotate to wall angle
  // 3. Clear wall behind door (draw background color line)
  // 4. Draw door arc (quarter circle)
  // 5. Draw door panel line
  // 6. Draw jamb squares at both ends
}
```

### Windows (double parallel lines + center divider)
```typescript
function drawWindow(ctx, window, wall, isSelected) {
  // 1. Translate to window position on wall
  // 2. Rotate to wall angle
  // 3. Clear wall behind window
  // 4. Draw two parallel lines (inner/outer)
  // 5. Draw center divider
  // 6. Draw bounding rectangle
}
```

### Dimension labels
Show wall length at the midpoint, offset perpendicular:
```typescript
const angle = Math.atan2(dy, dx);
const offsetX = -Math.sin(angle) * 14;
const offsetY = Math.cos(angle) * 14;
ctx.fillText(`${length.toFixed(1)}m`, midX + offsetX, midY + offsetY);
```

## Pan & Zoom

### Pan with Alt+drag or middle mouse:
```typescript
if (event.button === 1 || (event.button === 0 && event.altKey)) {
  startPanning(event);
}
```

### Apply pan as canvas translate (before all drawing):
```typescript
ctx.translate(pan.x, pan.y);
```

### Grid must account for pan offset:
```typescript
for (let x = -pan.x; x < canvasWidth; x += gridPixels) {
  // draw vertical line at x
}
```

## Performance

### Only redraw on state change:
```typescript
useEffect(() => {
  const frameId = requestAnimationFrame(() => renderFrame(ctx, data, state));
  return () => cancelAnimationFrame(frameId);
}, [data, selectedId, pan, tool, drawing]);
```

### Canvas resize handling:
```typescript
useEffect(() => {
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    canvas.width = width;
    canvas.height = height;
  });
  observer.observe(canvas.parentElement);
  return () => observer.disconnect();
}, []);
```

## Interaction State Machine

The canvas editor has these interaction modes:
```
idle → drawing (wall tool + mousedown)
idle → selecting (select tool + mousedown on element)
idle → dragging (select tool + mousedown on wall + mousemove)
idle → panning (alt+mousedown or middle click)
idle → placing (door/window tool + click on wall)
```

Each mode has its own mousemove and mouseup behavior. Use a single state variable:
```typescript
type InteractionMode = 
  | { type: 'idle' }
  | { type: 'drawing'; start: Point }
  | { type: 'dragging'; wallId: string; startPos: Point; origWall: Wall }
  | { type: 'panning'; startMouse: Point; startPan: Point };
```
