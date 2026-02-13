import { colors, fonts } from '../styles/theme';

const items = [
  { color: colors.diffAdded, label: 'Ajouté' },
  { color: colors.diffRemoved, label: 'Supprimé' },
  { color: colors.diffModified, label: 'Modifié' },
] as const;

export function ComparisonLegend() {
  return (
    <div
      style={{
        position: 'absolute', bottom: 10, right: 10,
        padding: '8px 12px', background: 'rgba(0,0,0,0.7)',
        borderRadius: 8, backdropFilter: 'blur(8px)',
        display: 'flex', gap: 12, alignItems: 'center',
        fontFamily: fonts.mono, fontSize: 9, color: colors.textMuted,
        border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: 2,
              background: item.color, opacity: 0.8,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}
