import { BUFFER_LEN } from "./constants";
import type { World } from "./types";

export class SnapshotBuffer {
  private buf: World[] = [];

  record(w: World): void {
    this.buf.push(cloneWorld(w));
    if (this.buf.length > BUFFER_LEN) this.buf.shift();
  }

  canRewind(): boolean {
    return this.buf.length >= BUFFER_LEN;
  }

  get length(): number {
    return this.buf.length;
  }

  /**
   * Finds the safest approach snapshot in the rewind buffer:
   * Selects a snapshot ~1.5s in the past where the hero has successfully cleared
   * the previous pipe and has ample open runway (pipe.x >= 4.0m) ahead.
   */
  findSafeSnapshotIndex(): number {
    if (this.buf.length === 0) return 0;
    if (this.buf.length < BUFFER_LEN) return 0;

    const baseIdx = 0; // Oldest snapshot (1.5s / BUFFER_LEN ticks ago)
    let bestIdx = baseIdx;
    let maxSafety = -Infinity;

    // Search around the 1.5s mark (+/- 30 ticks) for the safest position
    const searchEnd = Math.min(this.buf.length - 1, 40);
    for (let i = 0; i <= searchEnd; i++) {
      const snap = this.buf[i];
      if (!snap || !snap.bird.alive) continue;

      let safety = 100;
      const nextPipe = snap.pipes.find((p) => p.x > 0);
      if (nextPipe) {
        if (nextPipe.x < 3.2) {
          // Dangerously close in front of pipe
          safety -= (3.2 - nextPipe.x) * 35;
        } else {
          // Generous reaction distance in front
          safety += Math.min(nextPipe.x, 8.0) * 10;
        }
      } else {
        safety += 40;
      }

      // Proximity to oldest snapshot target
      safety -= i * 0.2;

      if (safety > maxSafety) {
        maxSafety = safety;
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  /** Gets all snapshots in reverse chronological order from impact back to safe snapshot */
  getSnapshotsReverse(): World[] {
    const safeIdx = this.findSafeSnapshotIndex();
    return this.buf.slice(safeIdx).reverse();
  }

  /** Restores the safe approach snapshot into w. */
  rewindInto(w: World): boolean {
    if (!this.canRewind()) return false;
    const safeIdx = this.findSafeSnapshotIndex();
    const snap = this.buf[safeIdx] || this.buf[0]!;
    
    const cloned = cloneWorld(snap);
    // Neutralize steep downward plunge so player has immediate aerodynamic control
    if (cloned.bird.vy < -2.0) {
      cloned.bird.vy = 1.0;
    }

    Object.assign(w, cloned);
    this.buf = [];
    return true;
  }
}

function cloneWorld(w: World): World {
  return {
    ...w,
    bird: { ...w.bird },
    pipes: w.pipes.map((p) => ({ ...p })),
    orbs: w.orbs.map((o) => ({ ...o })),
    spawnHistory: [...w.spawnHistory],
  };
}
