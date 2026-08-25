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

export interface InFlightToken {
  id: number;
  x: number;
  y: number;
  taken: boolean;
  value: number;
}

export interface World {
  tick: number;
  dist: number;
  scrollSpeed: number;
  bird: BirdState;
  pipes: Pipe[];
  orbs: Orb[];
  tokens: InFlightToken[];
  nextTokenId: number;
  nextPipeId: number;
  nextOrbId: number;
  lastGapCenter: number;
  nextPipeAtDist: number;
  nextOrbPipesIn: number;
  nextTokenPipesIn: number;
  score: number;
  pipesPassed: number;
  bonusScore: number;
  combo: number;
  feathersRun: number;
  rewindsUsedRun: number;
  rngState: number;
  runSeed: number;
  spawnHistory: number[];
  hasShield: boolean;
  rainbowTrailTimer: number;
  magnetTimer: number;
  heavyGravityTimer: number;
  speedSurgeTimer: number;
  runDurationSec: number;
  lastFeatherPipe: number;
  feathersEarnedRun: number;
  tokensRunCollected: number;
}

export function createWorld(seed: number): World {
  return {
    tick: 0,
    dist: 0,
    scrollSpeed: BASE_SCROLL,
    bird: { y: 1.5, vy: 0, pitch: 0, alive: true, invulnUntilTick: 0 },
    pipes: [],
    orbs: [],
    tokens: [],
    nextTokenId: 1,
    nextPipeId: 1,
    nextOrbId: 1,
    lastGapCenter: 1,
    nextPipeAtDist: 3, // ~0.5s initial spawn, reaching player in ~2.3s
    nextOrbPipesIn: ORB_EVERY_PIPES_MIN,
    nextTokenPipesIn: 3, // first token cluster around pipe 3
    score: 0,
    pipesPassed: 0,
    bonusScore: 0,
    combo: 0,
    feathersRun: 0,
    rewindsUsedRun: 0,
    rngState: seed >>> 0,
    runSeed: seed >>> 0,
    spawnHistory: [],
    hasShield: false,
    rainbowTrailTimer: 0,
    magnetTimer: 0,
    heavyGravityTimer: 0,
    speedSurgeTimer: 0,
    runDurationSec: 0,
    lastFeatherPipe: 0,
    feathersEarnedRun: 0,
    tokensRunCollected: 0,
  };
}
