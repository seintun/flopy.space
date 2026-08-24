import { describe, it, expect } from "vitest";
import { BIOMES, getBiomeForScore } from "./biomes";

describe("biomes", () => {
  it("defines 4 distinct environments", () => {
    expect(Object.keys(BIOMES)).toEqual(["meadow", "cyber", "candy", "magma"]);
  });

  it("transitions biomes dynamically every 20 score points without consecutive repeats", () => {
    let prevId = getBiomeForScore(0).id;
    expect(prevId).toBe("meadow");

    for (let score = 20; score <= 300; score += 20) {
      const current = getBiomeForScore(score);
      expect(current.id).not.toBe(prevId); // strictly never repeats consecutive biome
      prevId = current.id;
    }
  });

  it("honors manual biome override when selected", () => {
    expect(getBiomeForScore(0, "magma").id).toBe("magma");
    expect(getBiomeForScore(50, "cyber").id).toBe("cyber");
    expect(getBiomeForScore(50, "auto").id).toBeDefined();
  });
});
