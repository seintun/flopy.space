import { describe, it, expect } from "vitest";
import { BIOMES, getBiomeForScore, isBiomeClaimable, isBiomeUnlocked } from "./biomes";

describe("biomes", () => {
  it("defines 4 distinct environments", () => {
    expect(Object.keys(BIOMES)).toEqual(["meadow", "cyber", "candy", "magma"]);
  });

  it("stays strictly on meadow when only starter scene is unlocked", () => {
    for (let pipes = 0; pipes <= 100; pipes += 15) {
      const current = getBiomeForScore(pipes, "auto", 0, ["meadow"]);
      expect(current.id).toBe("meadow");
    }
  });

  it("rotates dynamically only through unlocked scenes without consecutive repeats", () => {
    const allUnlocked = ["meadow", "cyber", "candy", "magma"];
    let prevId = getBiomeForScore(0, "auto", 0, allUnlocked).id;
    expect(prevId).toBe("meadow");

    for (let pipes = 15; pipes <= 300; pipes += 15) {
      const current = getBiomeForScore(pipes, "auto", 0, allUnlocked);
      expect(current.id).not.toBe(prevId); // strictly never repeats consecutive biome
      expect(allUnlocked).toContain(current.id);
      prevId = current.id;
    }

    // Partial unlocked subset (meadow + cyber)
    const partialUnlocked = ["meadow", "cyber"];
    let prevPartialId = getBiomeForScore(0, "auto", 0, partialUnlocked).id;
    for (let pipes = 15; pipes <= 60; pipes += 15) {
      const current = getBiomeForScore(pipes, "auto", 0, partialUnlocked);
      expect(partialUnlocked).toContain(current.id);
      expect(current.id).not.toBe(prevPartialId);
      prevPartialId = current.id;
    }
  });

  it("honors manual biome override when selected", () => {
    expect(getBiomeForScore(0, "magma").id).toBe("magma");
    expect(getBiomeForScore(50, "cyber").id).toBe("cyber");
    expect(getBiomeForScore(50, "auto").id).toBeDefined();
  });

  it("verifies interleaved token claimability for scenes", () => {
    expect(isBiomeClaimable("cyber", 139, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("cyber", 140, ["meadow"])).toBe(true);
    expect(isBiomeUnlocked("cyber", ["meadow"])).toBe(false);
    expect(isBiomeUnlocked("cyber", ["meadow", "cyber"])).toBe(true);

    expect(isBiomeClaimable("candy", 419, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("candy", 420, ["meadow"])).toBe(true);

    expect(isBiomeClaimable("magma", 959, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("magma", 960, ["meadow"])).toBe(true);
  });
});
