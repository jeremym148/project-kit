import type { FloorPlan } from '../../types';
import type { TechnicalPoint } from '../../types/pdf';
import { uid } from '../../utils/ids';

/** Drainage pipe sizes per fixture type (mm) */
const DRAIN_SIZES: Record<string, number> = {
  'toilet': 100,
  'shower': 50,
  'bathtub': 50,
  'bathroom-cabinet': 40,
  'kitchen-counter': 40,
};

/** Generate drainage/evacuation technical points */
export function generateDrainagePoints(data: FloorPlan): TechnicalPoint[] {
  const points: TechnicalPoint[] = [];

  for (const f of data.furniture || []) {
    const pipeSize = DRAIN_SIZES[f.furnitureType];
    if (!pipeSize) continue;

    points.push({
      id: uid('drain'),
      type: 'technical-point',
      pointType: 'drain',
      domain: 'drainage',
      cx: f.cx,
      cy: f.cy + 0.1,
      rotation: f.rotation,
      label: `PVC ${pipeSize}`,
      pipeSize,
    });
  }

  return points;
}
