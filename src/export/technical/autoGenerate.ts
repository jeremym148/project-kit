import type { FloorPlan } from '../../types';
import type { TechnicalDomain, TechnicalPlan } from '../../types/pdf';
import { generateElectricalPoints } from './electricalRules';
import { generatePlumbingPoints } from './plumbingRules';
import { generateDrainagePoints } from './drainageRules';
import { generateHeatingPoints } from './heatingRules';

/** Generate all technical plans from the floor plan data.
 *  If manual technical points exist for a domain, use those instead of auto-generating. */
export function generateAllTechnicalPlans(data: FloorPlan): TechnicalPlan[] {
  const manual = data.technicalPoints || [];

  const byDomain = (domain: TechnicalDomain) =>
    manual.filter((p) => p.domain === domain);

  const manualElectrical = byDomain('electrical');
  const manualPlumbing = byDomain('plumbing');
  const manualDrainage = byDomain('drainage');
  const manualHeating = byDomain('heating');

  return [
    {
      domain: 'electrical',
      title: 'Plan Électrique',
      points: manualElectrical.length > 0 ? manualElectrical : generateElectricalPoints(data),
    },
    {
      domain: 'plumbing',
      title: 'Plan Plomberie — Alimentation Eau',
      points: manualPlumbing.length > 0 ? manualPlumbing : generatePlumbingPoints(data),
    },
    {
      domain: 'drainage',
      title: 'Plan Évacuation — Eaux Usées',
      points: manualDrainage.length > 0 ? manualDrainage : generateDrainagePoints(data),
    },
    {
      domain: 'heating',
      title: 'Plan Gaz / Chauffage',
      points: manualHeating.length > 0 ? manualHeating : generateHeatingPoints(data),
    },
  ];
}
