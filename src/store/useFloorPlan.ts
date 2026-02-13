import { create } from 'zustand';
import { temporal } from 'zundo';
import type { FloorPlan, Wall, Opening, RoomLabel, Furniture, Terrain } from '../types';
import { israeliApartment, createWall } from '../utils/defaults';
import { detectRoomsFromWalls } from '../utils/roomDetection';
import { snap } from '../utils/geometry';
import { loadAutoSave, autoSave, clearAutoSave } from '../utils/storage';

function initData(): FloorPlan {
  // Try to restore from auto-save
  const saved = loadAutoSave();
  if (saved) return saved;

  // Fallback to default apartment with detected rooms
  const plan = israeliApartment();
  plan.labels = detectRoomsFromWalls(plan.walls);
  return plan;
}

interface FloorPlanState {
  data: FloorPlan;
  setData: (updater: FloorPlan | ((prev: FloorPlan) => FloorPlan)) => void;
  addWall: (wall: Wall) => void;
  addOpening: (opening: Opening) => void;
  addLabel: (label: RoomLabel) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  updateLabel: (id: string, updates: Partial<RoomLabel>) => void;
  addFurniture: (furniture: Furniture) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  deleteItem: (id: string) => void;
  makeCorridor: (wallId: string, width: number) => string[];
  setTerrain: (terrain: Terrain | undefined) => void;
  detectRooms: () => void;
  reset: (plan?: FloorPlan) => void;
}

export const useFloorPlan = create<FloorPlanState>()(
  temporal(
    (set) => ({
      data: initData(),

      setData: (updater) =>
        set((state) => ({
          data: typeof updater === 'function' ? updater(state.data) : updater,
        })),

      addWall: (wall) =>
        set((state) => ({
          data: { ...state.data, walls: [...state.data.walls, wall] },
        })),

      addOpening: (opening) =>
        set((state) => ({
          data: { ...state.data, openings: [...state.data.openings, opening] },
        })),

      addLabel: (label) =>
        set((state) => ({
          data: { ...state.data, labels: [...state.data.labels, label] },
        })),

      updateWall: (id, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            walls: state.data.walls.map((w) =>
              w.id === id ? { ...w, ...updates } : w
            ),
          },
        })),

      updateOpening: (id, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            openings: state.data.openings.map((o) =>
              o.id === id ? { ...o, ...updates } : o
            ),
          },
        })),

      updateLabel: (id, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            labels: state.data.labels.map((l) =>
              l.id === id ? { ...l, ...updates } : l
            ),
          },
        })),

      addFurniture: (furniture) =>
        set((state) => ({
          data: { ...state.data, furniture: [...(state.data.furniture || []), furniture] },
        })),

      updateFurniture: (id, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            furniture: (state.data.furniture || []).map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
          },
        })),

      deleteItem: (id) =>
        set((state) => {
          // Check walls
          const wallIdx = state.data.walls.findIndex((w) => w.id === id);
          if (wallIdx >= 0) {
            const wallId = state.data.walls[wallIdx]!.id;
            return {
              data: {
                ...state.data,
                walls: state.data.walls.filter((w) => w.id !== id),
                openings: state.data.openings.filter((o) => o.wallId !== wallId),
              },
            };
          }
          // Check openings
          if (state.data.openings.some((o) => o.id === id)) {
            return {
              data: {
                ...state.data,
                openings: state.data.openings.filter((o) => o.id !== id),
              },
            };
          }
          // Check furniture
          if ((state.data.furniture || []).some((f) => f.id === id)) {
            return {
              data: {
                ...state.data,
                furniture: (state.data.furniture || []).filter((f) => f.id !== id),
              },
            };
          }
          // Check labels
          return {
            data: {
              ...state.data,
              labels: state.data.labels.filter((l) => l.id !== id),
            },
          };
        }),

      makeCorridor: (wallId, width) => {
        const state = useFloorPlan.getState();
        const wall = state.data.walls.find((w) => w.id === wallId);
        if (!wall) return [];

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return [];

        // Perpendicular normal
        const nx = -dy / len;
        const ny = dx / len;
        const half = width / 2;

        // Two parallel walls
        const w1 = createWall(
          snap(wall.x1 + nx * half), snap(wall.y1 + ny * half),
          snap(wall.x2 + nx * half), snap(wall.y2 + ny * half)
        );
        const w2 = createWall(
          snap(wall.x1 - nx * half), snap(wall.y1 - ny * half),
          snap(wall.x2 - nx * half), snap(wall.y2 - ny * half)
        );

        // End cap walls
        const w3 = createWall(
          snap(wall.x1 + nx * half), snap(wall.y1 + ny * half),
          snap(wall.x1 - nx * half), snap(wall.y1 - ny * half)
        );
        const w4 = createWall(
          snap(wall.x2 + nx * half), snap(wall.y2 + ny * half),
          snap(wall.x2 - nx * half), snap(wall.y2 - ny * half)
        );

        // Copy height from original wall
        w1.height = wall.height;
        w2.height = wall.height;
        w3.height = wall.height;
        w4.height = wall.height;

        set((s) => ({
          data: {
            ...s.data,
            walls: [
              ...s.data.walls.filter((w) => w.id !== wallId),
              w1, w2, w3, w4,
            ],
            openings: s.data.openings.filter((o) => o.wallId !== wallId),
          },
        }));

        return [w1.id, w2.id, w3.id, w4.id];
      },

      setTerrain: (terrain) =>
        set((state) => ({
          data: { ...state.data, terrain },
        })),

      detectRooms: () =>
        set((state) => ({
          data: {
            ...state.data,
            labels: detectRoomsFromWalls(state.data.walls),
          },
        })),

      reset: (plan) => {
        const base = plan ?? israeliApartment();
        if (base.labels.length === 0) {
          base.labels = detectRoomsFromWalls(base.walls);
        }
        clearAutoSave();
        set({ data: base });
      },
    }),
    {
      limit: 50,
      equality: (pastState, currentState) =>
        pastState.data === currentState.data,
    }
  )
);

// Auto-save on every data change (debounced 500ms)
useFloorPlan.subscribe((state) => {
  autoSave(state.data);
});
