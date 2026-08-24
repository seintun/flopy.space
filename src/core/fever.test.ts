import { describe, it, expect } from "vitest";
import { FeverSystem } from "./fever";

describe("FeverSystem", () => {
  it("accumulates energy and triggers fever mode at 100%", () => {
    const f = new FeverSystem();
    expect(f.isActive).toBe(false);
    expect(f.scoreMultiplier).toBe(1);

    expect(f.addEnergy(0.5)).toBe(false);
    expect(f.meter).toBeCloseTo(0.5);

    expect(f.addEnergy(0.6)).toBe(true); // triggers!
    expect(f.isActive).toBe(true);
    expect(f.scoreMultiplier).toBe(2);
    expect(f.durationLeft).toBe(5.0);
  });

  it("decays duration and ends after 5s", () => {
    const f = new FeverSystem();
    f.trigger();
    expect(f.update(2.5).ended).toBe(false);
    expect(f.durationLeft).toBeCloseTo(2.5);
    expect(f.meter).toBeCloseTo(0.5);

    expect(f.update(2.6).ended).toBe(true);
    expect(f.isActive).toBe(false);
    expect(f.scoreMultiplier).toBe(1);
  });
});
