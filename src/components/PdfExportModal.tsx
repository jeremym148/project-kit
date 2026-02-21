import { useState } from 'react';
import { useFloorPlan } from '../store/useFloorPlan';
import { exportFloorPlanPdf } from '../export/pdfExport';
import type { PdfExportConfig } from '../types/pdf';
import { colors, fonts } from '../styles/theme';

interface PdfExportModalProps {
  onClose: () => void;
}

export function PdfExportModal({ onClose }: PdfExportModalProps) {
  const data = useFloorPlan((s) => s.data);

  const [config, setConfig] = useState<PdfExportConfig>({
    projectName: 'Mon Plan',
    clientName: '',
    architect: '',
    address: '',
    date: new Date().toLocaleDateString('fr-FR'),
    scale: 0, // auto
    pageSize: 'A3',
    includeArchitectural: true,
    includeElectrical: true,
    includePlumbing: true,
    includeDrainage: true,
    includeHeating: true,
  });

  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // Small delay to show the exporting state
    setTimeout(() => {
      try {
        exportFloorPlanPdf(data, config);
      } catch (err) {
        alert(`Erreur d'export: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
      setExporting(false);
      onClose();
    }, 100);
  };

  const update = (partial: Partial<PdfExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 5,
    padding: '7px 10px',
    color: '#fff',
    fontSize: 11,
    fontFamily: fonts.mono,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontFamily: fonts.mono,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 3,
  };

  const checkboxStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: fonts.mono,
    cursor: 'pointer' as const,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#1a1a1f',
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
          width: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.accent }}>
              Exporter PDF Professionnel
            </div>
            <div style={{ fontSize: 9, color: colors.textDim, marginTop: 2 }}>
              Plan architectural + plans techniques
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: colors.textMuted,
              cursor: 'pointer', fontSize: 18, padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: colors.border }} />

        {/* Project Info */}
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.textLabel }}>
          INFORMATIONS PROJET
        </div>

        <label style={labelStyle}>
          Nom du projet
          <input
            type="text"
            value={config.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            Client
            <input
              type="text"
              value={config.clientName}
              onChange={(e) => update({ clientName: e.target.value })}
              placeholder="Nom du client"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Architecte
            <input
              type="text"
              value={config.architect}
              onChange={(e) => update({ architect: e.target.value })}
              placeholder="Nom de l'architecte"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Adresse du projet
          <input
            type="text"
            value={config.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="123 Rue Exemple, 75001 Paris"
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            Date
            <input
              type="text"
              value={config.date}
              onChange={(e) => update({ date: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Échelle
            <select
              value={config.scale}
              onChange={(e) => update({ scale: parseInt(e.target.value) })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value={0}>Auto</option>
              <option value={50}>1:50</option>
              <option value={75}>1:75</option>
              <option value={100}>1:100</option>
              <option value={200}>1:200</option>
            </select>
          </label>
          <label style={labelStyle}>
            Format
            <select
              value={config.pageSize}
              onChange={(e) => update({ pageSize: e.target.value as 'A3' | 'A4' })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="A3">A3 Paysage</option>
              <option value="A4">A4 Paysage</option>
            </select>
          </label>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: colors.border }} />

        {/* Plans to include */}
        <div style={{ fontSize: 9, letterSpacing: 2, color: colors.textLabel }}>
          PLANS À INCLURE
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={config.includeArchitectural}
              onChange={(e) => update({ includeArchitectural: e.target.checked })}
              style={{ accentColor: colors.accent }}
            />
            Plan d'Architecture
            <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 'auto' }}>
              Murs, cotations, pièces, meubles
            </span>
          </label>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={config.includeElectrical}
              onChange={(e) => update({ includeElectrical: e.target.checked })}
              style={{ accentColor: colors.accent }}
            />
            Plan Électrique
            <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 'auto' }}>
              Prises, interrupteurs, luminaires
            </span>
          </label>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={config.includePlumbing}
              onChange={(e) => update({ includePlumbing: e.target.checked })}
              style={{ accentColor: colors.accent }}
            />
            Plan Plomberie (Eau)
            <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 'auto' }}>
              Eau froide, eau chaude
            </span>
          </label>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={config.includeDrainage}
              onChange={(e) => update({ includeDrainage: e.target.checked })}
              style={{ accentColor: colors.accent }}
            />
            Plan Évacuation
            <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 'auto' }}>
              Eaux usées, diamètres tuyaux
            </span>
          </label>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={config.includeHeating}
              onChange={(e) => update({ includeHeating: e.target.checked })}
              style={{ accentColor: colors.accent }}
            />
            Plan Gaz / Chauffage
            <span style={{ color: colors.textDim, fontSize: 9, marginLeft: 'auto' }}>
              Radiateurs, gaz, chaudière
            </span>
          </label>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: colors.border }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, fontSize: 9, color: colors.textDim }}>
          <span>{data.walls.length} murs</span>
          <span>{data.openings.filter((o) => o.type === 'door').length} portes</span>
          <span>{data.openings.filter((o) => o.type === 'window').length} fenêtres</span>
          <span>{data.labels.length} pièces</span>
          <span>{(data.furniture || []).length} meubles</span>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: 8,
            background: exporting
              ? 'rgba(245,158,11,0.3)'
              : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
            color: exporting ? colors.accent : '#111',
            cursor: exporting ? 'wait' : 'pointer',
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {exporting ? 'Export en cours...' : 'EXPORTER PDF'}
        </button>
      </div>
    </div>
  );
}
