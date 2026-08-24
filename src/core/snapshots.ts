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

  /** Gets all snapshots in reverse chronological order (for replay) */
  getSnapshotsReverse(): World[] {
    return [...this.buf].reverse();
  }

  /** Restores oldest snapshot (BUFFER_LEN ticks ago) into w. */
  rewindInto(w: World): boolean {
    if (!this.canRewind()) return false;
    const snap = this.buf.shift()!;
    Object.assign(w, cloneWorld(snap));
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
