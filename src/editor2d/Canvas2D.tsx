import { useRef, useEffect, useState, useCallback } from 'react';
import { useFloorPlan } from '../store/useFloorPlan';
import { useEditor } from '../store/useEditor';
import type { PanState } from '../types/tools';
import { useCanvasInteraction } from './useCanvasInteraction';
import { renderGrid } from './renderers/gridRenderer';
import { renderWalls } from './renderers/wallRenderer';
import { renderOpenings } from './renderers/openingRenderer';
import { renderLabels } from './renderers/labelRenderer';
import { renderFurniture } from './renderers/furnitureRenderer';
import { renderTerrain } from './renderers/terrainRenderer';
import { renderDrawingPreview } from './renderers/drawingPreview';
import { renderBackgroundImage } from './backgroundImage';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const [pan, setPan] = useState<PanState>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState(1);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const data = useFloorPlan((s) => s.data);
  const setData = useFloorPlan((s) => s.setData);
  const addWall = useFloorPlan((s) => s.addWall);
  const addOpening = useFloorPlan((s) => s.addOpening);
  const addLabel = useFloorPlan((s) => s.addLabel);
  const addFurniture = useFloorPlan((s) => s.addFurniture);

  const tool = useEditor((s) => s.tool);
  const selectedId = useEditor((s) => s.selectedId);
  const setSelectedId = useEditor((s) => s.setSelectedId);
  const bgImage = useEditor((s) => s.bgImage);
  const showLabels = useEditor((s) => s.showLabels);
  const furnitureType = useEditor((s) => s.furnitureType);

  // Space bar for pan mode
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useEffect(() => {
    if (bgImage) {
      const img = new Image();
      img.onload = () => {
        bgImgRef.current = img;
      };
      img.src = bgImage;
    } else {
      bgImgRef.current = null;
    }
  }, [bgImage]);

  const { drawing, handleMouseDown, handleMouseMove, handleMouseUp } =
    useCanvasInteraction({
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
      furnitureType,
      setData,
      setSelectedId,
    });

  // Scroll-wheel zoom centered on mouse
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const direction = e.deltaY < 0 ? 1 : -1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + direction * ZOOM_STEP * zoom));

      // Adjust pan so the point under the mouse stays in place
      const scale = newZoom / zoom;
      setPan({
        x: mouseX - (mouseX - pan.x) * scale,
        y: mouseY - (mouseY - pan.y) * scale,
      });
      setZoom(newZoom);
    },
    [zoom, pan]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = canvas.parentElement?.clientWidth ?? 800);
    const H = (canvas.height = canvas.parentElement?.clientHeight ?? 600);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1f';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (bgImgRef.current) {
      renderBackgroundImage(ctx, bgImgRef.current);
    }

    renderGrid(ctx, W, H, pan.x, pan.y, zoom);

    if (data.terrain) {
      renderTerrain(ctx, data.terrain);
    }

    renderWalls(ctx, data.walls, selectedId);
    renderOpenings(ctx, data.openings, data.walls, selectedId);

    if (data.furniture?.length) {
      renderFurniture(ctx, data.furniture, selectedId);
    }

    renderLabels(ctx, data.labels, selectedId, showLabels);

    if (drawing) {
      renderDrawingPreview(ctx, drawing);
    }

    ctx.restore();

    // Zoom indicator
    if (zoom !== 1) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.round(zoom * 100)}%`, W - 50, H - 10);
      ctx.restore();
    }
  }, [data, drawing, selectedId, pan, zoom, showLabels]);

  useEffect(() => {
    render();
  }, [render]);

  // Resize handler
  useEffect(() => {
    const h = () => {
      const c = canvasRef.current;
      if (c && c.parentElement) {
        c.width = c.parentElement.clientWidth;
        c.height = c.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const cursor = spaceHeld
    ? 'grab'
    : tool === 'wall' || tool === 'label' || tool === 'furniture'
      ? 'crosshair'
      : tool === 'select'
        ? 'default'
        : 'pointer';

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
