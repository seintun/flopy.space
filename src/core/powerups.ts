import { worldRand } from "./rand";
import type { World } from "./types";

export type PowerUpType =
  | "slowmo"
  | "rainbow_trail"
  | "shield"
  | "magnet"
  | "star_gem"
  | "hazard_mine"
  | "heavy_gravity"
  | "speed_surge";

export type PowerUpCategory = "buff" | "hazard" | "wager";

export interface PowerUpDef {
  type: PowerUpType;
  name: string;
  emoji: string;
  description: string;
  category: PowerUpCategory;
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
    category: "buff",
    duration: 7.0,
    color: 0xff007f,
    weight: 20,
  },
  shield: {
    type: "shield",
    name: "Star Shield",
    emoji: "🛡️",
    description: "Protective energy bubble that absorbs 1 fatal crash!",
    category: "buff",
    duration: 0, // lasts until hit
    color: 0xffd700,
    weight: 16,
  },
  magnet: {
    type: "magnet",
    name: "Super Magnet",
    emoji: "🧲",
    description: "Gravitational vacuum pulls all nearby power-ups & orbs!",
    category: "buff",
    duration: 6.0,
    color: 0x00f5d4,
    weight: 16,
  },
  slowmo: {
    type: "slowmo",
    name: "Chrono Clock",
    emoji: "⏱️",
    description: "Slows time to 0.35x for precision flight!",
    category: "buff",
    duration: 3.0,
    color: 0x00e5ff,
    weight: 18,
  },
  star_gem: {
    type: "star_gem",
    name: "Star Gem",
    emoji: "⭐",
    description: "Awards +5 bonus score and boosts combo spree!",
    category: "buff",
    duration: 0, // instant
    color: 0xffbe0b,
    weight: 15,
  },
  hazard_mine: {
    type: "hazard_mine",
    name: "Void Mine",
    emoji: "💀",
    description: "DODGE! Contact shatters combo spree and loses -3 bonus score!",
    category: "hazard",
    duration: 0, // instant penalty on hit
    color: 0xff2a6d,
    weight: 12,
  },
  heavy_gravity: {
    type: "heavy_gravity",
    name: "Gravity Sink",
    emoji: "⚓",
    description: "DODGE! Increases downward gravity weight by +40% for 2.5s!",
    category: "hazard",
    duration: 2.5,
    color: 0x9d4edd,
    weight: 10,
  },
  speed_surge: {
    type: "speed_surge",
    name: "Speed Surge",
    emoji: "⚡",
    description: "WAGER! Surges speed to hyper tempo; passing pipes awards +3 bonus pts!",
    category: "wager",
    duration: 2.5,
    color: 0xff8800,
    weight: 8,
  },
};

const TOTAL_WEIGHT = Object.values(POWERUPS).reduce((sum, p) => sum + p.weight, 0);

export function isHazardType(type: PowerUpType): boolean {
  return POWERUPS[type]?.category === "hazard" || POWERUPS[type]?.category === "wager";
}

export function isBuffType(type: PowerUpType): boolean {
  return POWERUPS[type]?.category === "buff";
}

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
