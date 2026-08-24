import { describe, it, expect } from "vitest";
import { TimeSystem } from "./time";
import { SLOWMO_SCALE, SLOWMO_HOLD_S } from "./constants";

describe("TimeSystem", () => {
  it("eases into slowmo then back to 1", () => {
    const t = new TimeSystem();
    t.triggerSlowmo();
    for (let i = 0; i < 60; i++) t.update(1 / 60); // 1s real
    expect(t.scale).toBeLessThan(0.5);
    expect(t.scale).toBeGreaterThan(SLOWMO_SCALE - 0.05);
    for (let i = 0; i < 240; i++) t.update(1 / 60); // hold expires, ease back
    expect(t.scale).toBeGreaterThan(0.98);
  });

  it("hitstop freezes exactly ms then unfreezes", () => {
    const t = new TimeSystem();
    t.hitstop(60);
    t.update(0.05);
    expect(t.frozen).toBe(true);
    t.update(0.02);
    expect(t.frozen).toBe(false);
  });

  it("slowmo hold lasts SLOWMO_HOLD_S real seconds", () => {
    const t = new TimeSystem();
    t.triggerSlowmo();
    t.update(0.1); // ease down first
    let elapsed = 0.1;
    while (elapsed < SLOWMO_HOLD_S + 2 && (t.scale < 0.95 || t.slowmoRemaining() > 0)) {
      t.update(1 / 120);
      elapsed += 1 / 120;
    }
    expect(elapsed).toBeGreaterThanOrEqual(SLOWMO_HOLD_S - 0.05);
  });
});
