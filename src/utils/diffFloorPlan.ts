import type { FloorPlan, FloorPlanDiff, ElementDiff, Wall, Opening, RoomLabel, Furniture } from '../types';

type AnyElement = Wall | Opening | RoomLabel | Furniture;

function elementType(el: AnyElement): ElementDiff['type'] {
  if (el.type === 'wall') return 'wall';
  if (el.type === 'door') return 'door';
  if (el.type === 'window') return 'window';
  if (el.type === 'label') return 'label';
  return 'furniture';
}

function wallChanged(a: Wall, b: Wall): boolean {
  return (
    a.x1 !== b.x1 || a.y1 !== b.y1 || a.x2 !== b.x2 || a.y2 !== b.y2 ||
    a.thickness !== b.thickness || a.height !== b.height || a.wallStyle !== b.wallStyle
  );
}

function openingChanged(a: Opening, b: Opening): boolean {
  return (
    a.wallId !== b.wallId || a.position !== b.position ||
    a.width !== b.width || a.height !== b.height ||
    a.doorStyle !== b.doorStyle || a.windowStyle !== b.windowStyle ||
    a.sillHeight !== b.sillHeight || a.flipDoor !== b.flipDoor ||
    a.swingOut !== b.swingOut
  );
}

function labelChanged(a: RoomLabel, b: RoomLabel): boolean {
  return (
    a.name !== b.name || a.cx !== b.cx || a.cy !== b.cy ||
    a.floorMaterial !== b.floorMaterial
  );
}

function furnitureChanged(a: Furniture, b: Furniture): boolean {
  return (
    a.furnitureType !== b.furnitureType ||
    a.cx !== b.cx || a.cy !== b.cy ||
    a.width !== b.width || a.depth !== b.depth ||
    a.rotation !== b.rotation
  );
}

function hasChanged(a: AnyElement, b: AnyElement): boolean {
  if (a.type === 'wall' && b.type === 'wall') return wallChanged(a, b);
  if ((a.type === 'door' || a.type === 'window') && (b.type === 'door' || b.type === 'window')) {
    return openingChanged(a as Opening, b as Opening);
  }
  if (a.type === 'label' && b.type === 'label') return labelChanged(a, b);
  if (a.type === 'furniture' && b.type === 'furniture') return furnitureChanged(a, b);
  return true; // different types = changed
}

function allElements(plan: FloorPlan): Map<string, AnyElement> {
  const map = new Map<string, AnyElement>();
  for (const w of plan.walls) map.set(w.id, w);
  for (const o of plan.openings) map.set(o.id, o);
  for (const l of plan.labels) map.set(l.id, l);
  for (const f of plan.furniture) map.set(f.id, f);
  return map;
}

export function diffFloorPlans(baseline: FloorPlan, current: FloorPlan): FloorPlanDiff {
  const baseMap = allElements(baseline);
  const currMap = allElements(current);

  const elements: ElementDiff[] = [];
  const addedIds = new Set<string>();
  const removedIds = new Set<string>();
  const modifiedIds = new Set<string>();

  // Check current elements against baseline
  for (const [id, el] of currMap) {
    const baseEl = baseMap.get(id);
    if (!baseEl) {
      addedIds.add(id);
      elements.push({ id, status: 'added', type: elementType(el) });
    } else if (hasChanged(baseEl, el)) {
      modifiedIds.add(id);
      elements.push({ id, status: 'modified', type: elementType(el) });
    }
  }

  // Check for removed elements
  for (const [id, el] of baseMap) {
    if (!currMap.has(id)) {
      removedIds.add(id);
      elements.push({ id, status: 'removed', type: elementType(el) });
    }
  }

  return { elements, addedIds, removedIds, modifiedIds };
}
