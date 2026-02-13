import { useEditor } from '../store/useEditor';
import { Canvas2D } from '../editor2d/Canvas2D';
import { Scene3D } from '../viewer3d/Scene3D';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { colors } from '../styles/theme';

export function ViewportSplit() {
  const view = useEditor((s) => s.view);
  const tool = useEditor((s) => s.tool);
  const bgImage = useEditor((s) => s.bgImage);
  const setBgImage = useEditor((s) => s.setBgImage);

  const show2D = view === '2d' || view === 'split';
  const show3D = view === '3d' || view === 'split';

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
              : 'Sélection · Glisser · Suppr';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Toolbar (visible in 2D / split) */}
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
            <Canvas2D />
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
            {bgImage && (
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
          </div>
        )}

        {/* 3D Viewer */}
        {show3D && (
          <div style={{ flex: 1, position: 'relative' }}>
            <Scene3D />
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
          </div>
        )}
      </div>

      {/* Properties panel (visible in 2D / split when item selected) */}
      {show2D && <PropertiesPanel />}
    </div>
  );
}
