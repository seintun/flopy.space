import { BASE_SCROLL, ORB_EVERY_PIPES_MIN } from "./constants";
import type { PowerUpType } from "./powerups";

export type HitType = "pipe" | "ground";

export interface BirdState {
  y: number;
  vy: number;
  pitch: number;
  alive: boolean;
  invulnUntilTick: number;
}

export interface Pipe {
  id: number;
  x: number;
  gapCenter: number;
  gapHeight: number;
  scored: boolean;
}

export interface Orb {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  taken: boolean;
}

export interface World {
  tick: number;
  dist: number;
  scrollSpeed: number;
  bird: BirdState;
  pipes: Pipe[];
  orbs: Orb[];
  nextPipeId: number;
  nextOrbId: number;
  lastGapCenter: number;
  nextPipeAtDist: number;
  nextOrbPipesIn: number;
  score: number;
  combo: number;
  feathersRun: number;
  rewindsUsedRun: number;
  rngState: number;
  spawnHistory: number[];
  hasShield: boolean;
  rainbowTrailTimer: number;
  magnetTimer: number;
}

export function createWorld(seed: number): World {
  return {
    tick: 0,
    dist: 0,
    scrollSpeed: BASE_SCROLL,
    bird: { y: 1.5, vy: 0, pitch: 0, alive: true, invulnUntilTick: 0 },
    pipes: [],
    orbs: [],
    nextPipeId: 1,
    nextOrbId: 1,
    lastGapCenter: 1,
    nextPipeAtDist: 18, // ~3s grace at speed 6
    nextOrbPipesIn: ORB_EVERY_PIPES_MIN,
    score: 0,
    combo: 0,
    feathersRun: 0,
    rewindsUsedRun: 0,
    rngState: seed >>> 0,
    spawnHistory: [],
    hasShield: false,
    rainbowTrailTimer: 0,
    magnetTimer: 0,
  };
}
