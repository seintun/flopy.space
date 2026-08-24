import { CHARACTERS } from "./characters";
import { SKINS } from "./storage";
import { BIOMES } from "./biomes";

export interface NextGoal {
  name: string;
  emoji: string;
  category: "Hero" | "Skin" | "World" | "Master Tier";
  targetScore: number;
  currentScore: number;
  needed: number;
  progressPct: number;
  description: string;
}

export function getNextGoal(
  tokens: number,
  unlocked?: {
    unlockedChars?: string[];
    unlocked?: string[];
    unlockedBiomes?: string[];
  },
): NextGoal {
  const candidates: Array<{
    name: string;
    emoji: string;
    category: "Hero" | "Skin" | "World" | "Master Tier";
    targetScore: number;
  }> = [];

  const unChars = unlocked?.unlockedChars || ["bird"];
  const unSkins = unlocked?.unlocked || ["classic"];
  const unBiomes = unlocked?.unlockedBiomes || ["meadow"];

  // 1. Characters
  Object.values(CHARACTERS).forEach((c) => {
    if (c.unlockValue > 0 && !unChars.includes(c.id)) {
      candidates.push({
        name: c.name,
        emoji: c.emoji,
        category: "Hero",
        targetScore: c.unlockValue,
      });
    }
  });

  // 2. Skins
  Object.values(SKINS).forEach((s) => {
    if (s.unlockScore > 0 && !unSkins.includes(s.id)) {
      candidates.push({
        name: s.name,
        emoji: "🎨",
        category: "Skin",
        targetScore: s.unlockScore,
      });
    }
  });

  // 3. Biomes
  Object.values(BIOMES).forEach((b) => {
    if (b.unlockScore > 0 && !unBiomes.includes(b.id)) {
      candidates.push({
        name: b.name,
        emoji: b.emoji,
        category: "World",
        targetScore: b.unlockScore,
      });
    }
  });

  // 4. Master Prestige Tiers (if all items owned)
  if (candidates.length === 0) {
    const masterTiers = [
      { name: "Diamond Aviator", emoji: "💎", targetScore: 1000 },
      { name: "Galactic Ace", emoji: "⚡", targetScore: 1500 },
      { name: "Cosmic Legend", emoji: "🌌", targetScore: 2500 },
      { name: "Eternal Grandmaster", emoji: "👑", targetScore: 5000 },
    ];
    masterTiers.forEach((tier) => {
      if (tier.targetScore > tokens) {
        candidates.push({
          name: tier.name,
          emoji: tier.emoji,
          category: "Master Tier",
          targetScore: tier.targetScore,
        });
      }
    });
  }

  // Sort by lowest price first
  candidates.sort((a, b) => a.targetScore - b.targetScore);

  const next = candidates[0] || {
    name: "Transcendent Flyer",
    emoji: "👑",
    category: "Master Tier" as const,
    targetScore: Math.ceil((tokens + 500) / 500) * 500,
  };

  const needed = Math.max(0, next.targetScore - tokens);
  const progressPct = Math.min(100, Math.max(0, Math.round((tokens / next.targetScore) * 100)));

  return {
    name: next.name,
    emoji: next.emoji,
    category: next.category,
    targetScore: next.targetScore,
    currentScore: tokens,
    needed,
    progressPct,
    description: `${next.emoji} ${next.name} (${next.category}) • ${needed} 🪙 away`,
  };
}
