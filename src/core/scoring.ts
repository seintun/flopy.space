import { BIRD_X, PIPE_RADIUS, NEAR_MISS_MARGIN, COMBO_CAP, COMBO_PASSES_PER_STEP, FEATHER_EVERY_POINTS } from "./constants";
import type { World } from "./types";

export interface PassEvent {
  pipeId: number;
  nearMiss: boolean;
  points: number;
}

export function multiplier(combo: number): number {
  return Math.min(COMBO_CAP, 1 + Math.floor(Math.max(0, combo) / COMBO_PASSES_PER_STEP));
}

export function processPasses(w: World): PassEvent[] {
  const events: PassEvent[] = [];
  for (const p of w.pipes) {
    if (p.scored || p.x >= BIRD_X - PIPE_RADIUS) continue;
    p.scored = true;
    const gapTop = p.gapCenter + p.gapHeight / 2;
    const gapBot = p.gapCenter - p.gapHeight / 2;
    const distToEdge = Math.min(Math.abs(w.bird.y - gapTop), Math.abs(w.bird.y - gapBot));
    const nearMiss = distToEdge < NEAR_MISS_MARGIN;
    w.combo += nearMiss ? 2 : 1;
    const points = multiplier(w.combo);
    const before = w.score;
    w.score += points;
    if (Math.floor(w.score / FEATHER_EVERY_POINTS) > Math.floor(before / FEATHER_EVERY_POINTS)) {
      w.feathersRun++;
    }
    events.push({ pipeId: p.id, nearMiss, points });
  }
  return events;
}
