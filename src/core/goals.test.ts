import { describe, it, expect } from "vitest";
import { getNextGoal } from "./goals";

describe("Goals & Progression Engine", () => {
  it("returns closest unlock for score 0 (Neko / Sakura at score 15)", () => {
    const g = getNextGoal(0);
    expect(g.targetScore).toBe(15);
    expect(g.needed).toBe(15);
    expect(g.progressPct).toBe(5); // minimum visibility floor
  });

  it("calculates progress for intermediate score (score 10 -> 15)", () => {
    const g = getNextGoal(10);
    expect(g.targetScore).toBe(15);
    expect(g.needed).toBe(5);
    expect(g.progressPct).toBe(67);
  });

  it("advances to next target when 15 is beaten (Score 20 -> 25 Cyberpunk)", () => {
    const g = getNextGoal(20);
    expect(g.targetScore).toBe(25); // Cyberpunk at 25
    expect(g.needed).toBe(5);
  });

  it("always provides master tiers even when all content unlocked (> 100)", () => {
    const g1 = getNextGoal(110);
    expect(g1.targetScore).toBe(150);
    expect(g1.category).toBe("Master Tier");

    const g2 = getNextGoal(600);
    expect(g2.targetScore).toBe(650);
    expect(g2.needed).toBe(50);
  });
});
