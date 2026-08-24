import { describe, it, expect } from "vitest";
import { dayNight } from "./palette";

describe("dayNight", () => {
  it("score 0 matches dawn stop", () => {
    const p = dayNight(0);
    expect(p.skyTop).toBe(0x2c3e6b);
    expect(p.skyBottom).toBe(0xffb347);
    expect(p.fogColor).toBe(0xd9a06b);
    expect(p.sunAngle).toBeCloseTo(-0.4);
    expect(p.starAlpha).toBeCloseTo(0.25);
  });

  it("midpoint 10 is average of dawn and day", () => {
    const p = dayNight(10);
    // dawn 0x2c3e6b (44, 62, 107) and day 0x3aa0ff (58, 160, 255) -> (51, 111, 181) -> 0x336fb5
    const dawnTop = { r: 0x2c, g: 0x3e, b: 0x6b };
    const dayTop = { r: 0x3a, g: 0xa0, b: 0xff };
    const expR = Math.round((dawnTop.r + dayTop.r) / 2);
    const expG = Math.round((dawnTop.g + dayTop.g) / 2);
    const expB = Math.round((dawnTop.b + dayTop.b) / 2);
    const expHex = (expR << 16) | (expG << 8) | expB;
    expect(p.skyTop).toBe(expHex);
  });

  it("score 80 wraps to dawn exactly", () => {
    const p = dayNight(80);
    expect(p.skyTop).toBe(0x2c3e6b);
  });

  it("starAlpha peaks during night segment", () => {
    const night = dayNight(60);
    expect(night.starAlpha).toBeCloseTo(1);
    const dusk = dayNight(40);
    expect(dusk.starAlpha).toBeCloseTo(0.15);
  });
});
