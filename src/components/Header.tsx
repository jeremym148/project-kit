import { useRef } from 'react';
import { useFloorPlan } from '../store/useFloorPlan';
import { useEditor } from '../store/useEditor';
import { useVersionStore } from '../store/useVersionStore';
import type { ViewMode } from '../types/tools';
import { exportProjectFile, importProjectFile, clearAutoSave } from '../utils/storage';
import { colors, fonts } from '../styles/theme';

const viewModes: ViewMode[] = ['2d', '3d', 'split'];

const btnStyle = {
  padding: '6px 12px',
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 7,
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontFamily: fonts.mono,
  fontSize: 10,
  fontWeight: 600,
} as const;

export function Header() {
  const data = useFloorPlan((s) => s.data);
  const setData = useFloorPlan((s) => s.setData);
  const reset = useFloorPlan((s) => s.reset);
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const showLabels = useEditor((s) => s.showLabels);
  const toggleLabels = useEditor((s) => s.toggleLabels);
  const showCeiling = useEditor((s) => s.showCeiling);
  const toggleCeiling = useEditor((s) => s.toggleCeiling);
  const setShowImport = useEditor((s) => s.setShowImport);
  const setSelectedId = useEditor((s) => s.setSelectedId);

  const showVersionPanel = useVersionStore((s) => s.showVersionPanel);
  const toggleVersionPanel = useVersionStore((s) => s.toggleVersionPanel);
  const compareMode = useVersionStore((s) => s.compareMode);
  const setCompareMode = useVersionStore((s) => s.setCompareMode);
  const baselineId = useVersionStore((s) => s.baselineId);
  const saveSnapshot = useVersionStore((s) => s.saveSnapshot);

  const detectRooms = useFloorPlan((s) => s.detectRooms);
  const setTerrain = useFloorPlan((s) => s.setTerrain);
  const doorCount = data.openings.filter((o) => o.type === 'door').length;
  const windowCount = data.openings.filter((o) => o.type === 'window').length;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    if (!confirm('Créer un nouveau projet ? Les modifications non sauvegardées seront perdues.')) return;
    clearAutoSave();
    reset({ walls: [], openings: [], labels: [], furniture: [] });
    setSelectedId(null);
  };

  const handleSave = () => {
    const name = prompt('Nom du projet:', 'Mon Plan') || 'Mon Plan';
    exportProjectFile(data, name);
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await importProjectFile(file);
      setData(project.data);
      setSelectedId(null);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Fichier invalide'}`);
    }
    // Reset input so same file can be re-opened
    e.target.value = '';
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: `1px solid ${colors.border}`,
        background: colors.bgHeader, zIndex: 10, flexWrap: 'wrap', gap: 8,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 'bold', color: '#111',
          }}
        >
          ⌂
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>FLOOR PLAN STUDIO</div>
          <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2 }}>2D / 3D EDITOR</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* File operations */}
        <button onClick={handleNew} style={btnStyle}>
          Nouveau
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>
          Ouvrir
        </button>
        <button onClick={handleSave} style={btnStyle}>
          Sauvegarder
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".floorplan,.json"
          style={{ display: 'none' }}
          onChange={handleOpen}
        />

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: colors.border }} />

        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '6px 14px', border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
            background: colors.accentBgSubtle, color: colors.accent,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          AI Import
        </button>

        <button
          onClick={detectRooms}
          style={{
            padding: '6px 12px', border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
            background: colors.accentBgSubtle, color: colors.accent,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          Detect Rooms
        </button>

        <button
          onClick={() => {
            if (data.terrain) {
              const wStr = prompt('Largeur du terrain (m):', String(data.terrain.width));
              if (!wStr) return;
              const dStr = prompt('Profondeur du terrain (m):', String(data.terrain.depth));
              if (!dStr) return;
              const tw = parseFloat(wStr);
              const td = parseFloat(dStr);
              if (isNaN(tw) || isNaN(td) || tw < 1 || td < 1) return;
              setTerrain({ ...data.terrain, width: tw, depth: td });
            } else {
              const wStr = prompt('Largeur du terrain (m):', '20');
              if (!wStr) return;
              const dStr = prompt('Profondeur du terrain (m):', '20');
              if (!dStr) return;
              const tw = parseFloat(wStr);
              const td = parseFloat(dStr);
              if (isNaN(tw) || isNaN(td) || tw < 1 || td < 1) return;
              setTerrain({ width: tw, depth: td, offsetX: -1, offsetY: -1 });
            }
          }}
          style={{
            padding: '6px 12px', border: `1px solid ${data.terrain ? colors.accentBorder : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 7,
            background: data.terrain ? colors.accentBgSubtle : 'rgba(255,255,255,0.04)',
            color: data.terrain ? colors.accent : colors.textMuted,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          {data.terrain ? `Terrain ${data.terrain.width}×${data.terrain.depth}m` : '⊞ Terrain'}
        </button>

        <button
          onClick={toggleLabels}
          style={{
            padding: '6px 12px', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 7,
            background: showLabels ? colors.windowBg : 'rgba(255,255,255,0.04)',
            color: showLabels ? colors.window : colors.textMuted,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          {showLabels ? '◉ Labels' : '○ Labels'}
        </button>

        <button
          onClick={toggleCeiling}
          style={{
            padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
            background: showCeiling ? colors.doorBg : 'rgba(255,255,255,0.04)',
            color: showCeiling ? colors.door : colors.textMuted,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          {showCeiling ? '⊟ Toit' : '⊞ Toit'}
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: colors.border }} />

        {/* Version controls */}
        <button
          onClick={() => {
            const name = prompt('Nom de la version:', `Version`);
            if (name) saveSnapshot(name);
          }}
          style={{
            padding: '6px 12px', border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
            background: colors.accentBgSubtle, color: colors.accent,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          💾 Version
        </button>

        <button
          onClick={toggleVersionPanel}
          style={{
            padding: '6px 12px', border: `1px solid ${showVersionPanel ? colors.accentBorder : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 7,
            background: showVersionPanel ? colors.accentBgSubtle : 'rgba(255,255,255,0.04)',
            color: showVersionPanel ? colors.accent : colors.textMuted,
            cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
          }}
        >
          {showVersionPanel ? '◉ Versions' : '○ Versions'}
        </button>

        {/* Comparison mode toggle */}
        <div
          style={{
            display: 'flex', background: colors.surface, borderRadius: 7,
            border: `1px solid ${baselineId ? colors.successBorder : colors.border}`,
            overflow: 'hidden',
            opacity: baselineId ? 1 : 0.4,
            pointerEvents: baselineId ? 'auto' : 'none',
          }}
        >
          {([null, 'side-by-side', 'overlay'] as const).map((mode) => {
            const label = mode === null ? 'Normal' : mode === 'side-by-side' ? 'Côte à côte' : 'Superposition';
            const active = compareMode === mode;
            return (
              <button
                key={mode ?? 'off'}
                onClick={() => setCompareMode(mode)}
                style={{
                  padding: '6px 10px', border: 'none', cursor: 'pointer',
                  fontSize: 9, fontWeight: 600, letterSpacing: 0.5, fontFamily: fonts.mono,
                  background: active ? colors.successBg : 'transparent',
                  color: active ? colors.success : colors.textMuted,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div
          style={{
            display: 'flex', background: colors.surface, borderRadius: 7,
            border: `1px solid ${colors.border}`, overflow: 'hidden',
          }}
        >
          {viewModes.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, letterSpacing: 1, fontFamily: fonts.mono,
                background: view === v ? colors.accentBg : 'transparent',
                color: view === v ? colors.accent : colors.textMuted,
              }}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: colors.textDim, padding: '0 8px' }}>
          <span>{data.walls.length} murs</span>
          <span>{doorCount} portes</span>
          <span>{windowCount} fenêtres</span>
        </div>
      </div>
    </div>
  );
}
