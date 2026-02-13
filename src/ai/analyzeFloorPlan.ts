import type { FloorPlan, AIAnalysisResult } from '../types';
import { snap } from '../utils/geometry';
import { createWall, createDoor, createWindow, createLabel } from '../utils/defaults';
import { detectRoomsFromWalls } from '../utils/roomDetection';
import { FLOOR_PLAN_ANALYSIS_PROMPT } from './prompts';

export interface AnalysisProgress {
  status: 'analyzing' | 'done' | 'error';
  message: string;
}

export async function analyzeFloorPlan(
  imageData: string,
  mediaType: string,
  onProgress: (progress: AnalysisProgress) => void
): Promise<FloorPlan> {
  onProgress({ status: 'analyzing', message: 'Envoi du plan à Claude Vision...' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/png',
                data: imageData,
              },
            },
            { type: 'text', text: FLOOR_PLAN_ANALYSIS_PROMPT },
          ],
        },
      ],
    }),
  });

  onProgress({ status: 'analyzing', message: 'Analyse de la structure...' });

  const result = await response.json();
  if (!result.content?.[0]) {
    throw new Error('Réponse AI vide');
  }

  const text = result.content
    .map((c: { text?: string }) => c.text || '')
    .join('');
  const clean = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  onProgress({ status: 'analyzing', message: 'Construction du plan digital...' });

  let parsed: AIAnalysisResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) {
      parsed = JSON.parse(m[0]);
    } else {
      throw new Error('JSON invalide');
    }
  }

  if (!parsed.walls?.length) {
    throw new Error('Aucun mur détecté');
  }

  const walls = parsed.walls.map((w) =>
    createWall(snap(w.x1), snap(w.y1), snap(w.x2), snap(w.y2), w.label)
  );

  const openings: FloorPlan['openings'] = [];

  parsed.doors?.forEach((d) => {
    if (d.wallIndex >= 0 && d.wallIndex < walls.length) {
      openings.push(
        createDoor(
          walls[d.wallIndex]!.id,
          Math.max(0.05, Math.min(0.95, d.position || 0.5)),
          d.width || 0.9
        )
      );
    }
  });

  parsed.windows?.forEach((w) => {
    if (w.wallIndex >= 0 && w.wallIndex < walls.length) {
      openings.push(
        createWindow(
          walls[w.wallIndex]!.id,
          Math.max(0.05, Math.min(0.95, w.position || 0.5)),
          w.width || 1.2
        )
      );
    }
  });

  const doorCount = parsed.doors?.length ?? 0;
  const windowCount = parsed.windows?.length ?? 0;

  // Parse room labels from AI response, or auto-detect from walls
  const labels = parsed.rooms?.length
    ? parsed.rooms.map((r) =>
        createLabel(snap(r.cx), snap(r.cy), r.name, r.area_m2 || 0)
      )
    : detectRoomsFromWalls(walls);

  onProgress({
    status: 'done',
    message: `${walls.length} murs, ${doorCount} portes, ${windowCount} fenêtres, ${labels.length} pièces`,
  });

  return { walls, openings, labels, furniture: [] };
}
