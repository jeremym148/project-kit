import { useFloorPlan } from '../store/useFloorPlan';
import { useEditor } from '../store/useEditor';
import type { Wall, Opening, RoomLabel, Furniture, TechnicalPoint, DoorStyle, WindowStyle, WallStyle, FloorMaterial } from '../types';
import { FURNITURE_DEFAULTS, TECHNICAL_POINT_DEFAULTS } from '../utils/defaults';
import { snap } from '../utils/geometry';
import { colors, fonts } from '../styles/theme';

const doorStyles: { value: DoorStyle; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'sliding', label: 'Coulissant' },
  { value: 'french', label: 'Porte-fenêtre' },
  { value: 'sliding-glass', label: 'Baie vitrée coulissante' },
  { value: 'arcade', label: 'Arcade / Passage' },
];

const windowStyles: { value: WindowStyle; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'baie-vitree', label: 'Baie vitrée fixe' },
];

const wallStyles: { value: WallStyle; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'barrier', label: 'Barrière / Garde-corps' },
  { value: 'load-bearing', label: 'Porteur' },
];

const floorMaterials: { value: FloorMaterial | ''; label: string }[] = [
  { value: '', label: '— Aucun —' },
  { value: 'parquet', label: 'Parquet' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'pelouse', label: 'Pelouse' },
];

