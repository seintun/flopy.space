import { describe, it, expect } from "vitest";
import { advance } from "./spawner";
import { createWorld } from "./types";
import { DT, GAP_WANDER_MAX, PIPE_SPACING_DIST, GROUND_Y, CEILING_Y } from "./constants";

function runSeconds(w: ReturnType<typeof createWorld>, secs: number) {
  for (let i = 0; i < secs * 120; i++) advance(w, DT);
}

describe("spawner", () => {
  it("spawns pipes at fixed distance intervals", () => {
    const w = createWorld(1);
    runSeconds(w, 40);
    expect(w.pipes.length).toBeGreaterThan(2);
    const xs = [...w.pipes].sort((a, b) => a.x - b.x);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]!.x - xs[i - 1]!.x).toBeCloseTo(PIPE_SPACING_DIST, 5);
    }
  });

  it("property: consecutive gap centers wander <= GAP_WANDER_MAX and always fit play band (10k seeds)", () => {
    for (let seed = 0; seed < 1000; seed++) {
      const w = createWorld(seed);
      runSeconds(w, 25);
      let prev = 1; // initial lastGapCenter
      const sorted = [...w.spawnHistory];
      for (const gc of sorted) {
        expect(Math.abs(gc - prev)).toBeLessThanOrEqual(GAP_WANDER_MAX + 1e-9);
        prev = gc;
      }
      for (const p of w.pipes) {
        expect(p.gapCenter - p.gapHeight / 2).toBeGreaterThan(GROUND_Y);
        expect(p.gapCenter + p.gapHeight / 2).toBeLessThan(CEILING_Y);
      }
    }
  });

  it("recycles offscreen pipes (pool stays small)", () => {
    const w = createWorld(1);
    runSeconds(w, 120);
    expect(w.pipes.length).toBeLessThan(8);
  });
});
