import { describe, it, expect } from "vitest";
import { multiplier, processPasses } from "./scoring";
import { createWorld } from "./types";

describe("multiplier", () => {
  it("steps 1..3 with wide gap to tier 3 (at streak 20+)", () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(5)).toBe(1);
    expect(multiplier(6)).toBe(2);
    expect(multiplier(19)).toBe(2);
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

  it("progressive feather thresholds and 15-pipe cooldown", () => {
    const w = createWorld(1);
    w.pipesPassed = 14;
    w.bonusScore = 5;
    w.score = 19;
    w.lastFeatherPipe = 0;
    w.feathersRun = 0;
    w.pipes.push({ id: 1, x: -1, gapCenter: 1, gapHeight: 9, scored: false });
    
    // Pipe 15 reached score 20 (15 pipes + 5 bonus) -> awards first feather!
    processPasses(w);
    expect(w.score).toBe(20);
    expect(w.pipesPassed).toBe(15);
    expect(w.feathersRun).toBe(1);
    expect(w.lastFeatherPipe).toBe(15);

    // Score 55 reached but only 10 pipes since last feather -> NOT awarded yet (cooldown active)
    w.pipesPassed = 24; // 24 - 15 = 9 (< 15)
    w.bonusScore = 30; // 24 + 30 = 54
    w.score = 54;
    w.pipes.push({ id: 2, x: -1, gapCenter: 1, gapHeight: 9, scored: false });
    const ev2 = processPasses(w)[0]!;
    expect(ev2.earnedFeather).toBe(false);
    expect(w.feathersRun).toBe(1);

    // Pipes passed reaches 30 (>= 15 since pipe 15) and score >= 55 -> awards 2nd feather!
    w.pipesPassed = 29;
    w.bonusScore = 25; // 29 + 25 = 54, next pipe makes 30 + 25 = 55
    w.pipes.push({ id: 3, x: -1, gapCenter: 1, gapHeight: 9, scored: false });
    const ev3 = processPasses(w)[0]!;
    expect(ev3.earnedFeather).toBe(true);
    expect(w.feathersRun).toBe(2);
    expect(w.lastFeatherPipe).toBe(30);
  });
});