export function PropertiesPanel() {
  const data = useFloorPlan((s) => s.data);
  const updateWall = useFloorPlan((s) => s.updateWall);
  const updateOpening = useFloorPlan((s) => s.updateOpening);
  const updateLabel = useFloorPlan((s) => s.updateLabel);
  const updateFurniture = useFloorPlan((s) => s.updateFurniture);
  const updateTechnicalPoint = useFloorPlan((s) => s.updateTechnicalPoint);
  const deleteItem = useFloorPlan((s) => s.deleteItem);
  const makeCorridor = useFloorPlan((s) => s.makeCorridor);
  const selectedId = useEditor((s) => s.selectedId);
  const setSelectedId = useEditor((s) => s.setSelectedId);

  const selectedWall = data.walls.find((w) => w.id === selectedId);
  const selectedOpening = data.openings.find((o) => o.id === selectedId);
  const selectedLabel = data.labels.find((l) => l.id === selectedId);
  const selectedFurniture = (data.furniture || []).find((f) => f.id === selectedId);
  const selectedTechnicalPoint = (data.technicalPoints || []).find((tp) => tp.id === selectedId);
  const selectedItem: Wall | Opening | RoomLabel | Furniture | TechnicalPoint | undefined =
    selectedWall ?? selectedOpening ?? selectedLabel ?? selectedFurniture ?? selectedTechnicalPoint;

  if (!selectedItem) return null;

  const handleDelete = () => {
    if (selectedId) {
      deleteItem(selectedId);
      setSelectedId(null);
    }
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.5)',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 3,
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    padding: '5px 7px',
    color: 'white',
    fontSize: 11,
    fontFamily: fonts.mono,
    outline: 'none',
    width: '100%',
  };

  const wallLength = selectedWall
    ? Math.sqrt(
        (selectedWall.x2 - selectedWall.x1) ** 2 +
        (selectedWall.y2 - selectedWall.y1) ** 2
      )
    : 0;

  const handleWallLength = (newLength: number) => {
    if (!selectedWall || newLength < 0.5) return;
    const midX = (selectedWall.x1 + selectedWall.x2) / 2;
    const midY = (selectedWall.y1 + selectedWall.y2) / 2;
    const angle = Math.atan2(
      selectedWall.y2 - selectedWall.y1,
      selectedWall.x2 - selectedWall.x1
    );
    const half = newLength / 2;
    updateWall(selectedWall.id, {
      x1: snap(midX - half * Math.cos(angle)),
      y1: snap(midY - half * Math.sin(angle)),
      x2: snap(midX + half * Math.cos(angle)),
      y2: snap(midY + half * Math.sin(angle)),
    });
  };

  const wallStyleLabel = selectedWall?.wallStyle === 'barrier'
    ? ' · Barrière'
    : selectedWall?.wallStyle === 'load-bearing'
      ? ' · Porteur'
      : '';

  const typeName =
    selectedItem.type === 'wall'
      ? 'MUR'
      : selectedItem.type === 'door'
        ? 'PORTE'
        : selectedItem.type === 'window'
          ? 'FENÊTRE'
          : selectedItem.type === 'furniture'
            ? 'MEUBLE'
            : selectedItem.type === 'technical-point'
              ? 'POINT TECHNIQUE'
              : 'LABEL';

  return (
    <div
      style={{
        width: 210, borderLeft: `1px solid ${colors.borderSubtle}`,
        background: colors.bgPanel, padding: 14, fontSize: 11,
        display: 'flex', flexDirection: 'column', gap: 10,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 2, color: colors.textLabel }}>
        PROPRIÉTÉS
      </div>

      <div
        style={{
          padding: '6px 8px', borderRadius: 6,
          background: colors.accentBgSubtle, color: colors.accent,
          fontSize: 10, fontWeight: 600,
        }}
      >
        {typeName}{wallStyleLabel}
        {selectedOpening?.type === 'door' && selectedOpening.doorStyle && selectedOpening.doorStyle !== 'standard'
          ? ` · ${selectedOpening.doorStyle === 'sliding' ? 'Coulissant' : selectedOpening.doorStyle === 'sliding-glass' ? 'Baie vitrée' : selectedOpening.doorStyle === 'arcade' ? 'Arcade' : 'Porte-fenêtre'}`
          : ''}
        {selectedOpening?.type === 'window' && selectedOpening.windowStyle === 'baie-vitree'
          ? ' · Baie vitrée'
          : ''}
        {selectedFurniture
          ? ` · ${FURNITURE_DEFAULTS[selectedFurniture.furnitureType].label}`
          : ''}
        {selectedTechnicalPoint
          ? ` · ${TECHNICAL_POINT_DEFAULTS[selectedTechnicalPoint.pointType].label}`
          : ''}
      </div>

      {/* ─── Wall properties ─── */}
      {selectedWall && (
        <>
          <label style={labelStyle}>
            Longueur: {wallLength.toFixed(2)}m
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={wallLength}
              onChange={(e) => handleWallLength(parseFloat(e.target.value))}
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Hauteur: {selectedWall.height}m
            <input
              type="range"
              min="0.3"
              max="5"
              step="0.1"
              value={selectedWall.height}
              onChange={(e) =>
                updateWall(selectedWall.id, {
                  height: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Épaisseur: {selectedWall.thickness.toFixed(2)}m
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={selectedWall.thickness}
              onChange={(e) =>
                updateWall(selectedWall.id, {
                  thickness: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Type de mur
            <select
              value={selectedWall.wallStyle || 'standard'}
              onChange={(e) =>
                updateWall(selectedWall.id, {
                  wallStyle: e.target.value as WallStyle,
                  isLoadBearing: e.target.value === 'load-bearing',
                })
              }
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {wallStyles.map((ws) => (
                <option key={ws.value} value={ws.value}>
                  {ws.label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              const widthStr = prompt('Largeur du couloir (m):', '1.2');
              if (!widthStr) return;
              const w = parseFloat(widthStr);
              if (isNaN(w) || w < 0.5) return;
              makeCorridor(selectedWall.id, w);
              setSelectedId(null);
            }}
            style={{
              padding: '7px 10px',
              border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
              background: colors.accentBgSubtle, color: colors.accent,
              cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
            }}
          >
            Corridor
          </button>
        </>
      )}

      {/* ─── Opening properties (doors & windows) ─── */}
      {selectedOpening && (
        <>
          <label style={labelStyle}>
            Largeur: {selectedOpening.width.toFixed(2)}m
            <input
              type="range"
              min="0.3"
              max="5"
              step="0.1"
              value={selectedOpening.width}
              onChange={(e) =>
                updateOpening(selectedOpening.id, {
                  width: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Hauteur: {(selectedOpening.height || (selectedOpening.type === 'door' ? 2.1 : 1.2)).toFixed(1)}m
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={selectedOpening.height || (selectedOpening.type === 'door' ? 2.1 : 1.2)}
              onChange={(e) =>
                updateOpening(selectedOpening.id, {
                  height: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Position
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={selectedOpening.position}
              onChange={(e) =>
                updateOpening(selectedOpening.id, {
                  position: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>

          {/* Window-specific: sill height */}
          {selectedOpening.type === 'window' && (
            <label style={labelStyle}>
              Allège: {(selectedOpening.sillHeight ?? 0.9).toFixed(1)}m
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={selectedOpening.sillHeight ?? 0.9}
                onChange={(e) =>
                  updateOpening(selectedOpening.id, {
                    sillHeight: parseFloat(e.target.value),
                  })
                }
                style={{ accentColor: colors.accent }}
              />
            </label>
          )}

          {/* Window-specific: style */}
          {selectedOpening.type === 'window' && (
            <label style={labelStyle}>
              Type de fenêtre
              <select
                value={selectedOpening.windowStyle || 'standard'}
                onChange={(e) =>
                  updateOpening(selectedOpening.id, {
                    windowStyle: e.target.value as WindowStyle,
                  })
                }
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
              >
                {windowStyles.map((ws) => (
                  <option key={ws.value} value={ws.value}>
                    {ws.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Door-specific: style */}
          {selectedOpening.type === 'door' && (
            <>
              <label style={labelStyle}>
                Type de porte
                <select
                  value={selectedOpening.doorStyle || 'standard'}
                  onChange={(e) =>
                    updateOpening(selectedOpening.id, {
                      doorStyle: e.target.value as DoorStyle,
                    })
                  }
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                  }}
                >
                  {doorStyles.map((ds) => (
                    <option key={ds.value} value={ds.value}>
                      {ds.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() =>
                  updateOpening(selectedOpening.id, {
                    flipDoor: !selectedOpening.flipDoor,
                  })
                }
                style={{
                  padding: '7px 10px',
                  border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
                  background: colors.accentBgSubtle, color: colors.accent,
                  cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
                }}
              >
                {selectedOpening.flipDoor ? '← Charnière droite' : '→ Charnière gauche'}
              </button>
              {(selectedOpening.doorStyle || 'standard') === 'standard' && (
                <button
                  onClick={() =>
                    updateOpening(selectedOpening.id, {
                      swingOut: !selectedOpening.swingOut,
                    })
                  }
                  style={{
                    padding: '7px 10px',
                    border: `1px solid ${colors.accentBorder}`, borderRadius: 7,
                    background: selectedOpening.swingOut ? colors.accentBg : colors.accentBgSubtle,
                    color: colors.accent,
                    cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
                  }}
                >
                  {selectedOpening.swingOut ? '↑ Intérieur' : '↓ Extérieur'}
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Label properties ─── */}
      {selectedLabel && (
        <>
          <label style={labelStyle}>
            Nom
            <input
              type="text"
              value={selectedLabel.name}
              placeholder="Room name"
              onChange={(e) =>
                updateLabel(selectedLabel.id, { name: e.target.value })
              }
              style={inputStyle}
            />
          </label>
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>
            Position: ({selectedLabel.cx.toFixed(1)}, {selectedLabel.cy.toFixed(1)})
          </div>
          {selectedLabel.area > 0 && (
            <div style={{ color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>
              Aire: {selectedLabel.area.toFixed(2)}m²
            </div>
          )}
          <label style={labelStyle}>
            Revêtement de sol
            <select
              value={selectedLabel.floorMaterial || ''}
              onChange={(e) =>
                updateLabel(selectedLabel.id, {
                  floorMaterial: (e.target.value || undefined) as FloorMaterial | undefined,
                })
              }
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {floorMaterials.map((fm) => (
                <option key={fm.value} value={fm.value}>
                  {fm.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {/* ─── Technical point properties ─── */}
      {selectedTechnicalPoint && (
        <>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
            {TECHNICAL_POINT_DEFAULTS[selectedTechnicalPoint.pointType].label}
            {' · '}
            {selectedTechnicalPoint.domain === 'electrical' ? 'Electrique'
              : selectedTechnicalPoint.domain === 'plumbing' ? 'Plomberie'
              : selectedTechnicalPoint.domain === 'drainage' ? 'Evacuation'
              : 'Chauffage'}
          </div>
          <label style={labelStyle}>
            Label
            <input
              type="text"
              value={selectedTechnicalPoint.label || ''}
              placeholder={TECHNICAL_POINT_DEFAULTS[selectedTechnicalPoint.pointType].label}
              onChange={(e) =>
                updateTechnicalPoint(selectedTechnicalPoint.id, { label: e.target.value || undefined })
              }
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Rotation: {Math.round((selectedTechnicalPoint.rotation * 180) / Math.PI)}°
            <input
              type="range"
              min="0"
              max={String(Math.PI * 2)}
              step={String(Math.PI / 12)}
              value={selectedTechnicalPoint.rotation}
              onChange={(e) =>
                updateTechnicalPoint(selectedTechnicalPoint.id, {
                  rotation: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          {selectedTechnicalPoint.pointType === 'drain' && (
            <label style={labelStyle}>
              Diametre: {selectedTechnicalPoint.pipeSize ?? 50}mm
              <input
                type="range"
                min="32"
                max="200"
                step="1"
                value={selectedTechnicalPoint.pipeSize ?? 50}
                onChange={(e) =>
                  updateTechnicalPoint(selectedTechnicalPoint.id, {
                    pipeSize: parseInt(e.target.value),
                  })
                }
                style={{ accentColor: colors.accent }}
              />
            </label>
          )}
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>
            Position: ({selectedTechnicalPoint.cx.toFixed(1)}, {selectedTechnicalPoint.cy.toFixed(1)})
          </div>
        </>
      )}

      {/* ─── Furniture properties ─── */}
      {selectedFurniture && (
        <>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
            {FURNITURE_DEFAULTS[selectedFurniture.furnitureType].label}
          </div>
          <label style={labelStyle}>
            Largeur: {selectedFurniture.width.toFixed(2)}m
            <input
              type="range"
              min="0.2"
              max="4"
              step="0.05"
              value={selectedFurniture.width}
              onChange={(e) =>
                updateFurniture(selectedFurniture.id, {
                  width: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Profondeur: {selectedFurniture.depth.toFixed(2)}m
            <input
              type="range"
              min="0.2"
              max="4"
              step="0.05"
              value={selectedFurniture.depth}
              onChange={(e) =>
                updateFurniture(selectedFurniture.id, {
                  depth: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Hauteur: {selectedFurniture.height.toFixed(2)}m
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={selectedFurniture.height}
              onChange={(e) =>
                updateFurniture(selectedFurniture.id, {
                  height: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
          <label style={labelStyle}>
            Rotation: {Math.round((selectedFurniture.rotation * 180) / Math.PI)}°
            <input
              type="range"
              min="0"
              max={String(Math.PI * 2)}
              step={String(Math.PI / 12)}
              value={selectedFurniture.rotation}
              onChange={(e) =>
                updateFurniture(selectedFurniture.id, {
                  rotation: parseFloat(e.target.value),
                })
              }
              style={{ accentColor: colors.accent }}
            />
          </label>
        </>
      )}

      <button
        onClick={handleDelete}
        style={{
          marginTop: 'auto', padding: '8px',
          border: `1px solid ${colors.dangerBorder}`, borderRadius: 7,
          background: 'rgba(239,68,68,0.1)', color: colors.danger,
          cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10, fontWeight: 600,
        }}
      >
        SUPPRIMER
      </button>
    </div>
  );
}
