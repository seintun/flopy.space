import { describe, it, expect } from "vitest";
import { scrollForScore, gapForScore, getRewindTierParams, isBreatherPipe } from "./difficulty";
import { BASE_SCROLL, MAX_SCROLL, GAP_START, GAP_MIN } from "./constants";

describe("scrollForScore", () => {
  it("starts at base and caps at max", () => {
    expect(scrollForScore(0)).toBe(BASE_SCROLL);
    expect(scrollForScore(1000)).toBeCloseTo(MAX_SCROLL, 1);
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
  it("applies speed surge boost when speedSurgeTimer > 0", () => {
    const normal = scrollForScore(10, 0, 0);
    const surged = scrollForScore(10, 0, 2.5);
    expect(surged).toBeGreaterThan(normal);
    expect(surged).toBe(normal + 2.5);
  });
});

describe("gapForScore and breather", () => {
  it("shrinks smoothly from start gap and maintains safe minimum", () => {
    expect(gapForScore(0)).toBe(GAP_START);
    expect(gapForScore(100)).toBeGreaterThanOrEqual(GAP_MIN - 0.2);
    expect(gapForScore(20)).toBeLessThan(GAP_START);
  });
  it("provides generous breather gaps when isBreather is true", () => {
    expect(gapForScore(50, 0, true)).toBe(4.8);
  });
  it("identifies breather cadence every 15 pipes", () => {
    expect(isBreatherPipe(0)).toBe(false);
    expect(isBreatherPipe(15)).toBe(true);
    expect(isBreatherPipe(16)).toBe(true);
    expect(isBreatherPipe(17)).toBe(false);
    expect(isBreatherPipe(30)).toBe(true);
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
