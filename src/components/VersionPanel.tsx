import { useState } from 'react';
import { useVersionStore } from '../store/useVersionStore';
import { colors, fonts } from '../styles/theme';

export function VersionPanel() {
  const snapshots = useVersionStore((s) => s.snapshots);
  const baselineId = useVersionStore((s) => s.baselineId);
  const saveSnapshot = useVersionStore((s) => s.saveSnapshot);
  const renameSnapshot = useVersionStore((s) => s.renameSnapshot);
  const deleteSnapshot = useVersionStore((s) => s.deleteSnapshot);
  const restoreSnapshot = useVersionStore((s) => s.restoreSnapshot);
  const setBaseline = useVersionStore((s) => s.setBaseline);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = () => {
    const name = prompt('Nom de la version:', `Version ${snapshots.length + 1}`);
    if (name) saveSnapshot(name);
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const finishRename = (id: string) => {
    if (editName.trim()) {
      renameSnapshot(id, editName.trim());
    }
    setEditingId(null);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        width: 240, background: colors.bgPanel, borderLeft: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: fonts.mono,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
        <div
          style={{
            fontSize: 9, letterSpacing: 2, color: colors.textLabel,
            marginBottom: 10, fontWeight: 600,
          }}
        >
          VERSIONS
        </div>
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '7px 12px',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
            border: 'none', borderRadius: 7, color: '#111',
            fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.mono,
          }}
        >
          + Sauvegarder version
        </button>
      </div>

      {/* Baseline indicator */}
      {baselineId && (
        <div
          style={{
            padding: '8px 14px', background: colors.successBg,
            borderBottom: `1px solid ${colors.successBorder}`,
            fontSize: 9, color: colors.success, display: 'flex',
            alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 11 }}>◉</span>
          État actuel défini
          <button
            onClick={() => setBaseline(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: colors.success, cursor: 'pointer', fontSize: 9,
              fontFamily: fonts.mono, padding: 0, opacity: 0.7,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Snapshot list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {snapshots.length === 0 && (
          <div style={{ padding: '20px 14px', fontSize: 10, color: colors.textDimmer, textAlign: 'center' }}>
            Aucune version sauvegardée
          </div>
        )}

        {snapshots.map((snap) => {
          const isBaseline = snap.id === baselineId;
          return (
            <div
              key={snap.id}
              style={{
                padding: '8px 14px', marginBottom: 1,
                background: isBaseline ? colors.successBg : 'transparent',
                borderLeft: isBaseline ? `2px solid ${colors.success}` : '2px solid transparent',
              }}
            >
              {/* Name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                {editingId === snap.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => finishRename(snap.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishRename(snap.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${colors.accentBorder}`, borderRadius: 4,
                      padding: '2px 5px', fontSize: 10, color: colors.text,
                      fontFamily: fonts.mono, outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1, fontSize: 10, fontWeight: 600,
                      color: isBaseline ? colors.success : colors.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {snap.name}
                  </span>
                )}
                {snap.isAuto && editingId !== snap.id && (
                  <span
                    style={{
                      fontSize: 8, padding: '1px 4px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)', color: colors.textDimmer,
                    }}
                  >
                    AUTO
                  </span>
                )}
                {isBaseline && editingId !== snap.id && (
                  <span
                    style={{
                      fontSize: 8, padding: '1px 4px', borderRadius: 3,
                      background: colors.successBg, color: colors.success,
                      border: `1px solid ${colors.successBorder}`,
                    }}
                  >
                    ACTUEL
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <div style={{ fontSize: 9, color: colors.textDimmer, marginBottom: 5 }}>
                {formatTime(snap.timestamp)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button
                  onClick={() => restoreSnapshot(snap.id)}
                  style={actionBtnStyle}
                >
                  Restaurer
                </button>
                <button
                  onClick={() => startRename(snap.id, snap.name)}
                  style={actionBtnStyle}
                >
                  Renommer
                </button>
                {!isBaseline ? (
                  <button
                    onClick={() => setBaseline(snap.id)}
                    style={{
                      ...actionBtnStyle,
                      background: colors.successBg,
                      color: colors.success,
                      border: `1px solid ${colors.successBorder}`,
                    }}
                  >
                    État actuel
                  </button>
                ) : (
                  <button
                    onClick={() => setBaseline(null)}
                    style={{
                      ...actionBtnStyle,
                      background: colors.successBg,
                      color: colors.success,
                      border: `1px solid ${colors.successBorder}`,
                    }}
                  >
                    ✓ Actuel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Supprimer cette version ?')) deleteSnapshot(snap.id);
                  }}
                  style={{
                    ...actionBtnStyle,
                    color: colors.danger,
                    border: `1px solid ${colors.dangerBorder}`,
                    background: 'transparent',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 14px', borderTop: `1px solid ${colors.borderSubtle}`,
          fontSize: 9, color: colors.textDimmer, textAlign: 'center',
        }}
      >
        Sauvegarde auto toutes les 60s
      </div>
    </div>
  );
}

const actionBtnStyle = {
  padding: '3px 7px', border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 4, background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
  fontFamily: fonts.mono, fontSize: 8, fontWeight: 600,
} as const;
