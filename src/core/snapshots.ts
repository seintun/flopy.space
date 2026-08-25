import { BUFFER_LEN } from "./constants";
import type { World } from "./types";

export class SnapshotBuffer {
  private slots: World[];
  private head = 0;
  private count = 0;
  private capacity: number;

  constructor(capacity = BUFFER_LEN) {
    this.capacity = capacity;
    this.slots = Array.from({ length: capacity }, () => createEmptyWorldSlot());
  }

  record(w: World): void {
    const target = this.slots[this.head]!;
    copyWorldState(w, target);
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  canRewind(): boolean {
    return this.count > 0;
  }

  get length(): number {
    return this.count;
  }

  /**
   * Finds the safest approach snapshot in the rewind buffer:
   * Selects a snapshot ~1.5s in the past where the hero has successfully cleared
   * the previous pipe and has ample open runway (pipe.x >= 4.0m) ahead.
   */
  findSafeSnapshotIndex(): number {
    if (this.count <= 1) return 0;

    const baseIdx = 0; // Oldest snapshot
    let bestIdx = baseIdx;
    let maxSafety = -Infinity;

    const searchEnd = Math.min(this.count - 1, 40);
    for (let i = 0; i <= searchEnd; i++) {
      const snap = this.getAt(i);
      if (!snap || !snap.bird.alive) continue;

      let safety = 100;
      const nextPipe = snap.pipes.find((p) => p.x > 0);
      if (nextPipe) {
        if (nextPipe.x < 3.2) {
          safety -= (3.2 - nextPipe.x) * 35;
        } else {
          safety += Math.min(nextPipe.x, 8.0) * 10;
        }
      } else {
        safety += 40;
      }

      safety -= i * 0.2;

      if (safety > maxSafety) {
        maxSafety = safety;
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  getAt(idx: number): World | undefined {
    if (idx < 0 || idx >= this.count) return undefined;
    const actualIdx = (this.head - this.count + idx + this.capacity) % this.capacity;
    return this.slots[actualIdx];
  }

  /** Gets all snapshots in reverse chronological order from impact back to safe snapshot */
  getSnapshotsReverse(): World[] {
    const safeIdx = this.findSafeSnapshotIndex();
    const result: World[] = [];
    for (let i = this.count - 1; i >= safeIdx; i--) {
      const snap = this.getAt(i);
      if (snap) result.push(snap);
    }
    return result;
  }

  /** Restores the safe approach snapshot into w. */
  rewindInto(w: World): boolean {
    if (!this.canRewind()) return false;
    const safeIdx = this.findSafeSnapshotIndex();
    const snap = this.getAt(safeIdx) || this.getAt(0);
    if (!snap) return false;

    copyWorldState(snap, w);
    if (w.bird.vy < -2.0) {
      w.bird.vy = 1.0;
    }
    // Seed buffer with the restored safe world state so future rewinds are always valid
    copyWorldState(w, this.slots[0]!);
    this.head = 1;
    this.count = 1;
    return true;
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
  }
}

function createEmptyWorldSlot(): World {
  return {
    tick: 0,
    dist: 0,
    scrollSpeed: 0,
    bird: { y: 0, vy: 0, pitch: 0, alive: true, invulnUntilTick: 0 },
    pipes: Array.from({ length: 8 }, () => ({ id: 0, x: 0, gapCenter: 0, gapHeight: 0, scored: false })),
    orbs: Array.from({ length: 4 }, () => ({ id: 0, type: "slowmo" as const, x: 0, y: 0, taken: false })),
    tokens: Array.from({ length: 16 }, () => ({ id: 0, x: 0, y: 0, taken: false, value: 1 })),
    nextTokenId: 0,
    nextPipeId: 0,
    nextOrbId: 0,
    lastGapCenter: 0,
    nextPipeAtDist: 0,
    nextOrbPipesIn: 0,
    nextTokenPipesIn: 0,
    score: 0,
    pipesPassed: 0,
    bonusScore: 0,
    combo: 0,
    feathersRun: 0,
    rewindsUsedRun: 0,
    rngState: 0,
    runSeed: 0,
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

function copyWorldState(src: World, dst: World): void {
  dst.tick = src.tick;
  dst.dist = src.dist;
  dst.scrollSpeed = src.scrollSpeed;
  dst.bird.y = src.bird.y;
  dst.bird.vy = src.bird.vy;
  dst.bird.pitch = src.bird.pitch;
  dst.bird.alive = src.bird.alive;
  dst.bird.invulnUntilTick = src.bird.invulnUntilTick;

  // Copy pipes
  dst.pipes.length = src.pipes.length;
  for (let i = 0; i < src.pipes.length; i++) {
    const sp = src.pipes[i]!;
    let dp = dst.pipes[i];
    if (!dp) {
      dp = { id: 0, x: 0, gapCenter: 0, gapHeight: 0, scored: false };
      dst.pipes[i] = dp;
    }
    dp.id = sp.id;
    dp.x = sp.x;
    dp.gapCenter = sp.gapCenter;
    dp.gapHeight = sp.gapHeight;
    dp.scored = sp.scored;
  }

  // Copy orbs
  dst.orbs.length = src.orbs.length;
  for (let i = 0; i < src.orbs.length; i++) {
    const so = src.orbs[i]!;
    let do_ = dst.orbs[i];
    if (!do_) {
      do_ = { id: 0, type: so.type, x: 0, y: 0, taken: false };
      dst.orbs[i] = do_;
    }
    do_.id = so.id;
    do_.type = so.type;
    do_.x = so.x;
    do_.y = so.y;
    do_.taken = so.taken;
  }

  // Copy tokens
  dst.tokens.length = src.tokens.length;
  for (let i = 0; i < src.tokens.length; i++) {
    const st = src.tokens[i]!;
    let dt = dst.tokens[i];
    if (!dt) {
      dt = { id: 0, x: 0, y: 0, taken: false, value: 1 };
      dst.tokens[i] = dt;
    }
    dt.id = st.id;
    dt.x = st.x;
    dt.y = st.y;
    dt.taken = st.taken;
    dt.value = st.value;
  }

  dst.nextTokenId = src.nextTokenId;
  dst.nextPipeId = src.nextPipeId;
  dst.nextOrbId = src.nextOrbId;
  dst.lastGapCenter = src.lastGapCenter;
  dst.nextPipeAtDist = src.nextPipeAtDist;
  dst.nextOrbPipesIn = src.nextOrbPipesIn;
  dst.nextTokenPipesIn = src.nextTokenPipesIn;
  dst.score = src.score;
  dst.pipesPassed = src.pipesPassed;
  dst.bonusScore = src.bonusScore;
  dst.combo = src.combo;
  dst.feathersRun = src.feathersRun;
  dst.rewindsUsedRun = src.rewindsUsedRun;
  dst.rngState = src.rngState;
  dst.runSeed = src.runSeed;
  dst.spawnHistory = [...src.spawnHistory];
  dst.hasShield = src.hasShield;
  dst.rainbowTrailTimer = src.rainbowTrailTimer;
  dst.magnetTimer = src.magnetTimer;
  dst.heavyGravityTimer = src.heavyGravityTimer;
  dst.speedSurgeTimer = src.speedSurgeTimer;
  dst.runDurationSec = src.runDurationSec;
  dst.lastFeatherPipe = src.lastFeatherPipe;
  dst.feathersEarnedRun = src.feathersEarnedRun;
  dst.tokensRunCollected = src.tokensRunCollected;
}
