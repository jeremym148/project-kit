import type { FloorPlan } from '../../types';
import type { TechnicalPoint } from '../../types/pdf';
import { uid } from '../../utils/ids';

/** Water-using furniture types and their water requirements */
const WATER_FIXTURES: Record<string, { cold: boolean; hot: boolean }> = {
  'toilet': { cold: true, hot: false },
  'shower': { cold: true, hot: true },
  'bathtub': { cold: true, hot: true },
  'bathroom-cabinet': { cold: true, hot: true },  // sink
  'kitchen-counter': { cold: true, hot: true },    // kitchen sink
};

/** Generate plumbing (water supply) technical points */
export function generatePlumbingPoints(data: FloorPlan): TechnicalPoint[] {
  const points: TechnicalPoint[] = [];

  for (const f of data.furniture || []) {
    const fixture = WATER_FIXTURES[f.furnitureType];
    if (!fixture) continue;

    // Cold water supply
    if (fixture.cold) {
      points.push({
        id: uid('plumb'),
        type: 'technical-point',
        pointType: 'water-supply-cold',
        domain: 'plumbing',
        cx: f.cx - 0.15,
        cy: f.cy,
        rotation: f.rotation,
        label: 'EF',
      });
    }

    // Hot water supply
    if (fixture.hot) {
      points.push({
        id: uid('plumb'),
        type: 'technical-point',
        pointType: 'water-supply-hot',
        domain: 'plumbing',
        cx: f.cx + 0.15,
        cy: f.cy,
        rotation: f.rotation,
        label: 'EC',
      });
    }
  }

  // Main water entry point — near entrance or kitchen
  const entranceLabel = data.labels.find((l) => {
    const name = l.name.toLowerCase();
    return name.includes('entrée') || name.includes('entree') || name.includes('cuisine');
  });

  if (entranceLabel) {
    points.push({
      id: uid('plumb'),
      type: 'technical-point',
      pointType: 'water-supply-cold',
      domain: 'plumbing',
      cx: entranceLabel.cx,
      cy: entranceLabel.cy + 0.5,
      rotation: 0,
      label: 'Arrivée eau',
      roomId: entranceLabel.id,
    });
  }

  return points;
}
