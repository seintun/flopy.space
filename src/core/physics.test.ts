import { describe, it, expect } from "vitest";
import { flap, stepBird } from "./physics";
import { createWorld } from "./types";
import {
  FLAP_VELOCITY, GRAVITY, TERMINAL_VY, DT, CEILING_Y, HITBOX_RADIUS,
} from "./constants";

describe("stepBird", () => {
  it("matches analytic arc after a flap within tolerance", () => {
    const w = createWorld(1);
    flap(w);
    const t = 0.5;
    const steps = Math.round(t / DT);
    for (let i = 0; i < steps; i++) stepBird(w, DT);
    const expected = 1.5 + FLAP_VELOCITY * t + 0.5 * GRAVITY * t * t;
    expect(Math.abs(w.bird.y - expected)).toBeLessThan(0.05);
  });

  it("clamps fall speed at terminal velocity", () => {
    const w = createWorld(1);
    w.bird.vy = -30;
    stepBird(w, DT);
    expect(w.bird.vy).toBeGreaterThanOrEqual(TERMINAL_VY);
  });

  it("clamps position at ceiling without dying", () => {
    const w = createWorld(1);
    w.bird.y = CEILING_Y + 10;
    stepBird(w, DT);
    expect(w.bird.alive).toBe(true);
    expect(w.bird.y).toBeLessThanOrEqual(CEILING_Y - HITBOX_RADIUS);
  });

  it("eases pitch toward dive angle while falling", () => {
    const w = createWorld(1);
    w.bird.vy = TERMINAL_VY;
    for (let i = 0; i < 240; i++) stepBird(w, DT);
    expect(w.bird.pitch).toBeLessThan(-80);
  });
});
