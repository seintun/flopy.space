import { describe, it, expect } from "vitest";
import { scrollForScore, gapForScore, getRewindTierParams } from "./difficulty";
import { BASE_SCROLL, MAX_SCROLL, GAP_START, GAP_MIN, GAP_SHRINK_END_SCORE } from "./constants";

describe("scrollForScore", () => {
  it("starts at base and caps at max", () => {
    expect(scrollForScore(0)).toBe(BASE_SCROLL);
    expect(scrollForScore(1000)).toBe(MAX_SCROLL);
  });
  it("ramps monotonically", () => {
    for (let s = 1; s <= 60; s++) expect(scrollForScore(s)).toBeGreaterThanOrEqual(scrollForScore(s - 1));
  });
  it("progressively accelerates scroll speed on repeated rewinds", () => {
    const s0 = scrollForScore(10, 0);
    const s1 = scrollForScore(10, 1);
    const s2 = scrollForScore(10, 2);
    expect(s1).toBeGreaterThan(s0);
    expect(s2).toBeGreaterThan(s1);
  });
});

describe("gapForScore", () => {
  it("shrinks linearly from start to min by score 40 then holds", () => {
    expect(gapForScore(0)).toBe(GAP_START);
    expect(gapForScore(GAP_SHRINK_END_SCORE)).toBeCloseTo(GAP_MIN);
    expect(gapForScore(100)).toBe(GAP_MIN);
    expect(gapForScore(20)).toBeCloseTo((GAP_START + GAP_MIN) / 2);
  });
  it("progressively tightens gap slightly on repeated rewinds", () => {
    const g0 = gapForScore(10, 0);
    const g1 = gapForScore(10, 1);
    const g2 = gapForScore(10, 2);
    expect(g1).toBeLessThan(g0);
    expect(g2).toBeLessThan(g1);
  });
});

describe("getRewindTierParams", () => {
  it("returns progressively harder invulnerability and recovery parameters", () => {
    const tier1 = getRewindTierParams(0);
    const tier2 = getRewindTierParams(1);
    const tier3 = getRewindTierParams(2);

    // Invulnerability shrinks: 120 -> 75 -> 45 ticks
    expect(tier1.invulnTicks).toBe(120);
    expect(tier2.invulnTicks).toBe(75);
    expect(tier3.invulnTicks).toBe(45);

    // Initial slow-mo scale gets faster (less forgiving): 0.45 -> 0.65 -> 0.85
    expect(tier1.slowmoInitialScale).toBeLessThan(tier2.slowmoInitialScale);
    expect(tier2.slowmoInitialScale).toBeLessThan(tier3.slowmoInitialScale);

    // Slow-mo duration gets shorter: 1.8s -> 1.2s -> 0.7s
    expect(tier1.slowmoDuration).toBeGreaterThan(tier2.slowmoDuration);
    expect(tier2.slowmoDuration).toBeGreaterThan(tier3.slowmoDuration);
  });
});
