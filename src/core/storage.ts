import { CHARACTERS, type CharacterId } from "./characters";
import { BIOMES, type BiomeId } from "./biomes";
import { getDailyMissionsForDate, getLifetimeMissions, type Mission } from "./missions";

export interface SkinDef {
  id: string;
  name: string;
  bodyColor: number;
  bellyColor: number;
  unlockScore: number;
}

export const SKINS: Record<string, SkinDef> = {
  classic: { id: "classic", name: "Classic Gold", bodyColor: 0xffd000, bellyColor: 0xfff8f0, unlockScore: 0 },
  sunrise: { id: "sunrise", name: "Sakura Blossom", bodyColor: 0xff8da1, bellyColor: 0xfff0f5, unlockScore: 85 }, // Tier 2 (Skin)
  ember: { id: "ember", name: "Midnight Obsidian", bodyColor: 0x25262c, bellyColor: 0x3a3d46, unlockScore: 300 }, // Tier 5 (Skin)
  void: { id: "void", name: "Cosmic Starcat", bodyColor: 0x7928ca, bellyColor: 0x00dfd8, unlockScore: 740 }, // Tier 8 (Skin)
  prism: { id: "prism", name: "Prism Hologram", bodyColor: 0x00f5d4, bellyColor: 0xff007f, unlockScore: 1600 }, // Tier 11 (Skin)
};

export const FEATHER_BANK_CAP = 3;

export interface SaveData {
  best: number;
  tokens: number;
  lifetimeTokens: number;
  feathers: number; // cap 3
  muted: boolean;
  streak: { lastDay: string; count: number };
  skin: string;
  character: CharacterId;
  biome: BiomeId | "auto";
  unlocked: string[];
  unlockedChars: string[];
  unlockedBiomes: string[];
  totalPlayTimeSec: number;
  totalRuns: number;
  totalPipesPassed: number;
}

export interface PendingUnlock {
  category: "hero" | "scene" | "skin";
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  unlockValue: number;
}

const PREFIX = "f3d.";
const memStore: Record<string, string> = {};

function getLocal(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(PREFIX + key);
    }
  } catch {
    // fallback
  }
  return memStore[PREFIX + key] ?? null;
}

function setLocal(key: string, val: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PREFIX + key, val);
      return;
    }
  } catch {
    // fallback
  }
  memStore[PREFIX + key] = val;
}

export function clearStorageForTest(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  } catch {
    // ignore
  }
  for (const k of Object.keys(memStore)) {
    delete memStore[k];
  }
}

function safeParseArray<T>(raw: string | null, fallback: T[]): T[] {
  if (!raw) return [...fallback];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...fallback];
    return parsed as T[];
  } catch {
    return [...fallback];
  }
}

export function loadAll(): SaveData {
  const best = parseInt(getLocal("best") || "0", 10) || 0;
  const tokens = Math.max(0, parseInt(getLocal("tokens") || "0", 10) || 0);
  const lifetimeTokens = Math.max(tokens, parseInt(getLocal("lifetimeTokens") || "0", 10) || 0);
  const feathers = Math.min(FEATHER_BANK_CAP, Math.max(0, parseInt(getLocal("feathers") || "0", 10) || 0));
  const muted = getLocal("muted") === "true";
  const totalPlayTimeSec = parseFloat(getLocal("totalPlayTimeSec") || "0") || 0;
  const totalRuns = parseInt(getLocal("totalRuns") || "0", 10) || 0;
  const totalPipesPassed = parseInt(getLocal("totalPipesPassed") || "0", 10) || 0;

  let streak = { lastDay: "", count: 0 };
  try {
    const rawStreak = getLocal("streak");
    if (rawStreak) {
      const parsed = JSON.parse(rawStreak);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        streak = {
          lastDay: typeof parsed.lastDay === "string" ? parsed.lastDay : "",
          count: typeof parsed.count === "number" && !isNaN(parsed.count) ? parsed.count : 0,
        };
      }
    }
  } catch {
    streak = { lastDay: "", count: 0 };
  }

  const unlocked = safeParseArray(getLocal("unlocked"), ["classic"]);
  if (!unlocked.includes("classic")) unlocked.unshift("classic");

  const unlockedChars = safeParseArray(getLocal("unlockedChars"), ["bird"]);
  if (!unlockedChars.includes("bird")) unlockedChars.unshift("bird");

  const unlockedBiomes = safeParseArray(getLocal("unlockedBiomes"), ["meadow"]);
  if (!unlockedBiomes.includes("meadow")) unlockedBiomes.unshift("meadow");

  let skin = getLocal("skin") || "classic";
  if (!SKINS[skin]) skin = "classic";

  let character = (getLocal("character") || "bird") as CharacterId;
  if (!CHARACTERS[character]) character = "bird";

  let biome = (getLocal("biome") || "auto") as BiomeId | "auto";
  if (biome !== "auto" && !BIOMES[biome]) biome = "auto";

  return {
    best,
    tokens,
    lifetimeTokens,
    feathers,
    muted,
    streak,
    skin,
    character,
    biome,
    unlocked,
    unlockedChars,
    unlockedBiomes,
    totalPlayTimeSec,
    totalRuns,
    totalPipesPassed,
  };
}

