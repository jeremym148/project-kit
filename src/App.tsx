import { useEffect, useCallback } from 'react';
import { useFloorPlan } from './store/useFloorPlan';
import { useEditor } from './store/useEditor';
import { useVersionStore } from './store/useVersionStore';
import type { CompareMode } from './types';
import { Header } from './components/Header';
import { ViewportSplit } from './components/ViewportSplit';
import { AIImportModal } from './ai/AIImportModal';
import { AutoSnapshotTimer } from './components/AutoSnapshotTimer';
import { colors, fonts } from './styles/theme';

export default function App() {
  const deleteItem = useFloorPlan((s) => s.deleteItem);
  const setData = useFloorPlan((s) => s.setData);
  const selectedId = useEditor((s) => s.selectedId);
  const setSelectedId = useEditor((s) => s.setSelectedId);
  const showImport = useEditor((s) => s.showImport);
  const setShowImport = useEditor((s) => s.setShowImport);
  const setBgImage = useEditor((s) => s.setBgImage);

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      deleteItem(selectedId);
      setSelectedId(null);
    }
  }, [selectedId, deleteItem, setSelectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

      // Delete/Backspace to remove selected (not in inputs)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        deleteSelected();
        return;
      }

      // Ctrl+S / Cmd+S = save version snapshot
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        const name = prompt('Nom de la version:', `Version`);
        if (name) useVersionStore.getState().saveSnapshot(name);
        return;
      }

      // Ctrl+K / Cmd+K = cycle comparison mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const vs = useVersionStore.getState();
        if (!vs.baselineId) return;
        const modes: CompareMode[] = [null, 'side-by-side', 'overlay'];
        const idx = modes.indexOf(vs.compareMode);
        vs.setCompareMode(modes[(idx + 1) % modes.length] ?? null);
        return;
      }

      // Ctrl+Z / Cmd+Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useFloorPlan.temporal.getState().undo();
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z = redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useFloorPlan.temporal.getState().redo();
        return;
      }

      // Ctrl+Y / Cmd+Y = redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        useFloorPlan.temporal.getState().redo();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: colors.bg,
        fontFamily: fonts.mono,
        color: colors.text,
        overflow: 'hidden',
      }}
    >
      <Header />
      <ViewportSplit />
      <AutoSnapshotTimer />
      {showImport && (
        <AIImportModal
          onClose={() => setShowImport(false)}
          onBgImage={setBgImage}
          onImport={(newData) => {
            setData(newData);
            setSelectedId(null);
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
}
