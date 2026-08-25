import { describe, it, expect } from "vitest";
import { getNextGoal } from "./goals";

describe("Goals & Progression Engine", () => {
  it("returns closest unlock for tokens 0 (Neko at 40 🪙)", () => {
    const g = getNextGoal(0);
    expect(g.targetScore).toBe(40);
    expect(g.needed).toBe(40);
    expect(g.name).toBe("Flappy Neko");
  });

  it("calculates progress for intermediate tokens (tokens 10 -> 40)", () => {
    const g = getNextGoal(10);
    expect(g.targetScore).toBe(40);
    expect(g.needed).toBe(30);
    expect(g.progressPct).toBe(25);
  });

  it("advances to next target when Neko is unlocked (Sakura Blossom at 85 🪙)", () => {
    const g = getNextGoal(20, { unlockedChars: ["bird", "neko"] });
    expect(g.targetScore).toBe(85); // Sakura Blossom
    expect(g.name).toBe("Sakura Blossom");
    expect(g.needed).toBe(65);
  });

  it("provides master prestige tiers when all catalog items are owned", () => {
    const allChars = ["bird", "neko", "doge", "hamster", "dragon"];
    const allSkins = ["classic", "sunrise", "ember", "void", "prism"];
    const allBiomes = ["meadow", "cyber", "candy", "magma"];

    const g = getNextGoal(120, { unlockedChars: allChars, unlocked: allSkins, unlockedBiomes: allBiomes });
    expect(g.category).toBe("Master Tier");
    expect(g.targetScore).toBe(2000);
  });
});
