import { describe, it, expect } from "vitest";
import { POWERUPS, pickRandomPowerUp, isHazardType, isBuffType } from "./powerups";
import { createWorld } from "./types";

describe("powerups", () => {
  it("defines 8 distinct power-up and hazard types with weights and categories", () => {
    const list = Object.values(POWERUPS);
    expect(list.length).toBe(8);
    const types = list.map((p) => p.type);
    expect(new Set(types).size).toBe(8);
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
    expect(isHazardType("slowmo")).toBe(false);
    expect(isBuffType("slowmo")).toBe(true);
    expect(isBuffType("shield")).toBe(true);
    expect(isBuffType("hazard_mine")).toBe(false);
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
