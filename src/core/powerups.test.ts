import { describe, it, expect } from "vitest";
import { POWERUPS, pickRandomPowerUp } from "./powerups";
import { createWorld } from "./types";

describe("powerups", () => {
  it("defines 5 distinct power-up types with weights and durations", () => {
    const list = Object.values(POWERUPS);
    expect(list.length).toBe(5);
    const types = list.map((p) => p.type);
    expect(new Set(types).size).toBe(5);
    expect(POWERUPS.rainbow_trail.duration).toBe(7.0);
    expect(POWERUPS.magnet.duration).toBe(6.0);
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
