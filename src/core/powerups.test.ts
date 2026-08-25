import { describe, it, expect } from "vitest";
import {
  POWERUPS,
  pickRandomPowerUp,
  isHazardType,
  isBuffType,
  getEffectiveHitboxRadius,
  getEffectiveVisualScale,
} from "./powerups";
import { createWorld } from "./types";
import {
  HITBOX_RADIUS,
  CHIBI_HITBOX_MULT,
  CHUBBY_HITBOX_MULT,
  CHIBI_VISUAL_SCALE,
  CHUBBY_VISUAL_SCALE,
} from "./constants";

describe("powerups", () => {
  it("defines 10 distinct power-up and hazard types with weights and categories", () => {
    const list = Object.values(POWERUPS);
    expect(list.length).toBe(10);
    const types = list.map((p) => p.type);
    expect(new Set(types).size).toBe(10);
    expect(POWERUPS.chibi.category).toBe("buff");
    expect(POWERUPS.chubby.category).toBe("wager");
    expect(POWERUPS.rainbow_trail.duration).toBe(7.0);
    expect(POWERUPS.magnet.duration).toBe(6.0);
    expect(POWERUPS.hazard_mine.category).toBe("hazard");
    expect(POWERUPS.heavy_gravity.category).toBe("hazard");
    expect(POWERUPS.speed_surge.category).toBe("wager");
  });

  it("identifies hazard and buff types correctly", () => {
    expect(isHazardType("hazard_mine")).toBe(true);
    expect(isHazardType("heavy_gravity")).toBe(true);
    expect(isHazardType("speed_surge")).toBe(true);
    expect(isHazardType("chubby")).toBe(true); // wager
    expect(isHazardType("slowmo")).toBe(false);
    expect(isBuffType("slowmo")).toBe(true);
    expect(isBuffType("shield")).toBe(true);
    expect(isBuffType("chibi")).toBe(true);
    expect(isBuffType("hazard_mine")).toBe(false);
  });

  it("calculates effective hitbox radius and visual scale based on active timers", () => {
    const w = createWorld(1);
    expect(getEffectiveHitboxRadius(w)).toBeCloseTo(HITBOX_RADIUS);
    expect(getEffectiveVisualScale(w)).toBe(1.0);

    w.chibiTimer = 3.0;
    expect(getEffectiveHitboxRadius(w)).toBeCloseTo(HITBOX_RADIUS * CHIBI_HITBOX_MULT);
    expect(getEffectiveVisualScale(w)).toBe(CHIBI_VISUAL_SCALE);

    w.chibiTimer = 0;
    w.chubbyTimer = 4.0;
    expect(getEffectiveHitboxRadius(w)).toBeCloseTo(HITBOX_RADIUS * CHUBBY_HITBOX_MULT);
    expect(getEffectiveVisualScale(w)).toBe(CHUBBY_VISUAL_SCALE);
  });

  it("randomly picks valid power-up types deterministically", () => {
    const w1 = createWorld(12345);
    const w2 = createWorld(12345);

    const p1 = pickRandomPowerUp(w1);
    const p2 = pickRandomPowerUp(w2);
    expect(p1).toBe(p2);
    expect(POWERUPS[p1]).toBeDefined();
  });
});
