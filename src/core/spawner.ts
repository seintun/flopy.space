import {
  SPAWN_X, PIPE_SPACING_DIST, GAP_WANDER_MAX, GROUND_Y, CEILING_Y,
  ORB_EVERY_PIPES_MIN, ORB_EVERY_PIPES_MAX,
} from "./constants";
import { worldRand } from "./rand";
import { gapForScore } from "./difficulty";
import type { World } from "./types";

const BIRD_DESPAWN_X = -SPAWN_X;

function gapBounds(gapHeight: number): { lo: number; hi: number } {
  const half = gapHeight / 2;
  return { lo: GROUND_Y + 1.2 + half, hi: CEILING_Y - 1.2 - half };
}

function spawnPipe(w: World): void {
  const gh = gapForScore(w.score, w.rewindsUsedRun);
  const { lo, hi } = gapBounds(gh);
  const delta = (worldRand(w) * 2 - 1) * GAP_WANDER_MAX;
  const gc = Math.min(hi, Math.max(lo, w.lastGapCenter + delta));
  w.lastGapCenter = gc;
  if (w.spawnHistory.length > 50) w.spawnHistory.shift();
  w.spawnHistory.push(gc);
  w.pipes.push({ id: w.nextPipeId++, x: SPAWN_X, gapCenter: gc, gapHeight: gh, scored: false });

  if (--w.nextOrbPipesIn <= 0) {
    spawnOrb(w, gc);
    const range = ORB_EVERY_PIPES_MAX - ORB_EVERY_PIPES_MIN;
    w.nextOrbPipesIn = ORB_EVERY_PIPES_MIN + Math.floor(worldRand(w) * (range + 1));
  }
}

import { pickRandomPowerUp } from "./powerups";

function spawnOrb(w: World, recentGapCenter: number): void {
  const y = Math.min(
    CEILING_Y - 1.5,
    Math.max(GROUND_Y + 1.5, recentGapCenter + (worldRand(w) * 2 - 1)),
  );
  const pType = pickRandomPowerUp(w);
  w.orbs.push({ id: w.nextOrbId++, type: pType, x: SPAWN_X - PIPE_SPACING_DIST / 2, y, taken: false });
}

export function advance(w: World, dt: number): void {
  const dx = w.scrollSpeed * dt;
  w.dist += dx;
  for (const p of w.pipes) p.x -= dx;
  for (const o of w.orbs) o.x -= dx;

  while (w.pipes.length && w.pipes[0]!.x < BIRD_DESPAWN_X) w.pipes.shift();
  while (w.orbs.length && w.orbs[0]!.x < BIRD_DESPAWN_X) w.orbs.shift();

  while (w.dist >= w.nextPipeAtDist) {
    spawnPipe(w);
    w.nextPipeAtDist += PIPE_SPACING_DIST;
  }
}
