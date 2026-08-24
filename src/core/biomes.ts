export type BiomeId = "meadow" | "cyber" | "candy" | "magma";

export interface BiomeDef {
  id: BiomeId;
  name: string;
  emoji: string;
  tagline: string;
  unlockScore: number;
  groundColor: number;
  gridColor: number;
  pipeColor: number;
  pipeLipColor: number;
  pipeEmissive: number;
  particleColor: number;
  ambientColor: number;
  fogColor: number;
  skyTop: number;
  skyBottom: number;
}

export const BIOMES: Record<BiomeId, BiomeDef> = {
  meadow: {
    id: "meadow",
    name: "Emerald Meadow",
    emoji: "🌿",
    tagline: "Lush grassy hills & sunny skies",
    unlockScore: 0,
    groundColor: 0x4d7c2b,
    gridColor: 0x5a8f3b,
    pipeColor: 0x388e3c,
    pipeLipColor: 0x43a047,
    pipeEmissive: 0x66ff66,
    particleColor: 0xffd700,
    ambientColor: 0xffffff,
    fogColor: 0xd9a06b,
    skyTop: 0x2c3e6b,
    skyBottom: 0xffb347,
  },
  cyber: {
    id: "cyber",
    name: "Neon Cyberpunk",
    emoji: "🌆",
    tagline: "Glowing laser grid & synthwave skyline",
    unlockScore: 25,
    groundColor: 0x0f0c29,
    gridColor: 0x7209b7,
    pipeColor: 0x240046,
    pipeLipColor: 0x4cc9f0,
    pipeEmissive: 0x00f5d4,
    particleColor: 0xf72585,
    ambientColor: 0x90e0ef,
    fogColor: 0x3c096c,
    skyTop: 0x03071e,
    skyBottom: 0x7209b7,
  },
  candy: {
    id: "candy",
    name: "Candy Kingdom",
    emoji: "🍭",
    tagline: "Pastel sugar plains & peppermint pillars",
    unlockScore: 50,
    groundColor: 0xffcbf2,
    gridColor: 0xf72585,
    pipeColor: 0xff4d6d,
    pipeLipColor: 0xffffff,
    pipeEmissive: 0xff85a1,
    particleColor: 0xff99c8,
    ambientColor: 0xffe5ec,
    fogColor: 0xfbb1bd,
    skyTop: 0x70d6ff,
    skyBottom: 0xff70a6,
  },
  magma: {
    id: "magma",
    name: "Volcanic Rift",
    emoji: "🌋",
    tagline: "Obsidian crust & glowing basalt pillars",
    unlockScore: 75,
    groundColor: 0x1f0c08,
    gridColor: 0xd00000,
    pipeColor: 0x370617,
    pipeLipColor: 0xffba08,
    pipeEmissive: 0xff5400,
    particleColor: 0xffaa00,
    ambientColor: 0xff7b00,
    fogColor: 0x6a040f,
    skyTop: 0x03071e,
    skyBottom: 0xd00000,
  },
};

export const BIOME_ORDER: BiomeId[] = ["meadow", "cyber", "candy", "magma"];

export function getBiomeForScore(score: number, overrideBiome?: BiomeId | "auto"): BiomeDef {
  if (overrideBiome && overrideBiome !== "auto" && BIOMES[overrideBiome]) {
    return BIOMES[overrideBiome]!;
  }
  const cycleIndex = Math.floor(Math.max(0, score) / 20) % BIOME_ORDER.length;
  const biomeId = BIOME_ORDER[cycleIndex] || "meadow";
  return BIOMES[biomeId] || BIOMES.meadow!;
}
