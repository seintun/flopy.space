import { describe, it, expect } from "vitest";
import { SnapshotBuffer } from "./snapshots";
import { createWorld } from "./types";
import { flap } from "./physics";
import { advance } from "./spawner";
import { processPasses } from "./scoring";
import { DT, BUFFER_LEN } from "./constants";

describe("SnapshotBuffer", () => {
  it("rewindInto restores exact world state from 180 ticks ago", () => {
    const w = createWorld(123);
    const buf = new SnapshotBuffer();
    for (let i = 0; i < 300; i++) {
      buf.record(w);
      if (i % 37 === 0) flap(w);
      advance(w, DT);
      processPasses(w);
      w.tick++;
    }
    const saved = JSON.parse(JSON.stringify({
      tick: w.tick, dist: w.dist, score: w.score, combo: w.combo,
      birdY: w.bird.y, birdVy: w.bird.vy, rngState: w.rngState,
      pipeCount: w.pipes.length,
    }));
    expect(buf.canRewind()).toBe(true);
    expect(buf.rewindInto(w)).toBe(true);
    expect(w.tick).toBe(saved.tick - BUFFER_LEN);
    expect(w.bird.y).toBeCloseTo(saved.birdY, 10);

    // advance w forward 50 ticks
    for (let i = 0; i < 50; i++) {
      if ((w.tick) % 37 === 0) flap(w);
      advance(w, DT);
      processPasses(w);
      w.tick++;
    }

    // replay from scratch up to tick 170 (300 - 180 + 50)
    const w2 = createWorld(123);
    for (let i = 0; i < 170; i++) {
      if (i % 37 === 0) flap(w2);
      advance(w2, DT);
      processPasses(w2);
      w2.tick++;
    }
    expect(w.rngState).toBe(w2.rngState);
    expect(w.score).toBe(w2.score);
    expect(w.bird.y).toBeCloseTo(w2.bird.y, 10);
  });

  it("cannot rewind when buffer is empty", () => {
    const w = createWorld(1);
    const buf = new SnapshotBuffer();
    expect(buf.canRewind()).toBe(false);
    expect(buf.rewindInto(w)).toBe(false);
  });
});
