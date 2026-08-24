import { BIRD_X, PIPE_RADIUS, NEAR_MISS_MARGIN, COMBO_CAP, COMBO_PASSES_PER_STEP, FEATHER_EVERY_POINTS } from "./constants";
import type { World } from "./types";

export interface PassEvent {
  pipeId: number;
  nearMiss: boolean;
  rawPoint: number;
  bonusPoints: number;
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
    
    w.pipesPassed = (w.pipesPassed || 0) + 1;

    const gapTop = p.gapCenter + p.gapHeight / 2;
    const gapBot = p.gapCenter - p.gapHeight / 2;
    const distToEdge = Math.min(Math.abs(w.bird.y - gapTop), Math.abs(w.bird.y - gapBot));
    const nearMiss = distToEdge < NEAR_MISS_MARGIN;

    w.combo += nearMiss ? 2 : 1;
    const mult = multiplier(w.combo); // 1, 2, or max 3
    const spreeBonus = mult - 1; // 0, 1, or 2 bonus points
    const nearMissBonus = nearMiss ? 1 : 0;
    const totalBonus = spreeBonus + nearMissBonus;

    w.bonusScore = (w.bonusScore || 0) + totalBonus;
    const before = w.score;
    w.score = w.pipesPassed + w.bonusScore;

    if (Math.floor(w.score / FEATHER_EVERY_POINTS) > Math.floor(before / FEATHER_EVERY_POINTS)) {
      w.feathersRun = Math.min(3, w.feathersRun + 1);
    }

    events.push({
      pipeId: p.id,
      nearMiss,
      rawPoint: 1,
      bonusPoints: totalBonus,
      points: 1 + totalBonus,
    });
  }
  return events;
}