export function saveBest(score: number): { best: number; isNewBest: boolean } {
  const data = loadAll();
  if (score > data.best) {
    setLocal("best", score.toString());
    return { best: score, isNewBest: true };
  }
  return { best: data.best, isNewBest: false };
}

export function recordPlaySession(seconds: number, pipesPassed: number): void {
  const data = loadAll();
  const newPlayTime = Math.round(data.totalPlayTimeSec + seconds);
  const newRuns = data.totalRuns + 1;
  const newPipes = data.totalPipesPassed + pipesPassed;

  setLocal("totalPlayTimeSec", newPlayTime.toString());
  setLocal("totalRuns", newRuns.toString());
  setLocal("totalPipesPassed", newPipes.toString());
}

export function bankFeathers(balanceOrEarned: number, rewindsUsed = 0): number {
  const net = Math.max(0, balanceOrEarned - rewindsUsed);
  const total = Math.min(FEATHER_BANK_CAP, net);
  setLocal("feathers", total.toString());
  return total;
}

export function addFeathers(amount: number): number {
  const data = loadAll();
  const newTotal = Math.min(FEATHER_BANK_CAP, Math.max(0, data.feathers + amount));
  setLocal("feathers", newTotal.toString());
  return newTotal;
}

export function resetSessionFeathers(): void {
  setLocal("feathers", "0");
}

export function spendFeathers(amount: number): boolean {
  const data = loadAll();
  if (data.feathers >= amount) {
    setLocal("feathers", (data.feathers - amount).toString());
    return true;
  }
  return false;
}

export function addTokens(amount: number): number {
  const data = loadAll();
  const safe = Math.max(0, Math.floor(amount));
  const newTokens = data.tokens + safe;
  const newLifetime = data.lifetimeTokens + safe;
  setLocal("tokens", newTokens.toString());
  setLocal("lifetimeTokens", newLifetime.toString());
  return newTokens;
}

export function spendTokens(amount: number): boolean {
  const data = loadAll();
  const safe = Math.max(0, Math.floor(amount));
  if (safe > 0 && data.tokens >= safe) {
    const newTokens = data.tokens - safe;
    setLocal("tokens", newTokens.toString());
    return true;
  }
  return false;
}

