import { useEffect, useRef } from 'react';
import { useFloorPlan } from '../store/useFloorPlan';
import { useVersionStore } from '../store/useVersionStore';
import type { FloorPlan } from '../types';

const AUTO_INTERVAL = 60_000; // 60 seconds

export function AutoSnapshotTimer() {
  const lastDataRef = useRef<FloorPlan | null>(null);

  useEffect(() => {
    // Capture initial data reference
    lastDataRef.current = useFloorPlan.getState().data;

    const timer = setInterval(() => {
      const currentData = useFloorPlan.getState().data;
      if (currentData !== lastDataRef.current) {
        useVersionStore.getState().saveSnapshot();
        lastDataRef.current = currentData;
      }
    }, AUTO_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return null;
}
