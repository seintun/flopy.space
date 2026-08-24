import { describe, it, expect } from "vitest";
import { multiplier, processPasses } from "./scoring";
import { createWorld } from "./types";

describe("multiplier", () => {
  it("steps 1..3 and caps at 3x", () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(4)).toBe(1);
    expect(multiplier(5)).toBe(2);
    expect(multiplier(10)).toBe(3);
    expect(multiplier(20)).toBe(3);
    expect(multiplier(100)).toBe(3);
  });
});

describe("processPasses", () => {
  it("scores unscored pipe once, awards combo+points and tracks pipesPassed", () => {
    const w = createWorld(1);
    w.pipes.push({ id: 1, x: -1, gapCenter: 1, gapHeight: 4.5, scored: false });
    w.bird.y = 1;
    const ev = processPasses(w);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ pipeId: 1, points: 1, nearMiss: false, rawPoint: 1, bonusPoints: 0 });
    expect(w.score).toBe(1);
    expect(w.pipesPassed).toBe(1);
    expect(w.bonusScore).toBe(0);
    expect(processPasses(w)).toHaveLength(0); // not twice
  });

  it("near-miss bumps combo faster and grants bonus points", () => {
    const w = createWorld(1);
    w.pipes.push({ id: 1, x: -1, gapCenter: 1, gapHeight: 4.5, scored: false });
    w.bird.y = 1 + 4.5 / 2 + 0.15; // within NEAR_MISS_MARGIN of edge
    const ev = processPasses(w)[0]!;
    expect(ev.nearMiss).toBe(true);
    expect(w.combo).toBe(2);
    expect(w.pipesPassed).toBe(1);
    expect(w.bonusScore).toBe(1);
    expect(w.score).toBe(2);
  });

  it("feather every 10 points", () => {
    const w = createWorld(1);
    w.score = 9;
    w.pipesPassed = 9;
    w.feathersRun = 0;
    w.pipes.push({ id: 1, x: -1, gapCenter: 1, gapHeight: 9, scored: false });
    processPasses(w);
    expect(w.score).toBe(10);
    expect(w.feathersRun).toBe(1);
  });
});
