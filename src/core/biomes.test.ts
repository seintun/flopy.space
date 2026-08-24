import { describe, it, expect } from "vitest";
import { BIOMES, getBiomeForScore } from "./biomes";

describe("biomes", () => {
  it("defines 4 distinct environments", () => {
    expect(Object.keys(BIOMES)).toEqual(["meadow", "cyber", "candy", "magma"]);
  });

  it("cycles biomes dynamically every 20 score points in auto mode", () => {
    expect(getBiomeForScore(0).id).toBe("meadow");
    expect(getBiomeForScore(19).id).toBe("meadow");
    expect(getBiomeForScore(20).id).toBe("cyber");
    expect(getBiomeForScore(39).id).toBe("cyber");
    expect(getBiomeForScore(40).id).toBe("candy");
    expect(getBiomeForScore(60).id).toBe("magma");
    expect(getBiomeForScore(80).id).toBe("meadow"); // wraps
  });

  it("honors manual biome override when selected", () => {
    expect(getBiomeForScore(0, "magma").id).toBe("magma");
    expect(getBiomeForScore(50, "cyber").id).toBe("cyber");
    expect(getBiomeForScore(50, "auto").id).toBe("candy");
  });
});
