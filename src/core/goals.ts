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

export function getNextGoal(bestScore: number): NextGoal {
  const candidates: Array<{
    name: string;
    emoji: string;
    category: "Hero" | "Skin" | "World" | "Master Tier";
    targetScore: number;
  }> = [];

  // 1. Characters
  Object.values(CHARACTERS).forEach((c) => {
    if (c.unlockType === "score" && c.unlockValue > bestScore) {
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
    if (s.unlockScore > bestScore) {
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
    if (b.unlockScore > bestScore) {
      candidates.push({
        name: b.name,
        emoji: b.emoji,
        category: "World",
        targetScore: b.unlockScore,
      });
    }
  });

  // 4. Master Prestige Tiers
  const masterTiers = [
    { name: "Diamond Aviator", emoji: "💎", targetScore: 150 },
    { name: "Galactic Ace", emoji: "⚡", targetScore: 200 },
    { name: "Cosmic Legend", emoji: "🌌", targetScore: 300 },
    { name: "Eternal Grandmaster", emoji: "👑", targetScore: 500 },
  ];
  masterTiers.forEach((tier) => {
    if (tier.targetScore > bestScore) {
      candidates.push({
        name: tier.name,
        emoji: tier.emoji,
        category: "Master Tier",
        targetScore: tier.targetScore,
      });
    }
  });

  // Sort by closest target score
  candidates.sort((a, b) => a.targetScore - b.targetScore);

  const next = candidates[0] || {
    name: "Transcendent Flyer",
    emoji: "👑",
    category: "Master Tier" as const,
    targetScore: Math.ceil((bestScore + 50) / 50) * 50,
  };

  const needed = Math.max(1, next.targetScore - bestScore);
  const progressPct = Math.min(100, Math.max(5, Math.round((bestScore / next.targetScore) * 100)));

  return {
    name: next.name,
    emoji: next.emoji,
    category: next.category,
    targetScore: next.targetScore,
    currentScore: bestScore,
    needed,
    progressPct,
    description: `${next.emoji} ${next.name} (${next.category}) • ${needed} pts away`,
  };
}
