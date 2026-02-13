import type { FloorPlan, Snapshot } from '../types';

const STORAGE_KEY = 'floorplan-studio-project';
const AUTOSAVE_KEY = 'floorplan-studio-autosave';
const VERSIONS_KEY = 'floorplan-studio-versions';

export interface ProjectFile {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: FloorPlan;
}

// ── Auto-save to localStorage ──

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function autoSave(data: FloorPlan): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const payload: ProjectFile = {
        version: 1,
        name: loadProjectName(),
        createdAt: loadCreatedAt(),
        updatedAt: new Date().toISOString(),
        data,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, 500);
}

export function loadAutoSave(): FloorPlan | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const project = JSON.parse(raw) as ProjectFile;
    if (project.version === 1 && project.data?.walls) {
      // Ensure arrays exist (backwards compat)
      if (!project.data.labels) project.data.labels = [];
      if (!project.data.furniture) project.data.furniture = [];
      return project.data;
    }
  } catch {
    // Corrupted data — ignore
  }
  return null;
}

export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

// ── Project name (stored separately for header display) ──

function loadProjectName(): string {
  return localStorage.getItem(STORAGE_KEY + '-name') || 'Sans titre';
}

function loadCreatedAt(): string {
  return localStorage.getItem(STORAGE_KEY + '-created') || new Date().toISOString();
}

export function saveProjectName(name: string): void {
  localStorage.setItem(STORAGE_KEY + '-name', name);
}

// ── Version snapshots persistence ──

interface VersionsPayload {
  snapshots: Snapshot[];
  baselineId: string | null;
}

let versionsDebounce: ReturnType<typeof setTimeout> | null = null;

export function saveVersions(snapshots: Snapshot[], baselineId: string | null): void {
  if (versionsDebounce) clearTimeout(versionsDebounce);
  versionsDebounce = setTimeout(() => {
    try {
      const payload: VersionsPayload = { snapshots, baselineId };
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(payload));
    } catch {
      // localStorage full — silently ignore
    }
  }, 1000);
}

export function loadVersions(): VersionsPayload | null {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as VersionsPayload;
    if (Array.isArray(payload.snapshots)) {
      return payload;
    }
  } catch {
    // Corrupted — ignore
  }
  return null;
}

// ── File export (.floorplan JSON) ──

export function exportProjectFile(data: FloorPlan, name: string): void {
  const project: ProjectFile = {
    version: 1,
    name,
    createdAt: loadCreatedAt(),
    updatedAt: new Date().toISOString(),
    data,
  };
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.floorplan`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── File import ──

export function importProjectFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = JSON.parse(reader.result as string) as ProjectFile;
        if (!project.data?.walls) {
          throw new Error('Format invalide');
        }
        if (!project.data.labels) project.data.labels = [];
        if (!project.data.openings) project.data.openings = [];
        if (!project.data.furniture) project.data.furniture = [];
        resolve(project);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Fichier invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture'));
    reader.readAsText(file);
  });
}
