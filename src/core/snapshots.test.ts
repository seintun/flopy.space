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

  it("preserves kinetic moving pipe parameters and scale timers across rewind", () => {
    const w = createWorld(456);
    w.chibiTimer = 4.2;
    w.chubbyTimer = 0.0;
    w.pipes.push({
      id: 99,
      x: 5.0,
      gapCenter: 1.0,
      gapHeight: 3.5,
      scored: false,
      motionType: "sine",
      motionAmp: 0.8,
      motionFreq: 1.5,
      motionPhase: 0.5,
      baseGapCenter: 1.0,
      baseGapHeight: 3.5,
    });

    const buf = new SnapshotBuffer();
    buf.record(w);

    // Modify world state
    w.chibiTimer = 1.0;
    w.chubbyTimer = 5.0;
    w.pipes[0]!.motionType = "static";

    // Rewind back
    expect(buf.rewindInto(w)).toBe(true);
    expect(w.chibiTimer).toBe(4.2);
    expect(w.chubbyTimer).toBe(0.0);
    expect(w.pipes[0]!.motionType).toBe("sine");
    expect(w.pipes[0]!.motionAmp).toBe(0.8);
    expect(w.pipes[0]!.baseGapCenter).toBe(1.0);
  });
});
