import { create } from 'zustand';
import type { Snapshot, CompareMode } from '../types';
import { useFloorPlan } from './useFloorPlan';
import { uid } from '../utils/ids';
import { saveVersions, loadVersions } from '../utils/storage';

const MAX_SNAPSHOTS = 50;

function initVersions() {
  const saved = loadVersions();
  return {
    snapshots: saved?.snapshots ?? [],
    baselineId: saved?.baselineId ?? null,
  };
}

interface VersionState {
  snapshots: Snapshot[];
  baselineId: string | null;
  compareMode: CompareMode;
  showVersionPanel: boolean;

  saveSnapshot: (name?: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  deleteSnapshot: (id: string) => void;
  restoreSnapshot: (id: string) => void;
  setBaseline: (id: string | null) => void;
  setCompareMode: (mode: CompareMode) => void;
  toggleVersionPanel: () => void;
}

const initial = initVersions();

export const useVersionStore = create<VersionState>((set, get) => ({
  snapshots: initial.snapshots,
  baselineId: initial.baselineId,
  compareMode: null,
  showVersionPanel: false,

  saveSnapshot: (name) => {
    const data = structuredClone(useFloorPlan.getState().data);
    const isAuto = !name;
    const now = new Date();
    const autoName = `Auto — ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const snapshot: Snapshot = {
      id: uid('snap'),
      name: name || autoName,
      timestamp: now.toISOString(),
      data,
      isAuto,
    };

    set((s) => {
      let next = [snapshot, ...s.snapshots];
      // Prune oldest auto-snapshots if over limit
      if (next.length > MAX_SNAPSHOTS) {
        const autoSnaps = next.filter((sn) => sn.isAuto);
        if (autoSnaps.length > 0) {
          const oldest = autoSnaps[autoSnaps.length - 1]!;
          next = next.filter((sn) => sn.id !== oldest.id);
        } else {
          next = next.slice(0, MAX_SNAPSHOTS);
        }
      }
      saveVersions(next, s.baselineId);
      return { snapshots: next };
    });
  },

  renameSnapshot: (id, name) => {
    set((s) => {
      const next = s.snapshots.map((sn) =>
        sn.id === id ? { ...sn, name, isAuto: false } : sn
      );
      saveVersions(next, s.baselineId);
      return { snapshots: next };
    });
  },

  deleteSnapshot: (id) => {
    set((s) => {
      const next = s.snapshots.filter((sn) => sn.id !== id);
      const newBaseline = s.baselineId === id ? null : s.baselineId;
      const newCompare = newBaseline === null ? null : s.compareMode;
      saveVersions(next, newBaseline);
      return { snapshots: next, baselineId: newBaseline, compareMode: newCompare };
    });
  },

  restoreSnapshot: (id) => {
    const snap = get().snapshots.find((sn) => sn.id === id);
    if (!snap) return;
    useFloorPlan.getState().setData(structuredClone(snap.data));
  },

  setBaseline: (id) => {
    set((s) => {
      const newCompare = id === null ? null : s.compareMode;
      saveVersions(s.snapshots, id);
      return { baselineId: id, compareMode: newCompare };
    });
  },

  setCompareMode: (mode) => {
    set({ compareMode: mode });
  },

  toggleVersionPanel: () => {
    set((s) => ({ showVersionPanel: !s.showVersionPanel }));
  },
}));
