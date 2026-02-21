import { useState, useCallback, type MouseEvent } from 'react';
import type { FloorPlan, RoomLabel, Furniture, FurnitureType, TechnicalPoint, TechnicalPointType, Terrain } from '../types';
import type { ToolType, DrawingState, DragState, PanState } from '../types/tools';
import { snap, toWorld, distance, wallHitTest, openingHitTest, labelHitTest, labelVertexHitTest } from '../utils/geometry';
import { createWall, createDoor, createWindow, createLabel, createFurniture, createTechnicalPoint } from '../utils/defaults';

interface UseCanvasInteractionParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  data: FloorPlan;
  tool: ToolType;
  pan: PanState;
  zoom: number;
  spaceHeld: boolean;
  setPan: (pan: PanState) => void;
  addWall: (wall: FloorPlan['walls'][0]) => void;
  addOpening: (opening: FloorPlan['openings'][0]) => void;
  addLabel: (label: RoomLabel) => void;
  addFurniture: (furniture: Furniture) => void;
  addTechnicalPoint: (point: TechnicalPoint) => void;
  furnitureType: FurnitureType;
  technicalPointType: TechnicalPointType;
  setData: (updater: FloorPlan | ((prev: FloorPlan) => FloorPlan)) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

function furnitureHitTest(
  furniture: Furniture[],
  mx: number,
  my: number,
  threshold = 0.8
): Furniture | null {
  for (const f of furniture) {
    // Simple distance check from center
    const d = distance(mx, my, f.cx, f.cy);
    const maxDim = Math.max(f.width, f.depth) / 2 + threshold * 0.5;
    if (d < maxDim) return f;
  }
  return null;
}

function technicalPointHitTest(
  points: TechnicalPoint[],
  mx: number,
  my: number,
  threshold = 0.5
): TechnicalPoint | null {
  for (const tp of points) {
    const d = distance(mx, my, tp.cx, tp.cy);
    if (d < threshold) return tp;
  }
  return null;
}

function terrainHitTest(
  terrain: Terrain | undefined,
  mx: number,
  my: number,
  edgeThreshold = 0.8
): boolean {
  if (!terrain) return false;
  const { offsetX, offsetY, width, depth } = terrain;
  // Check if near any edge of the terrain rectangle
  const inX = mx >= offsetX - edgeThreshold && mx <= offsetX + width + edgeThreshold;
  const inY = my >= offsetY - edgeThreshold && my <= offsetY + depth + edgeThreshold;
  if (!inX || !inY) return false;
  // Near top/bottom edge or left/right edge
  const nearLeft = Math.abs(mx - offsetX) < edgeThreshold;
  const nearRight = Math.abs(mx - (offsetX + width)) < edgeThreshold;
  const nearTop = Math.abs(my - offsetY) < edgeThreshold;
  const nearBottom = Math.abs(my - (offsetY + depth)) < edgeThreshold;
  return nearLeft || nearRight || nearTop || nearBottom;
}

