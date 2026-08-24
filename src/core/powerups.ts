import { worldRand } from "./rand";
import type { World } from "./types";

export type PowerUpType = "slowmo" | "rainbow_trail" | "shield" | "magnet" | "star_gem";

export interface PowerUpDef {
  type: PowerUpType;
  name: string;
  emoji: string;
  description: string;
  duration: number; // in seconds, 0 if instant
  color: number;
  weight: number; // relative spawn weight
}

export const POWERUPS: Record<PowerUpType, PowerUpDef> = {
  rainbow_trail: {
    type: "rainbow_trail",
    name: "Rainbow Prism",
    emoji: "🌈",
    description: "Leaves glowing trajectory ribbon + forward arc guide + 3x points!",
    duration: 7.0,
    color: 0xff007f,
    weight: 25,
  },
  shield: {
    type: "shield",
    name: "Star Shield",
    emoji: "🛡️",
    description: "Protective energy bubble that absorbs 1 fatal crash!",
    duration: 0, // lasts until hit
    color: 0xffd700,
    weight: 20,
  },
  magnet: {
    type: "magnet",
    name: "Super Magnet",
    emoji: "🧲",
    description: "Gravitational vacuum pulls all nearby power-ups & orbs!",
    duration: 6.0,
    color: 0x00f5d4,
    weight: 20,
  },
  slowmo: {
    type: "slowmo",
    name: "Chrono Clock",
    emoji: "⏱️",
    description: "Slows time to 0.35x for precision flight!",
    duration: 3.0,
    color: 0x00e5ff,
    weight: 20,
  },
  star_gem: {
    type: "star_gem",
    name: "Star Gem",
    emoji: "⭐",
    description: "Awards +500 bonus score and boosts combo!",
    duration: 0, // instant
    color: 0xffbe0b,
    weight: 15,
  },
};

const TOTAL_WEIGHT = Object.values(POWERUPS).reduce((sum, p) => sum + p.weight, 0);

export function pickRandomPowerUp(w: World): PowerUpType {
  const r = worldRand(w) * TOTAL_WEIGHT;
  let accumulated = 0;
  for (const p of Object.values(POWERUPS)) {
    accumulated += p.weight;
    if (r <= accumulated) {
      return p.type;
    }
  }
  return "rainbow_trail";
}
