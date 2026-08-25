import { describe, it, expect } from "vitest";
import { sphereHitsAabb, checkCollisions } from "./collision";
import { createWorld } from "./types";
import { HITBOX_RADIUS, GROUND_Y } from "./constants";

describe("sphereHitsAabb", () => {
  it("detects overlap and rejects edge-touch", () => {
    // sphere center (0,0,0) radius 1. Box from x=1..3 -> dist=1 == radius -> strict < is false (edge-touch)
    expect(sphereHitsAabb(0, 0, 0, 1, 1, -1, -1, 3, 1, 1)).toBe(false);
    // Overlapping box x=0.5..2
    expect(sphereHitsAabb(0, 0, 0, 1, 0.5, -1, -1, 2, 1, 1)).toBe(true);
  });
});

describe("checkCollisions", () => {
  it("ground kill", () => {
    const w = createWorld(1);
    w.bird.y = GROUND_Y + 0.1;
    expect(checkCollisions(w)).toBe("ground");
  });
  it("pipe body kill but gap center clear", () => {
    const w = createWorld(1);
    w.pipes.push({ id: 1, x: 0, gapCenter: 1, gapHeight: 4.5, scored: false });
    w.bird.y = 1; // center of gap
    expect(checkCollisions(w)).toBeNull();
    w.bird.y = 1 + 4.5 / 2 + HITBOX_RADIUS * 0.9; // just inside top pipe zone
    expect(checkCollisions(w)).toBe("pipe");
  });
  it("invulnerable ticks skip collision", () => {
    const w = createWorld(1);
    w.tick = 10;
    w.bird.invulnUntilTick = 50;
    w.bird.y = GROUND_Y;
    expect(checkCollisions(w)).toBeNull();
  });
  it("chibi allows passing closer to pipe lip without dying", () => {
    const w = createWorld(1);
    w.pipes.push({ id: 1, x: 0, gapCenter: 0, gapHeight: 4.0, scored: false });
    // Top lip is at y = 2.0. Normal bird at y = 1.75 collides: 2.0 - 1.75 = 0.25 < 0.3825
    w.bird.y = 1.75;
    expect(checkCollisions(w)).toBe("pipe");

    // With chibiTimer active, hitbox radius is ~0.210 (< 0.25 margin) -> passes safely!
    w.chibiTimer = 3.0;
    expect(checkCollisions(w)).toBeNull();
  });
  it("chubby enforces tighter gap tolerance", () => {
    const w = createWorld(1);
    w.pipes.push({ id: 1, x: 0, gapCenter: 0, gapHeight: 4.0, scored: false });
    // Top lip at y = 2.0. Normal bird at y = 1.55 is safe: 2.0 - 1.55 = 0.45 > 0.3825
    w.bird.y = 1.55;
    expect(checkCollisions(w)).toBeNull();

    // With chubbyTimer active, hitbox radius is ~0.516 (> 0.45 margin) -> hits pipe
    w.chubbyTimer = 3.0;
    expect(checkCollisions(w)).toBe("pipe");

    // But exactly at gap center (y = 0), chubby passes safely through 4.0 gap
    w.bird.y = 0;
    expect(checkCollisions(w)).toBeNull();
  });
});
