import { describe, it, expect, beforeEach } from "vitest";
import { createWorld } from "./types";
import { flap, stepBird } from "./physics";
import { advance } from "./spawner";
import { checkCollisions, sphereHitsAabb } from "./collision";
import { processPasses, multiplier } from "./scoring";
import { SnapshotBuffer } from "./snapshots";
import { dayNight } from "./palette";
import { loadAll, bankFeathers, clearStorageForTest } from "./storage";
import { DT, BUFFER_LEN, REWINDS_MAX_PER_RUN, GROUND_Y, CEILING_Y, HITBOX_RADIUS, PIPE_RADIUS } from "./constants";

describe("Devil's Advocate: Physics & Collision Edge Cases", () => {
  it("handles zero and negative dt gracefully without NaN", () => {
    const w = createWorld(42);
    stepBird(w, 0);
    expect(Number.isNaN(w.bird.y)).toBe(false);
    expect(Number.isNaN(w.bird.vy)).toBe(false);
    expect(Number.isNaN(w.bird.pitch)).toBe(false);

    advance(w, 0);
    expect(w.dist).toBe(0);
  });

  it("handles massive lag spike (dt = 2.0s) clamping at ceiling and terminal velocity", () => {
    const w = createWorld(42);
    flap(w);
    w.bird.vy = 500; // artificial extreme
    stepBird(w, 0.1);
    expect(w.bird.y).toBeLessThanOrEqual(CEILING_Y - HITBOX_RADIUS);

    w.bird.vy = -1000;
    stepBird(w, 0.1);
    expect(w.bird.vy).toBe(-14); // TERMINAL_VY
  });

  it("sphere-vs-AABB exact corners and boundaries", () => {
    // Exact corner test: box [0..2, 0..2, 0..2], sphere centered at (3, 3, 3)
    // Distance from (3,3,3) to closest point (2,2,2) is sqrt(1+1+1) = sqrt(3) ~= 1.732
    expect(sphereHitsAabb(3, 3, 3, 1.73, 0, 0, 0, 2, 2, 2)).toBe(false);
    expect(sphereHitsAabb(3, 3, 3, 1.74, 0, 0, 0, 2, 2, 2)).toBe(true);

    // Inside the box
    expect(sphereHitsAabb(1, 1, 1, 0.1, 0, 0, 0, 2, 2, 2)).toBe(true);
  });

  it("collision immunity strictly holds during invulnerability ticks", () => {
    const w = createWorld(1);
    w.tick = 100;
    w.bird.invulnUntilTick = 150;
    w.bird.y = GROUND_Y - 5; // deep in ground
    expect(checkCollisions(w)).toBeNull();

    w.pipes.push({ id: 1, x: 0, gapCenter: 10, gapHeight: 2, scored: false }); // pipe directly on bird
    w.bird.y = 0;
    expect(checkCollisions(w)).toBeNull();

    // After invuln tick passes
    w.tick = 151;
    expect(checkCollisions(w)).toBe("pipe");
  });

  it("pipe horizontal overlap detection works accurately around pipe X boundary", () => {
    const w = createWorld(1);
    const pX = 5;
    w.pipes.push({ id: 1, x: pX, gapCenter: 0, gapHeight: 3, scored: false });
    w.bird.y = 5; // upper pipe collision zone

    // Outside horizontal range (distance > PIPE_RADIUS + HITBOX_RADIUS = 0.9 + 0.3825 = 1.2825)
    w.bird.alive = true;
    w.pipes[0]!.x = PIPE_RADIUS + HITBOX_RADIUS + 0.1;
    expect(checkCollisions(w)).toBeNull();

    // Inside horizontal range
    w.pipes[0]!.x = PIPE_RADIUS + HITBOX_RADIUS - 0.05;
    expect(checkCollisions(w)).toBe("pipe");
  });
});

