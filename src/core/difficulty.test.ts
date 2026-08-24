import { describe, it, expect } from "vitest";
import { scrollForScore, gapForScore } from "./difficulty";
import { BASE_SCROLL, MAX_SCROLL, GAP_START, GAP_MIN, GAP_SHRINK_END_SCORE } from "./constants";

describe("scrollForScore", () => {
  it("starts at base and caps at max", () => {
    expect(scrollForScore(0)).toBe(BASE_SCROLL);
    expect(scrollForScore(1000)).toBe(MAX_SCROLL);
  });
  it("ramps monotonically", () => {
    for (let s = 1; s <= 60; s++) expect(scrollForScore(s)).toBeGreaterThanOrEqual(scrollForScore(s - 1));
  });
});

describe("gapForScore", () => {
  it("shrinks linearly from start to min by score 40 then holds", () => {
    expect(gapForScore(0)).toBe(GAP_START);
    expect(gapForScore(GAP_SHRINK_END_SCORE)).toBeCloseTo(GAP_MIN);
    expect(gapForScore(100)).toBe(GAP_MIN);
    expect(gapForScore(20)).toBeCloseTo((GAP_START + GAP_MIN) / 2);
  });
});
