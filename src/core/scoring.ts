import {
  BIRD_X,
  PIPE_RADIUS,
  NEAR_MISS_MARGIN,
  COMBO_TIER_2,
  COMBO_TIER_3,
} from "./constants";
import type { World } from "./types";

export interface PassEvent {
  pipeId: number;
  nearMiss: boolean;
  rawPoint: number;
  bonusPoints: number;
  points: number;
  earnedFeather?: boolean;
}

export function multiplier(combo: number): number {
  if (combo >= COMBO_TIER_3) return 3;
  if (combo >= COMBO_TIER_2) return 2;
  return 1;
}

/**
 * Progressive feather thresholds:
 * Feather 1 at score 20
 * Feather 2 at score 55 (+35)
 * Feather 3 at score 105 (+50)
 * Feather 4 at score 170 (+65)
 * Feather 5 at score 250 (+80)
 */
export function getNextFeatherScoreThreshold(feathersEarned: number): number {
  const k = Math.max(0, feathersEarned);
  return 20 + 20 * k + 15 * ((k * (k + 1)) / 2);
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
    const chubbyBonus = (w.chubbyTimer && w.chubbyTimer > 0) ? 3 : 0;
    const totalBonus = spreeBonus + nearMissBonus + chubbyBonus;

    w.bonusScore = (w.bonusScore || 0) + totalBonus;
    w.score = w.pipesPassed + w.bonusScore;

    let earnedFeather = false;
    const nextThreshold = getNextFeatherScoreThreshold(w.feathersEarnedRun || 0);
    const pipesSinceLast = (w.pipesPassed || 0) - (w.lastFeatherPipe || 0);

    // Require reaching the progressive score threshold AND clearing >= 15 pipes since previous feather
    if (w.score >= nextThreshold && pipesSinceLast >= 15) {
      w.feathersRun = Math.min(3, w.feathersRun + 1);
      w.feathersEarnedRun = (w.feathersEarnedRun || 0) + 1;
      w.lastFeatherPipe = w.pipesPassed;
      earnedFeather = true;
    }

    events.push({
      pipeId: p.id,
      nearMiss,
      rawPoint: 1,
      bonusPoints: totalBonus,
      points: 1 + totalBonus,
      earnedFeather,
    });
  }
  return events;
}