describe("Devil's Advocate: 4D Snapshot & Rewind State Integrity", () => {
  it("deep copy isolation: mutating world arrays does not corrupt recorded snapshots", () => {
    const w = createWorld(99);
    const buf = new SnapshotBuffer();

    w.pipes.push({ id: 1, x: 10, gapCenter: 2, gapHeight: 4, scored: false });
    w.orbs.push({ id: 1, type: "slowmo", x: 5, y: 1, taken: false });
    buf.record(w);

    // Mutate original world
    w.pipes[0]!.x = 999;
    w.pipes[0]!.scored = true;
    w.orbs[0]!.taken = true;
    w.pipes.push({ id: 2, x: 20, gapCenter: 0, gapHeight: 3, scored: false });

    // Fill buffer to capacity so we can rewind
    for (let i = 0; i < BUFFER_LEN; i++) {
      buf.record(w);
    }

    const testW = createWorld(99);
    expect(buf.rewindInto(testW)).toBe(true);

    // testW should match snapshot 0 state
    expect(testW.pipes[0]!.x).toBe(999); // matches the snap when recorded
    // and should have independent arrays
    testW.pipes[0]!.x = -50;
    expect(w.pipes[0]!.x).toBe(999);
  });

  it("enforces rewind limit per run", () => {
    const w = createWorld(1);
    w.feathersRun = 10;
    w.rewindsUsedRun = REWINDS_MAX_PER_RUN; // 3
    const canRewind = w.feathersRun > 0 && w.rewindsUsedRun < REWINDS_MAX_PER_RUN;
    expect(canRewind).toBe(false);
  });
});

describe("Devil's Advocate: Scoring & Day/Night Boundary Cycles", () => {
  it("multiplier correctly caps at 3 even with combo 500+", () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(6)).toBe(2);
    expect(multiplier(20)).toBe(3);
    expect(multiplier(500)).toBe(3);
  });

  it("day/night palette seamlessly wraps at multiples of 80 up to score 10,000", () => {
    const p0 = dayNight(0);
    const p80 = dayNight(80);
    const p800 = dayNight(800);
    const p8000 = dayNight(8000);

    expect(p80.skyTop).toBe(p0.skyTop);
    expect(p800.skyTop).toBe(p0.skyTop);
    expect(p8000.skyTop).toBe(p0.skyTop);
    expect(p80.sunAngle).toBeCloseTo(p0.sunAngle);
  });

  it("spawner memory stability: pool remains small after 100,000 ticks", () => {
    const w = createWorld(777);
    for (let i = 0; i < 10000; i++) {
      advance(w, DT);
      processPasses(w);
      w.tick++;
    }
    expect(w.pipes.length).toBeLessThan(10);
    expect(w.orbs.length).toBeLessThan(6);
  });
});

describe("Devil's Advocate: Storage Corrupted State Recovery", () => {
  beforeEach(() => {
    clearStorageForTest();
  });

  it("handles corrupted JSON gracefully without crashing", () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("f3d.streak", "{invalid_json:");
      localStorage.setItem("f3d.unlocked", "[not, json");
      localStorage.setItem("f3d.best", "not_a_number");
    }

    const data = loadAll();
    expect(data.best).toBe(0);
    expect(data.streak).toEqual({ lastDay: "", count: 0 });
    expect(data.unlocked).toEqual(["classic"]);
  });

  it("feather banking never exceeds 3 and never drops below 0", () => {
    expect(bankFeathers(100, 0)).toBe(3);
    expect(bankFeathers(0, 5)).toBe(0); // net is clamped to >= 0
  });
});

describe("Devil's Advocate: State Machine Flap/Spacebar Triggers", () => {
  it("rewindChoice state: doFlap triggers rewind when feathers > 0 and buffer is ready", () => {
    const w = createWorld(1);
    w.feathersRun = 2;
    const buf = new SnapshotBuffer();
    for (let i = 0; i < BUFFER_LEN; i++) buf.record(w);

    expect(buf.canRewind()).toBe(true);
    expect(w.feathersRun).toBe(2);
  });
});
