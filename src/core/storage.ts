import { CHARACTERS, type CharacterId } from "./characters";
import { BIOMES, type BiomeId } from "./biomes";
import { getDailyMissionsForDate, type Mission } from "./missions";

export interface SkinDef {
  id: string;
  name: string;
  bodyColor: number;
  bellyColor: number;
  unlockScore: number;
}

export const SKINS: Record<string, SkinDef> = {
  classic: { id: "classic", name: "Classic Gold", bodyColor: 0xffd000, bellyColor: 0xfff8f0, unlockScore: 0 },
  sunrise: { id: "sunrise", name: "Sakura Blossom", bodyColor: 0xff8da1, bellyColor: 0xfff0f5, unlockScore: 15 },
  ember: { id: "ember", name: "Midnight Obsidian", bodyColor: 0x25262c, bellyColor: 0x3a3d46, unlockScore: 30 },
  void: { id: "void", name: "Cosmic Starcat", bodyColor: 0x7928ca, bellyColor: 0x00dfd8, unlockScore: 50 },
  prism: { id: "prism", name: "Prism Hologram", bodyColor: 0x00f5d4, bellyColor: 0xff007f, unlockScore: 100 },
};

export interface SaveData {
  best: number;
  feathers: number; // cap 9
  muted: boolean;
  streak: { lastDay: string; count: number };
  skin: string;
  character: CharacterId;
  biome: BiomeId | "auto";
  unlocked: string[];
  unlockedChars: string[];
  totalPlayTimeSec: number;
  totalRuns: number;
  totalPipesPassed: number;
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

export function loadAll(): SaveData {
  const best = parseInt(getLocal("best") || "0", 10) || 0;
  const feathers = Math.min(9, Math.max(0, parseInt(getLocal("feathers") || "0", 10) || 0));
  const muted = getLocal("muted") === "true";
  const totalPlayTimeSec = parseFloat(getLocal("totalPlayTimeSec") || "0") || 0;
  const totalRuns = parseInt(getLocal("totalRuns") || "0", 10) || 0;
  const totalPipesPassed = parseInt(getLocal("totalPipesPassed") || "0", 10) || 0;

  let streak = { lastDay: "", count: 0 };
  try {
    const rawStreak = getLocal("streak");
    if (rawStreak) streak = JSON.parse(rawStreak);
  } catch {
    streak = { lastDay: "", count: 0 };
  }

  let unlocked = ["classic"];
  try {
    const rawUnlocked = getLocal("unlocked");
    if (rawUnlocked) unlocked = JSON.parse(rawUnlocked);
    if (!unlocked.includes("classic")) unlocked.unshift("classic");
  } catch {
    unlocked = ["classic"];
  }

  let unlockedChars: string[] = ["bird"];
  try {
    const rawUnlockedChars = getLocal("unlockedChars");
    if (rawUnlockedChars) unlockedChars = JSON.parse(rawUnlockedChars);
    if (!unlockedChars.includes("bird")) unlockedChars.unshift("bird");
  } catch {
    unlockedChars = ["bird"];
  }

  let skin = getLocal("skin") || "classic";
  if (!SKINS[skin]) skin = "classic";

  let character = (getLocal("character") || "bird") as CharacterId;
  if (!CHARACTERS[character]) character = "bird";

  let biome = (getLocal("biome") || "auto") as BiomeId | "auto";
  if (biome !== "auto" && !BIOMES[biome]) biome = "auto";

  return {
    best,
    feathers,
    muted,
    streak,
    skin,
    character,
    biome,
    unlocked,
    unlockedChars,
    totalPlayTimeSec,
    totalRuns,
    totalPipesPassed,
  };
}

export function saveBest(score: number): { best: number; isNewBest: boolean } {
  const data = loadAll();
  if (score > data.best) {
    setLocal("best", score.toString());
    unlockFor(score);
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
  const total = Math.min(9, net);
  setLocal("feathers", total.toString());
  return total;
}

export function spendFeathers(amount: number): boolean {
  const data = loadAll();
  if (data.feathers >= amount) {
    setLocal("feathers", (data.feathers - amount).toString());
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
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export function unlockFor(bestScore: number): string[] {
  const data = loadAll();
  const unlocked = new Set(data.unlocked);

  for (const s of Object.values(SKINS)) {
    if (bestScore >= s.unlockScore) {
      unlocked.add(s.id);
    }
  }

  const result = Array.from(unlocked);
  setLocal("unlocked", JSON.stringify(result));
  return result;
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

  if (storedDate === today && rawMissions) {
    try {
      return JSON.parse(rawMissions);
    } catch {
      // fallback
    }
  }

  const fresh = getDailyMissionsForDate(today);
  setLocal("missionsDate", today);
  setLocal("missions", JSON.stringify(fresh));
  return fresh;
}

export function saveStoredMissions(missions: Mission[]): void {
  setLocal("missionsDate", getTodayString());
  setLocal("missions", JSON.stringify(missions));
}
