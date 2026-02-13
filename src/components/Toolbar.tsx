import { useFloorPlan } from '../store/useFloorPlan';
import { useEditor } from '../store/useEditor';
import type { ToolDefinition } from '../types/tools';
import type { FurnitureType } from '../types';
import { FURNITURE_DEFAULTS } from '../utils/defaults';
import { colors, fonts } from '../styles/theme';

const tools: ToolDefinition[] = [
  { id: 'select', label: 'Select', icon: '⊹' },
  { id: 'wall', label: 'Mur', icon: '▬' },
  { id: 'door', label: 'Porte', icon: '▯' },
  { id: 'window', label: 'Fenêtre', icon: '⊞' },
  { id: 'label', label: 'Label', icon: '◉' },
  { id: 'furniture', label: 'Meuble', icon: '⌂' },
];

const furnitureTypes: { value: FurnitureType; icon: string }[] = [
  { value: 'table', icon: '▦' },
  { value: 'chair', icon: '▣' },
  { value: 'bed', icon: '▬' },
  { value: 'armchair', icon: '◐' },
  { value: 'toilet', icon: '◎' },
  { value: 'shower', icon: '▤' },
  { value: 'bathtub', icon: '▭' },
  { value: 'bathroom-cabinet', icon: '▫' },
  { value: 'kitchen-counter', icon: '▥' },
  { value: 'fridge', icon: '▮' },
  { value: 'bookshelf', icon: '▰' },
  { value: 'cabinet', icon: '▪' },
  { value: 'plant', icon: '✿' },
];

export function Toolbar() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const selectedId = useEditor((s) => s.selectedId);
  const setSelectedId = useEditor((s) => s.setSelectedId);
  const furnitureType = useEditor((s) => s.furnitureType);
  const setFurnitureType = useEditor((s) => s.setFurnitureType);
  const deleteItem = useFloorPlan((s) => s.deleteItem);
  const reset = useFloorPlan((s) => s.reset);
  const setBgImage = useEditor((s) => s.setBgImage);

  const handleDelete = () => {
    if (selectedId) {
      deleteItem(selectedId);
      setSelectedId(null);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedId(null);
    setBgImage(null);
  };

  return (
    <div
      style={{
        width: 56, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '12px 0', gap: 3,
        borderRight: `1px solid ${colors.borderSubtle}`, background: colors.bgPanel,
      }}
    >
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            width: 44, height: 44, border: 'none', borderRadius: 9,
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1,
            fontFamily: fonts.mono,
            background: tool === t.id ? colors.accentBg : 'transparent',
            color: tool === t.id ? colors.accent : colors.textMuted,
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 7, letterSpacing: 1 }}>{t.label.toUpperCase()}</span>
        </button>
      ))}

      {/* Furniture type sub-selector */}
      {tool === 'furniture' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            padding: '6px 0', borderTop: `1px solid ${colors.borderSubtle}`,
            borderBottom: `1px solid ${colors.borderSubtle}`,
          }}
        >
          {furnitureTypes.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setFurnitureType(ft.value)}
              title={FURNITURE_DEFAULTS[ft.value].label}
              style={{
                width: 44, height: 30, border: 'none', borderRadius: 6,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 0,
                fontFamily: fonts.mono,
                background: furnitureType === ft.value ? colors.accentBgSubtle : 'transparent',
                color: furnitureType === ft.value ? colors.accent : colors.textDim,
              }}
            >
              <span style={{ fontSize: 12 }}>{ft.icon}</span>
              <span style={{ fontSize: 6, letterSpacing: 0.5 }}>
                {FURNITURE_DEFAULTS[ft.value].label.toUpperCase().slice(0, 8)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={!selectedId}
        style={{
          width: 44, height: 44, border: 'none', borderRadius: 9,
          cursor: selectedId ? 'pointer' : 'default',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
          fontFamily: fonts.mono,
          background: selectedId ? colors.dangerBg : 'transparent',
          color: selectedId ? colors.danger : 'rgba(255,255,255,0.15)',
          opacity: selectedId ? 1 : 0.5,
        }}
      >
        <span style={{ fontSize: 14 }}>✕</span>
        <span style={{ fontSize: 7 }}>SUPPR</span>
      </button>

      {/* Reset button */}
      <button
        onClick={handleReset}
        style={{
          width: 44, height: 44, border: 'none', borderRadius: 9,
          cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
          fontFamily: fonts.mono, background: 'transparent', color: colors.textDim,
        }}
      >
        <span style={{ fontSize: 13 }}>↺</span>
        <span style={{ fontSize: 7 }}>RESET</span>
      </button>
    </div>
  );
}
