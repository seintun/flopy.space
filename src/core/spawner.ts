import {
  SPAWN_X, PIPE_SPACING_DIST, GAP_WANDER_MAX, GROUND_Y, CEILING_Y,
  ORB_EVERY_PIPES_MIN, ORB_EVERY_PIPES_MAX, DT,
  KINETIC_PIPES_START_SCORE, MAX_PIPE_MOTION_AMP, MAX_PIPE_MOTION_FREQ, KINETIC_MIN_GAP,
} from "./constants";
import { worldRand } from "./rand";
import { gapForScore, isBreatherPipe } from "./difficulty";
import { pickRandomPowerUp } from "./powerups";
import type { PipeMotionType, World } from "./types";

const BIRD_DESPAWN_X = -SPAWN_X;

export function gapBounds(gapHeight: number): { lo: number; hi: number } {
  const half = gapHeight / 2;
  return { lo: GROUND_Y + 1.2 + half, hi: CEILING_Y - 1.2 - half };
}

function spawnTokenCluster(w: World, prevGc: number, nextGc: number, spacing: number): void {
  const formationRng = worldRand(w);
  const midX = SPAWN_X - spacing / 2;
  const avgGc = (prevGc + nextGc) / 2;

  // 1. High Ceiling Arc (3 coins) - rewards high greed
  if (formationRng < 0.25) {
    const peakY = Math.min(CEILING_Y - 1.8, Math.max(avgGc + 1.8, 3.2));
    const stepX = spacing * 0.22;
    w.tokens.push(
      { id: w.nextTokenId++, x: midX - stepX, y: peakY - 0.5, taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX, y: peakY, taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX + stepX, y: peakY - 0.5, taken: false, value: 1 },
    );
  }
  // 2. Low Ground Skimmer (3 coins) - rewards diving
  else if (formationRng < 0.50) {
    const floorY = Math.max(GROUND_Y + 1.6, Math.min(avgGc - 1.8, -2.5));
    const stepX = spacing * 0.22;
    w.tokens.push(
      { id: w.nextTokenId++, x: midX - stepX, y: floorY + 0.4, taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX, y: floorY, taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX + stepX, y: floorY + 0.4, taken: false, value: 1 },
    );
  }
  // 3. S-Curve Sine Wave (4 coins) - rhythmic flow flap
  else if (formationRng < 0.75) {
    const count = 4;
    const stepX = spacing * 0.6 / (count - 1);
    const startX = midX - (spacing * 0.3);
    for (let i = 0; i < count; i++) {
      const x = startX + i * stepX;
      const waveY = avgGc + Math.sin((i / (count - 1)) * Math.PI * 2) * 1.2;
      const clampedY = Math.min(CEILING_Y - 2.0, Math.max(GROUND_Y + 2.0, waveY));
      w.tokens.push({ id: w.nextTokenId++, x, y: clampedY, taken: false, value: 1 });
    }
  }
  // 4. The Greedy Fork or Diamond Cluster (4 coins)
  else {
    const stepX = spacing * 0.2;
    w.tokens.push(
      { id: w.nextTokenId++, x: midX - stepX, y: avgGc, taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX, y: Math.min(CEILING_Y - 2.0, avgGc + 1.2), taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX, y: Math.max(GROUND_Y + 2.0, avgGc - 1.2), taken: false, value: 1 },
      { id: w.nextTokenId++, x: midX + stepX, y: avgGc, taken: false, value: 1 },
    );
  }
}

