import { useState, useRef } from 'react';
import type { FloorPlan } from '../types';
import { analyzeFloorPlan, type AnalysisProgress } from './analyzeFloorPlan';
import { colors, fonts } from '../styles/theme';

interface AIImportModalProps {
  onClose: () => void;
  onImport: (data: FloorPlan) => void;
  onBgImage: (src: string) => void;
}

export function AIImportModal({ onClose, onImport, onBgImage }: AIImportModalProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('image/png');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setMediaType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setImageData(result.split(',')[1] ?? null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageData) return;
    setStatus('analyzing');
    setProgress('Envoi du plan à Claude Vision...');
    setError(null);

    try {
      const floorPlan = await analyzeFloorPlan(
        imageData,
        mediaType,
        (p: AnalysisProgress) => {
          setStatus(p.status === 'error' ? 'idle' : p.status);
          setProgress(p.status === 'done' ? `✓ ${p.message}` : p.message);
        }
      );

      setStatus('done');
      if (imageSrc) onBgImage(imageSrc);
      setTimeout(() => onImport(floorPlan), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'analyse');
      setStatus('idle');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxHeight: '85vh', background: '#1a1a1f',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
              AI Floor Plan Import
            </div>
            <div style={{ fontSize: 11, color: colors.textDimmer, marginTop: 4 }}>
              Upload screenshot → Claude Vision → Plan digital
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none', borderRadius: 8,
              background: colors.surface, color: colors.textMuted,
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1, overflow: 'auto' }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.type.startsWith('image/')) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${imageSrc ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 12, padding: imageSrc ? 0 : 40,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              background: imageSrc ? 'transparent' : 'rgba(255,255,255,0.02)',
              overflow: 'hidden', minHeight: imageSrc ? 200 : 160,
            }}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Plan"
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10 }}
              />
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📐</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  Glissez votre plan ici
                </div>
                <div style={{ fontSize: 11, color: colors.textDimmer, marginTop: 6 }}>
                  ou cliquez · PNG, JPG, WEBP
                </div>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* Status indicators */}
          {status === 'analyzing' && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 18, height: 18,
                border: '2px solid #f59e0b', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                {progress}
              </span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {status === 'done' && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: colors.successBg, border: `1px solid ${colors.successBorder}`,
            }}>
              <span style={{ fontSize: 12, color: colors.success, fontWeight: 600 }}>
                {progress}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <span style={{ fontSize: 12, color: colors.danger }}>⚠ {error}</span>
            </div>
          )}

          {/* Tips */}
          <div style={{
            marginTop: 20, padding: 14, borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            fontSize: 11, color: colors.textDim, lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Conseils :
            </div>
            • Plan 2D vu de dessus avec bon contraste<br />
            • Les annotations de surface (m²) améliorent la précision<br />
            • Plans architecturaux israéliens supportés (hébreu)<br />
            • L'image reste en transparence comme référence
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontFamily: fonts.mono, fontSize: 12, fontWeight: 600,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!imageData || status !== 'idle'}
            style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: imageData && status === 'idle'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : colors.surface,
              color: imageData && status === 'idle' ? '#111' : 'rgba(255,255,255,0.2)',
              cursor: imageData && status === 'idle' ? 'pointer' : 'default',
              fontFamily: fonts.mono, fontSize: 12, fontWeight: 700,
            }}
          >
            {status === 'analyzing'
              ? 'Analyse...'
              : status === 'done'
                ? 'Terminé ✓'
                : 'Analyser avec l\'IA'}
          </button>
        </div>
      </div>
    </div>
  );
}