function parseYMD(str: string): { y: number; m: number; d: number } {
  const [y, m, d] = str.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

export function getTodayString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getUtcMidnightCountdown(): string {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffSec = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function touchStreak(todayStr = getTodayString()): number {
  const data = loadAll();
  const last = data.streak.lastDay;

  if (last === todayStr) {
    return data.streak.count || 1;
  }

  const { y, m, d } = parseYMD(todayStr);
  const localDate = new Date(y, m - 1, d);
  localDate.setDate(localDate.getDate() - 1);
  const yStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

  let newCount = 1;
  if (last === yStr) {
    newCount = (data.streak.count || 0) + 1;
  }

  const newStreak = { lastDay: todayStr, count: newCount };
  setLocal("streak", JSON.stringify(newStreak));
  return newCount;
}

export function unlockFor(_bestScore = 0): string[] {
  return claimSkin("classic");
}

export function isSkinUnlocked(
  skinId: string,
  unlockedSkins: string[] = ["classic"],
): boolean {
  if (skinId === "classic" || unlockedSkins.includes(skinId)) return true;
  return false;
}

export function claimSkin(skinId: string): string[] {
  const data = loadAll();
  const unlocked = new Set(data.unlocked);
  unlocked.add(skinId);
  const result = Array.from(unlocked);
  setLocal("unlocked", JSON.stringify(result));
  return result;
}

export function claimCharacter(charId: CharacterId): string[] {
  const data = loadAll();
  const unlocked = new Set(data.unlockedChars);
  unlocked.add(charId);
  const result = Array.from(unlocked);
  setLocal("unlockedChars", JSON.stringify(result));
  return result;
}

export function claimBiome(biomeId: BiomeId): string[] {
  const data = loadAll();
  const unlocked = new Set(data.unlockedBiomes);
  unlocked.add(biomeId);
  const result = Array.from(unlocked);
  setLocal("unlockedBiomes", JSON.stringify(result));
  return result;
}

export function isSkinClaimable(
  skinId: string,
  tokens: number,
  unlockedSkins: string[] = ["classic"],
): boolean {
  if (skinId === "classic" || unlockedSkins.includes(skinId)) return false;
  const def = SKINS[skinId];
  if (!def || def.unlockScore === 0) return false;
  return tokens >= def.unlockScore;
}

export function getPendingUnlocks(data: SaveData): PendingUnlock[] {
  const pending: PendingUnlock[] = [];

  // 1. Check Heroes
  Object.values(CHARACTERS).forEach((char) => {
    if (!data.unlockedChars.includes(char.id) && char.unlockValue > 0) {
      if (data.tokens >= char.unlockValue) {
        pending.push({
          category: "hero",
          id: char.id,
          name: char.name,
          emoji: char.emoji,
          tagline: char.tagline,
          unlockValue: char.unlockValue,
        });
      }
    }
  });

  // 2. Check Scenes / Biomes
  Object.values(BIOMES).forEach((biome) => {
    if (
      !data.unlockedBiomes.includes(biome.id) &&
      biome.unlockScore > 0 &&
      data.tokens >= biome.unlockScore
    ) {
      pending.push({
        category: "scene",
        id: biome.id,
        name: biome.name,
        emoji: biome.emoji,
        tagline: biome.tagline,
        unlockValue: biome.unlockScore,
      });
    }
  });

  // 3. Check Skins
  Object.values(SKINS).forEach((skin) => {
    if (
      !data.unlocked.includes(skin.id) &&
      skin.unlockScore > 0 &&
      data.tokens >= skin.unlockScore
    ) {
      pending.push({
        category: "skin",
        id: skin.id,
        name: skin.name,
        emoji: "🎨",
        tagline: `Cost ${skin.unlockScore} 🪙 Master Skin`,
        unlockValue: skin.unlockScore,
      });
    }
  });

  return pending;
}

export function setSkin(skinId: string): void {
  if (SKINS[skinId]) {
    setLocal("skin", skinId);
  }
}

export function setCharacter(charId: CharacterId): void {
  if (CHARACTERS[charId]) {
    setLocal("character", charId);
  }
}

export function setBiome(biomeId: BiomeId | "auto"): void {
  if (biomeId === "auto" || BIOMES[biomeId]) {
    setLocal("biome", biomeId);
  }
}

export function setMuted(muted: boolean): void {
  setLocal("muted", muted.toString());
}

export function getStoredMissions(): Mission[] {
  const today = getTodayString();
  const storedDate = getLocal("missionsDate");
  const rawMissions = getLocal("missions");
  let daily: Mission[] = [];

  if (storedDate === today && rawMissions) {
    daily = safeParseArray(rawMissions, getDailyMissionsForDate(today));
  } else {
    daily = getDailyMissionsForDate(today);
    setLocal("missionsDate", today);
    setLocal("missions", JSON.stringify(daily));
  }

  const rawLifetime = getLocal("lifetimeMissions");
  const storedLifetime = rawLifetime ? safeParseArray<Mission>(rawLifetime, []) : undefined;
  const lifetime = getLifetimeMissions(storedLifetime && storedLifetime.length > 0 ? storedLifetime : undefined);

  return [...daily, ...lifetime];
}

export function saveStoredMissions(missions: Mission[]): void {
  const daily = missions.filter((m) => m.category === "daily");
  const lifetime = missions.filter((m) => m.category === "lifetime");

  setLocal("missionsDate", getTodayString());
  setLocal("missions", JSON.stringify(daily));
  setLocal("lifetimeMissions", JSON.stringify(lifetime));
}