export function useCanvasInteraction({
  canvasRef,
  data,
  tool,
  pan,
  zoom,
  spaceHeld,
  setPan,
  addWall,
  addOpening,
  addLabel,
  addFurniture,
  addTechnicalPoint,
  furnitureType,
  technicalPointType,
  setData,
  selectedId,
  setSelectedId,
}: UseCanvasInteractionParams) {
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<PanState | null>(null);

  // Raw world position (no snap) — for hit testing & selection
  const getRawPos = useCallback(
    (e: MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      return {
        x: toWorld((e.clientX - r.left - pan.x) / zoom),
        y: toWorld((e.clientY - r.top - pan.y) / zoom),
      };
    },
    [canvasRef, pan, zoom]
  );

  // Snapped world position — for placement & drawing
  const getPos = useCallback(
    (e: MouseEvent) => {
      const raw = getRawPos(e);
      return { x: snap(raw.x), y: snap(raw.y) };
    },
    [getRawPos]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2 || (e.button === 0 && (e.altKey || spaceHeld))) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      const pos = getPos(e);
      const raw = getRawPos(e); // unsnapped — for precise hit testing

      if (tool === 'wall') {
        setDrawing({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      } else if (tool === 'label') {
        const lbl = createLabel(pos.x, pos.y);
        addLabel(lbl);
        setSelectedId(lbl.id);
      } else if (tool === 'furniture') {
        const f = createFurniture(furnitureType, pos.x, pos.y);
        addFurniture(f);
        setSelectedId(f.id);
      } else if (tool === 'technical') {
        const tp = createTechnicalPoint(technicalPointType, pos.x, pos.y);
        addTechnicalPoint(tp);
        setSelectedId(tp.id);
      } else if (tool === 'select') {
        // Use raw (unsnapped) position for hit testing — much more precise
        // Priority: selected label vertices → openings → furniture → walls → labels → terrain

        // If a label is selected and has a polygon, check vertex handles first
        // (vertices sit on walls, so they must be checked before wallHitTest)
        const selectedLabel = selectedId
          ? data.labels.find((l) => l.id === selectedId && l.polygon && l.polygon.length >= 3)
          : null;
        if (selectedLabel) {
          const vh = labelVertexHitTest([selectedLabel], raw.x, raw.y);
          if (vh) {
            setDragging({
              type: 'label-vertex',
              itemId: vh.label.id,
              startX: pos.x,
              startY: pos.y,
              vertexIndex: vh.vertexIndex,
              origPolygon: vh.label.polygon!.map((p) => ({ ...p })),
            });
            return;
          }
        }

        // Check openings first (they sit on walls, so check them before walls)
        const oh = openingHitTest(data.openings, data.walls, raw.x, raw.y, 1.0);
        if (oh) {
          setSelectedId(oh.opening.id);
        } else {
          // Check technical points
          const tph = technicalPointHitTest(data.technicalPoints || [], raw.x, raw.y);
          if (tph) {
            setSelectedId(tph.id);
            setDragging({
              type: 'technical-point',
              itemId: tph.id,
              startX: pos.x,
              startY: pos.y,
              origTechnicalPoint: { cx: tph.cx, cy: tph.cy },
            });
          } else {
          // Check furniture
          const fh = furnitureHitTest(data.furniture || [], raw.x, raw.y);
          if (fh) {
            setSelectedId(fh.id);
            setDragging({
              type: 'furniture',
              itemId: fh.id,
              startX: pos.x,
              startY: pos.y,
              origFurniture: { cx: fh.cx, cy: fh.cy },
            });
          } else {
            // Check walls
            const hit = wallHitTest(data.walls, raw.x, raw.y);
            if (hit) {
              setSelectedId(hit.wall.id);
              // Check if near an endpoint (for resizing)
              const d1 = distance(raw.x, raw.y, hit.wall.x1, hit.wall.y1);
              const d2 = distance(raw.x, raw.y, hit.wall.x2, hit.wall.y2);
              const epThreshold = 0.8;
              if (d1 < epThreshold) {
                setDragging({
                  type: 'wall-endpoint',
                  itemId: hit.wall.id,
                  startX: pos.x,
                  startY: pos.y,
                  endpoint: 'p1',
                  origWall: { x1: hit.wall.x1, y1: hit.wall.y1, x2: hit.wall.x2, y2: hit.wall.y2 },
                });
              } else if (d2 < epThreshold) {
                setDragging({
                  type: 'wall-endpoint',
                  itemId: hit.wall.id,
                  startX: pos.x,
                  startY: pos.y,
                  endpoint: 'p2',
                  origWall: { x1: hit.wall.x1, y1: hit.wall.y1, x2: hit.wall.x2, y2: hit.wall.y2 },
                });
              } else {
                setDragging({
                  type: 'wall',
                  itemId: hit.wall.id,
                  startX: pos.x,
                  startY: pos.y,
                  origWall: { x1: hit.wall.x1, y1: hit.wall.y1, x2: hit.wall.x2, y2: hit.wall.y2 },
                });
              }
            } else {
              // Check labels
              const lh = labelHitTest(data.labels, raw.x, raw.y);
              if (lh) {
                setSelectedId(lh.label.id);
                setDragging({
                  type: 'label',
                  itemId: lh.label.id,
                  startX: pos.x,
                  startY: pos.y,
                  origLabel: { cx: lh.label.cx, cy: lh.label.cy },
                });
              } else if (terrainHitTest(data.terrain, raw.x, raw.y)) {
                // Terrain drag
                setSelectedId(null);
                setDragging({
                  type: 'terrain',
                  itemId: 'terrain',
                  startX: pos.x,
                  startY: pos.y,
                  origTerrain: {
                    offsetX: data.terrain!.offsetX,
                    offsetY: data.terrain!.offsetY,
                  },
                });
              } else {
                setSelectedId(null);
              }
            }
          }
          }
        }
      } else if (tool === 'door' || tool === 'window') {
        // Use raw for hit testing, but snapped t for position
        const hit = wallHitTest(data.walls, raw.x, raw.y);
        if (hit) {
          const o =
            tool === 'door'
              ? createDoor(hit.wall.id, hit.t)
              : createWindow(hit.wall.id, hit.t);
          addOpening(o);
          setSelectedId(o.id);
        }
      }
    },
    [tool, data, pan, zoom, spaceHeld, selectedId, getPos, getRawPos, addOpening, addLabel, addFurniture, addTechnicalPoint, furnitureType, technicalPointType, setSelectedId]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning && panStart) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
      }

      const pos = getPos(e);

      if (drawing) {
        setDrawing((d) => (d ? { ...d, x2: pos.x, y2: pos.y } : null));
      }

      if (dragging) {
        const dx = pos.x - dragging.startX;
        const dy = pos.y - dragging.startY;

        if (dragging.type === 'wall-endpoint' && dragging.origWall && dragging.endpoint) {
          const newX = snap(dragging.endpoint === 'p1' ? dragging.origWall.x1 + dx : dragging.origWall.x2 + dx);
          const newY = snap(dragging.endpoint === 'p1' ? dragging.origWall.y1 + dy : dragging.origWall.y2 + dy);
          // Find other walls sharing this endpoint and move them too
          const origPt = dragging.endpoint === 'p1'
            ? { x: dragging.origWall.x1, y: dragging.origWall.y1 }
            : { x: dragging.origWall.x2, y: dragging.origWall.y2 };

          setData((d) => ({
            ...d,
            walls: d.walls.map((w) => {
              if (w.id === dragging.itemId) {
                return {
                  ...w,
                  ...(dragging.endpoint === 'p1'
                    ? { x1: newX, y1: newY }
                    : { x2: newX, y2: newY }),
                };
              }
              // Auto-snap: move endpoints of other walls that share this point
              const ep1Match = Math.abs(w.x1 - origPt.x) < 0.01 && Math.abs(w.y1 - origPt.y) < 0.01;
              const ep2Match = Math.abs(w.x2 - origPt.x) < 0.01 && Math.abs(w.y2 - origPt.y) < 0.01;
              if (ep1Match || ep2Match) {
                return {
                  ...w,
                  ...(ep1Match ? { x1: newX, y1: newY } : {}),
                  ...(ep2Match ? { x2: newX, y2: newY } : {}),
                };
              }
              return w;
            }),
          }));
        } else if (dragging.type === 'wall' && dragging.origWall) {
          setData((d) => ({
            ...d,
            walls: d.walls.map((w) =>
              w.id === dragging.itemId
                ? {
                    ...w,
                    x1: snap(dragging.origWall!.x1 + dx),
                    y1: snap(dragging.origWall!.y1 + dy),
                    x2: snap(dragging.origWall!.x2 + dx),
                    y2: snap(dragging.origWall!.y2 + dy),
                  }
                : w
            ),
          }));
        } else if (dragging.type === 'technical-point' && dragging.origTechnicalPoint) {
          setData((d) => ({
            ...d,
            technicalPoints: (d.technicalPoints || []).map((tp) =>
              tp.id === dragging.itemId
                ? {
                    ...tp,
                    cx: snap(dragging.origTechnicalPoint!.cx + dx),
                    cy: snap(dragging.origTechnicalPoint!.cy + dy),
                  }
                : tp
            ),
          }));
        } else if (dragging.type === 'furniture' && dragging.origFurniture) {
          setData((d) => ({
            ...d,
            furniture: (d.furniture || []).map((f) =>
              f.id === dragging.itemId
                ? {
                    ...f,
                    cx: snap(dragging.origFurniture!.cx + dx),
                    cy: snap(dragging.origFurniture!.cy + dy),
                  }
                : f
            ),
          }));
        } else if (dragging.type === 'label-vertex' && dragging.origPolygon != null && dragging.vertexIndex != null) {
          const vi = dragging.vertexIndex;
          const newX = snap(dragging.origPolygon[vi]!.x + dx);
          const newY = snap(dragging.origPolygon[vi]!.y + dy);
          setData((d) => ({
            ...d,
            labels: d.labels.map((l) => {
              if (l.id !== dragging.itemId || !l.polygon) return l;
              const newPoly = l.polygon.map((p, i) =>
                i === vi ? { x: newX, y: newY } : p
              );
              return { ...l, polygon: newPoly };
            }),
          }));
        } else if (dragging.type === 'label' && dragging.origLabel) {
          setData((d) => ({
            ...d,
            labels: d.labels.map((l) =>
              l.id === dragging.itemId
                ? {
                    ...l,
                    cx: snap(dragging.origLabel!.cx + dx),
                    cy: snap(dragging.origLabel!.cy + dy),
                  }
                : l
            ),
          }));
        } else if (dragging.type === 'terrain' && dragging.origTerrain) {
          setData((d) => ({
            ...d,
            terrain: d.terrain
              ? {
                  ...d.terrain,
                  offsetX: snap(dragging.origTerrain!.offsetX + dx),
                  offsetY: snap(dragging.origTerrain!.offsetY + dy),
                }
              : d.terrain,
          }));
        }
      }
    },
    [isPanning, panStart, drawing, dragging, getPos, setPan, setData]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (drawing) {
      const dx = drawing.x2 - drawing.x1;
      const dy = drawing.y2 - drawing.y1;
      if (Math.sqrt(dx * dx + dy * dy) > 0.3) {
        const w = createWall(drawing.x1, drawing.y1, drawing.x2, drawing.y2);
        addWall(w);
        setSelectedId(w.id);
      }
      setDrawing(null);
    }

    setDragging(null);
  }, [isPanning, drawing, addWall, setSelectedId]);

  return {
    drawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
