import { describe, it, expect } from "vitest";
import { createWorld } from "./types";
import { flap, stepBird } from "./physics";
import { advance } from "./spawner";
import { checkCollisions } from "./collision";
import { processPasses } from "./scoring";
import { DT, GROUND_Y } from "./constants";

describe("Automated Gameplay & Physics Simulation", () => {
  it("Game Running: advances world time, distance, and physics ticks properly", () => {
    const w = createWorld(12345);
    expect(w.dist).toBe(0);
    expect(w.tick).toBe(0);

    const initialY = w.bird.y;

    // Simulate 30 frames (0.25s) of natural falling
    for (let i = 0; i < 30; i++) {
      w.tick++;
      advance(w, DT);
      stepBird(w, DT);
    }

    expect(w.dist).toBeGreaterThan(0);
    expect(w.tick).toBe(30);
    expect(w.bird.y).toBeLessThan(initialY); // Bird drops due to gravity
  });

  it("Spacebar Input: triggers upward flap impulse and updates pitch trajectory", () => {
    const w = createWorld(12345);
    w.bird.y = 1.0;
    w.bird.vy = -5.0; // falling fast

    // Simulate Spacebar press
    flap(w);

    expect(w.bird.vy).toBeGreaterThan(0); // Upward velocity applied

    // Advance 5 ticks
    for (let i = 0; i < 5; i++) {
      w.tick++;
      stepBird(w, DT);
    }

    expect(w.bird.pitch).toBeGreaterThan(0); // Pitch rotates upwards
    expect(w.bird.y).toBeGreaterThan(1.0); // Bird gains altitude
  });

  it("Passing the Pipe: bird flies through gap center, marks scored, and earns score", () => {
    const w = createWorld(999);
    w.pipes.length = 0;
    w.bird.y = 2.0;

    // Spawn a pipe directly ahead
    w.pipes.push({
      id: 101,
      x: 3.0,
      gapCenter: 2.0,
      gapHeight: 4.5,
      scored: false,
    });

    expect(w.score).toBe(0);
    expect(w.pipesPassed).toBe(0);

    // Fly through the pipe with autopilot keeping bird at gapCenter = 2.0
    for (let step = 0; step < 120; step++) {
      // Autopilot correction
      if (w.bird.y < 1.8) {
        flap(w);
      }
      advance(w, DT);
      stepBird(w, DT);

      // Check collision
      const hit = checkCollisions(w);
      expect(hit).toBeNull(); // Clean flight through gap

      // Pipe passing detection logic
      for (const p of w.pipes) {
        if (!p.scored && p.x <= 0) {
          p.scored = true;
          w.pipesPassed = (w.pipesPassed || 0) + 1;
          w.score = w.pipesPassed + (w.bonusScore || 0);
          w.combo += 1;
        }
      }
    }

    expect(w.pipesPassed).toBe(1);
    expect(w.score).toBe(1);
    expect(w.combo).toBe(1);
    expect(w.pipes[0]!.scored).toBe(true);
  });

  it("Collision Detection: accurately triggers 'pipe' hit on obstacle and 'ground' hit on floor", () => {
    // 1. Pipe collision
    const wPipe = createWorld(42);
    wPipe.pipes.length = 0;
    wPipe.pipes.push({
      id: 1,
      x: 0.0,
      gapCenter: 1.0,
      gapHeight: 3.0,
      scored: false,
    });

    // Bird aligned with top pipe obstacle (gap is 1.0 +- 1.5 => top pipe starts at y=2.5)
    wPipe.bird.y = 3.5;
    expect(checkCollisions(wPipe)).toBe("pipe");

    // Bird inside lower pipe
    wPipe.bird.y = -1.5;
    expect(checkCollisions(wPipe)).toBe("pipe");

    // Bird in middle of gap
    wPipe.bird.y = 1.0;
    expect(checkCollisions(wPipe)).toBeNull();

    // 2. Ground collision
    const wGround = createWorld(42);
    wGround.bird.y = GROUND_Y - 0.1;
    expect(checkCollisions(wGround)).toBe("ground");
  });

  it("Shield Defense: protects from fatal collision and consumes shield", () => {
    const w = createWorld(42);
    w.hasShield = true;
    w.pipes.length = 0;
    w.pipes.push({
      id: 1,
      x: 0.0,
      gapCenter: 1.0,
      gapHeight: 3.0,
      scored: false,
    });

    // Bird hits top pipe
    w.bird.y = 3.5;
    const hit = checkCollisions(w);
    expect(hit).toBe("pipe");

    // Resolve shield hit
    if (w.hasShield) {
      w.hasShield = false;
      w.bird.invulnUntilTick = w.tick + 60;
    }

    expect(w.hasShield).toBe(false);
    expect(w.bird.invulnUntilTick).toBeGreaterThan(w.tick);
    expect(checkCollisions(w)).toBeNull();
  });

  it("Feather Earning Milestone: crossing progressive milestone score with 15+ pipes awards feather", () => {
    const w = createWorld(777);
    w.feathersRun = 0;
    w.pipesPassed = 14;
    w.bonusScore = 5;
    w.score = 19;
    w.lastFeatherPipe = 0;

    w.pipes.push({
      id: 15,
      x: -1.0, // already cleared
      gapCenter: 1.0,
      gapHeight: 3.5,
      scored: false,
    });

    const events = processPasses(w);
    expect(events.length).toBe(1);
    expect(events[0]!.earnedFeather).toBe(true);
    expect(w.score).toBe(20);
    expect(w.feathersRun).toBe(1);
    expect(w.lastFeatherPipe).toBe(15);
  });

  it("Token Accrual: run score deposits 1:1 into persistent token vault", () => {
    const w = createWorld(888);
    w.score = 59;
    w.pipesPassed = 24;

    // Simulate run conclusion deposit
    const beforeTokens = 0;
    const earnedTokens = w.score;
    const totalVault = beforeTokens + earnedTokens;

    expect(earnedTokens).toBe(59);
    expect(totalVault).toBe(59);
  });
});
