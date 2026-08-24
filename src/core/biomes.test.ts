import { describe, it, expect } from "vitest";
import { BIOMES, getBiomeForScore, isBiomeClaimable, isBiomeUnlocked } from "./biomes";

describe("biomes", () => {
  it("defines 4 distinct environments", () => {
    expect(Object.keys(BIOMES)).toEqual(["meadow", "cyber", "candy", "magma"]);
  });

  it("transitions biomes dynamically every 15 pipes without consecutive repeats", () => {
    let prevId = getBiomeForScore(0).id;
    expect(prevId).toBe("meadow");

    for (let pipes = 15; pipes <= 300; pipes += 15) {
      const current = getBiomeForScore(pipes);
      expect(current.id).not.toBe(prevId); // strictly never repeats consecutive biome
      prevId = current.id;
    }
  });

  it("honors manual biome override when selected", () => {
    expect(getBiomeForScore(0, "magma").id).toBe("magma");
    expect(getBiomeForScore(50, "cyber").id).toBe("cyber");
    expect(getBiomeForScore(50, "auto").id).toBeDefined();
  });

  it("verifies interleaved token claimability for scenes", () => {
    expect(isBiomeClaimable("cyber", 74, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("cyber", 75, ["meadow"])).toBe(true);
    expect(isBiomeUnlocked("cyber", ["meadow"])).toBe(false);
    expect(isBiomeUnlocked("cyber", ["meadow", "cyber"])).toBe(true);

    expect(isBiomeClaimable("candy", 219, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("candy", 220, ["meadow"])).toBe(true);

    expect(isBiomeClaimable("magma", 519, ["meadow"])).toBe(false);
    expect(isBiomeClaimable("magma", 520, ["meadow"])).toBe(true);
  });
});