function spawnPipe(w: World): void {
  const isBreather = isBreatherPipe(w.pipesPassed);
  let gh = gapForScore(w.score, w.rewindsUsedRun, isBreather);

  // Check if we should spawn in-flight token formation
  const willSpawnTokens = w.nextTokenPipesIn <= 0 && w.nextOrbPipesIn > 1 && !isBreather;
  if (willSpawnTokens) {
    // Dynamic Gap Expansion: +0.8 units safe vertical runway when tokens are present
    gh = Math.min(5.2, gh + 0.8);
  }

  const { lo, hi } = gapBounds(gh);
  // Flatten wander during breather pipes to allow rest and rhythm reset
  const delta = isBreather ? 0 : (worldRand(w) * 2 - 1) * GAP_WANDER_MAX;
  const gc = Math.min(hi, Math.max(lo, w.lastGapCenter + delta));
  const prevGc = w.lastGapCenter;
  w.lastGapCenter = gc;
  if (w.spawnHistory.length > 50) w.spawnHistory.shift();
  w.spawnHistory.push(gc);

  let motionType: PipeMotionType = "static";
  let motionAmp = 0;
  let motionFreq = 0;
  let motionPhase = 0;

  if (w.score >= KINETIC_PIPES_START_SCORE && !isBreather) {
    const motionRoll = worldRand(w);
    if (motionRoll < 0.25) {
      // Sine Bobber (vertical translation)
      motionType = "sine";
      motionAmp = Math.min(MAX_PIPE_MOTION_AMP, 0.4 + worldRand(w) * 0.5);
      motionFreq = Math.min(MAX_PIPE_MOTION_FREQ, 1.0 + worldRand(w) * 0.8);
      motionPhase = worldRand(w) * Math.PI * 2;
    } else if (motionRoll < 0.45) {
      // Accordion Breathing (gap height dilation)
      motionType = "accordion";
      motionAmp = 0.35 + worldRand(w) * 0.35;
      motionFreq = 1.0 + worldRand(w) * 0.7;
      motionPhase = worldRand(w) * Math.PI * 2;
      // Ensure base gap height gives guaranteed clearance even at lowest compression
      gh = Math.max(gh, KINETIC_MIN_GAP + motionAmp);
    }
  }

  w.pipes.push({
    id: w.nextPipeId++,
    x: SPAWN_X,
    gapCenter: gc,
    gapHeight: gh,
    scored: false,
    motionType,
    motionAmp,
    motionFreq,
    motionPhase,
    baseGapCenter: gc,
    baseGapHeight: gh,
  });

  // Dynamic pipe spacing: expand corridor by +35% (11.0 -> 14.85) when token cluster exists
  let dynamicSpacing = PIPE_SPACING_DIST;

  if (willSpawnTokens) {
    dynamicSpacing = Math.round(PIPE_SPACING_DIST * 1.35 * 10) / 10;
    spawnTokenCluster(w, prevGc, gc, dynamicSpacing);
    w.nextTokenPipesIn = 3 + Math.floor(worldRand(w) * 4); // 3 to 6 pipes between token formations
  } else {
    w.nextTokenPipesIn--;
  }

  if (--w.nextOrbPipesIn <= 0) {
    spawnOrb(w, gc);
    const range = ORB_EVERY_PIPES_MAX - ORB_EVERY_PIPES_MIN;
    w.nextOrbPipesIn = ORB_EVERY_PIPES_MIN + Math.floor(worldRand(w) * (range + 1));
  }

  w.nextPipeAtDist += dynamicSpacing;
}

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
  const t = w.tick * DT;

  for (const p of w.pipes) {
    p.x -= dx;
    if (p.motionType === "sine" && p.motionAmp && p.motionFreq && p.baseGapCenter !== undefined) {
      const { lo, hi } = gapBounds(p.gapHeight);
      const targetGc = p.baseGapCenter + p.motionAmp * Math.sin(p.motionFreq * t + (p.motionPhase || 0));
      p.gapCenter = Math.min(hi, Math.max(lo, targetGc));
    } else if (p.motionType === "accordion" && p.motionAmp && p.motionFreq && p.baseGapHeight !== undefined) {
      const targetGh = p.baseGapHeight + p.motionAmp * Math.sin(p.motionFreq * t + (p.motionPhase || 0));
      p.gapHeight = Math.max(KINETIC_MIN_GAP, targetGh);
      const { lo, hi } = gapBounds(p.gapHeight);
      p.gapCenter = Math.min(hi, Math.max(lo, p.baseGapCenter ?? p.gapCenter));
    }
  }

  for (const o of w.orbs) o.x -= dx;
  for (const t_ of w.tokens) t_.x -= dx;

  while (w.pipes.length && w.pipes[0]!.x < BIRD_DESPAWN_X) w.pipes.shift();
  while (w.orbs.length && w.orbs[0]!.x < BIRD_DESPAWN_X) w.orbs.shift();
  while (w.tokens.length && w.tokens[0]!.x < BIRD_DESPAWN_X) w.tokens.shift();

  while (w.dist >= w.nextPipeAtDist) {
    spawnPipe(w);
  }
}
