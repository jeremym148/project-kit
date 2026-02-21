import { useMemo, useState, useCallback } from 'react';
import { useEditor } from '../store/useEditor';
import { useFloorPlan } from '../store/useFloorPlan';
import { useVersionStore } from '../store/useVersionStore';
import { Canvas2D } from '../editor2d/Canvas2D';
import { Scene3D } from '../viewer3d/Scene3D';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { VersionPanel } from './VersionPanel';
import { ComparisonLegend } from './ComparisonLegend';
import { diffFloorPlans } from '../utils/diffFloorPlan';
import { colors, fonts } from '../styles/theme';
import type { PanState } from '../types/tools';

export function ViewportSplit() {
  const view = useEditor((s) => s.view);
  const tool = useEditor((s) => s.tool);
  const bgImage = useEditor((s) => s.bgImage);
  const setBgImage = useEditor((s) => s.setBgImage);

  const data = useFloorPlan((s) => s.data);
  const snapshots = useVersionStore((s) => s.snapshots);
  const baselineId = useVersionStore((s) => s.baselineId);
  const compareMode = useVersionStore((s) => s.compareMode);
  const showVersionPanel = useVersionStore((s) => s.showVersionPanel);

  const baseline = useMemo(
    () => snapshots.find((s) => s.id === baselineId) ?? null,
    [snapshots, baselineId]
  );

  const diff = useMemo(
    () => (baseline ? diffFloorPlans(baseline.data, data) : null),
    [baseline, data]
  );

  const diffOverlay = useMemo(
    () => (baseline && diff ? { baselineData: baseline.data, diff } : null),
    [baseline, diff]
  );

  // Synchronized pan/zoom for side-by-side comparison
  const [syncPan, setSyncPan] = useState<PanState>({ x: 40, y: 30 });
  const [syncZoom, setSyncZoom] = useState(1);
  const handlePanZoomChange = useCallback((pan: PanState, zoom: number) => {
    setSyncPan(pan);
    setSyncZoom(zoom);
  }, []);

  const show2D = view === '2d' || view === 'split';
  const show3D = view === '3d' || view === 'split';
  const isComparing = compareMode !== null && baseline !== null;
  const isSideBySide = isComparing && compareMode === 'side-by-side';
  const isOverlay = isComparing && compareMode === 'overlay';

  const toolHint =
    tool === 'wall'
      ? 'Cliquer + glisser → mur'
      : tool === 'door'
        ? 'Cliquer un mur → porte'
        : tool === 'window'
          ? 'Cliquer un mur → fenêtre'
          : tool === 'label'
            ? 'Cliquer → placer label'
            : tool === 'furniture'
              ? 'Cliquer → placer meuble'
              : tool === 'technical'
                ? 'Cliquer → placer point technique'
                : 'Sélection · Glisser · Suppr';

  // Side-by-side comparison layout
  if (isSideBySide) {
    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
          {/* Left pane: État actuel */}
          {show2D && (
            <div
              style={{
                flex: 1, position: 'relative',
                borderRight: `1px solid ${colors.border}`,
              }}
            >
              <Canvas2D
                dataOverride={baseline.data}
                readOnly
                syncPan={syncPan}
                syncZoom={syncZoom}
                onPanZoomChange={handlePanZoomChange}
              />
              <PaneLabel text="ÉTAT ACTUEL" color={colors.success} />
            </div>
          )}
          {show3D && show2D && (
            <div
              style={{
                flex: 1, position: 'relative',
                borderRight: `1px solid ${colors.border}`,
              }}
            >
              <Scene3D dataOverride={baseline.data} />
              {!show2D && <PaneLabel text="ÉTAT ACTUEL" color={colors.success} />}
            </div>
          )}
          {show3D && !show2D && (
            <div
              style={{
                flex: 1, position: 'relative',
                borderRight: `1px solid ${colors.border}`,
              }}
            >
              <Scene3D dataOverride={baseline.data} />
              <PaneLabel text="ÉTAT ACTUEL" color={colors.success} />
            </div>
          )}

          {/* Right pane: Rénovation */}
          {show2D && (
            <div style={{ flex: 1, position: 'relative' }}>
              <Canvas2D
                readOnly
                syncPan={syncPan}
                syncZoom={syncZoom}
                onPanZoomChange={handlePanZoomChange}
              />
              <PaneLabel text="RÉNOVATION" color={colors.accent} />
            </div>
          )}
          {show3D && show2D && (
            <div style={{ flex: 1, position: 'relative' }}>
              <Scene3D />
              {!show2D && <PaneLabel text="RÉNOVATION" color={colors.accent} />}
            </div>
          )}
          {show3D && !show2D && (
            <div style={{ flex: 1, position: 'relative' }}>
              <Scene3D />
              <PaneLabel text="RÉNOVATION" color={colors.accent} />
            </div>
          )}
        </div>

        {showVersionPanel && <VersionPanel />}
      </div>
    );
  }

  // Normal or overlay layout
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Toolbar (visible in 2D / split, hidden in overlay compare for cleaner view) */}
      {show2D && <Toolbar />}

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* 2D Canvas */}
        {show2D && (
          <div
            style={{
              flex: 1, position: 'relative',
              borderRight: view === 'split' ? `1px solid ${colors.border}` : 'none',
            }}
          >
            <Canvas2D diffOverlay={isOverlay ? diffOverlay : undefined} />
            <div
              style={{
                position: 'absolute', bottom: 10, left: 10,
                padding: '5px 10px', background: 'rgba(0,0,0,0.6)',
                borderRadius: 6, fontSize: 9, color: colors.textMuted,
                backdropFilter: 'blur(8px)',
              }}
            >
              {toolHint} · Alt+drag pan · Scroll zoom
            </div>
            {bgImage && !isOverlay && (
              <button
                onClick={() => setBgImage(null)}
                style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '5px 10px', background: 'rgba(0,0,0,0.7)',
                  borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 9,
                }}
              >
                ✕ Masquer référence
              </button>
            )}
            {isOverlay && <ComparisonLegend />}
          </div>
        )}

        {/* 3D Viewer */}
        {show3D && (
          <div style={{ flex: 1, position: 'relative' }}>
            <Scene3D diffOverlay={isOverlay ? diffOverlay : undefined} />
            <div
              style={{
                position: 'absolute', bottom: 10, left: 10,
                padding: '5px 10px', background: 'rgba(0,0,0,0.6)',
                borderRadius: 6, fontSize: 9, color: colors.textMuted,
                backdropFilter: 'blur(8px)',
              }}
            >
              Drag orbiter · Shift+drag pan · Scroll zoom
            </div>
            {isOverlay && !show2D && <ComparisonLegend />}
          </div>
        )}
      </div>

      {/* Properties panel (visible in 2D / split) */}
      {show2D && !showVersionPanel && <PropertiesPanel />}

      {/* Version panel */}
      {showVersionPanel && <VersionPanel />}
    </div>
  );
}

function PaneLabel({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        position: 'absolute', top: 10, left: 10,
        padding: '5px 12px', background: 'rgba(0,0,0,0.7)',
        borderRadius: 6, fontSize: 10, fontWeight: 700,
        color, fontFamily: fonts.mono, letterSpacing: 1,
        border: `1px solid ${color}33`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {text}
    </div>
  );
}
