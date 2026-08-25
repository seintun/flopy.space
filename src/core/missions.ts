export interface Mission {
  id: string;
  category: "daily" | "lifetime";
  title: string;
  description: string;
  goal: number;
  current: number;
  rewardFeathers: number;
  completed: boolean;
  claimed: boolean;
}

export type MissionEventType =
  | "pass"
  | "nearMiss"
  | "slowmo"
  | "rainbow"
  | "shield"
  | "shield_save"
  | "stargem"
  | "speedsurge"
  | "magnet"
  | "fever"
  | "combo5"
  | "scoreMilestone"
  | "tokenCollect"
  | "magnetToken"
  | "tokensBanked"
  | "airtime"
  | "rewind"
  | "cyberPass"
  | "candyPass"
  | "magmaPass";

export const DAILY_MISSION_POOL: Array<Omit<Mission, "current" | "completed" | "claimed">> = [
  // 1. Coins & Economy
  { id: "daily_coins15", category: "daily", title: "Coin Collector", description: "Collect 15 in-flight gold coins", goal: 15, rewardFeathers: 1 },
  { id: "daily_magnet10", category: "daily", title: "Magnetic Vacuum", description: "Vacuum 10 coins with Super Magnet or Fever", goal: 10, rewardFeathers: 1 },
  { id: "daily_tokens30", category: "daily", title: "Vault Rush", description: "Bank 30 tokens from runs today", goal: 30, rewardFeathers: 1 },

  // 2. Precision & Acrobatics
  { id: "daily_nearmiss3", category: "daily", title: "Daredevil", description: "Perform 3 near-misses grazing pipes", goal: 3, rewardFeathers: 1 },
  { id: "daily_combo5", category: "daily", title: "Combo Spree", description: "Reach a 5x combo streak", goal: 1, rewardFeathers: 1 },

  // 3. Tactical Power-Ups
  { id: "daily_slowmo2", category: "daily", title: "Time Bender", description: "Collect 2 Slow-Mo orbs", goal: 2, rewardFeathers: 1 },
  { id: "daily_rainbow2", category: "daily", title: "Rainbow Rider", description: "Activate 2 Rainbow Trail power-ups", goal: 2, rewardFeathers: 1 },
  { id: "daily_shield1", category: "daily", title: "Shield Survivor", description: "Survive a fatal crash with Star Shield", goal: 1, rewardFeathers: 1 },
  { id: "daily_stargem2", category: "daily", title: "Gem Hoarder", description: "Collect 2 Star Gems (+5 bonus pts)", goal: 2, rewardFeathers: 1 },
  { id: "daily_surge2", category: "daily", title: "Surge Pilot", description: "Survive 2 Speed Surge hyper-tempos", goal: 2, rewardFeathers: 1 },
  { id: "daily_magnet2", category: "daily", title: "Magnetizer", description: "Collect 2 Super Magnet orbs", goal: 2, rewardFeathers: 1 },
  { id: "daily_fever1", category: "daily", title: "Fever Rush", description: "Trigger Fever Mode once", goal: 1, rewardFeathers: 1 },

  // 4. Endurance & Score
  { id: "daily_pipes20", category: "daily", title: "Flap Master", description: "Fly past 20 pipes in total today", goal: 20, rewardFeathers: 1 },
  { id: "daily_pipes_run12", category: "daily", title: "Marathon Pilot", description: "Clear 12 pipes in a single run", goal: 12, rewardFeathers: 1 },
  { id: "daily_airtime45", category: "daily", title: "Endurance Wing", description: "Stay airborne for 45 seconds total today", goal: 45, rewardFeathers: 1 },
  { id: "daily_score20", category: "daily", title: "High Flyer", description: "Reach a score of 20 in one run", goal: 20, rewardFeathers: 1 },
  { id: "daily_rewind1", category: "daily", title: "Time Warp", description: "Execute a safe 4D Rewind from crash", goal: 1, rewardFeathers: 1 },

  // 5. Biomes
  { id: "daily_cyber8", category: "daily", title: "Cyber Voyager", description: "Pass 8 pipes in Neon Cyberpunk", goal: 8, rewardFeathers: 1 },
  { id: "daily_candy8", category: "daily", title: "Sugar Rush", description: "Pass 8 pipes in Candy Kingdom", goal: 8, rewardFeathers: 1 },
  { id: "daily_magma8", category: "daily", title: "Volcano Drake", description: "Pass 8 pipes in Volcanic Rift", goal: 8, rewardFeathers: 1 },
];

export const LIFETIME_MISSIONS: Array<Omit<Mission, "current" | "completed" | "claimed">> = [
  { id: "life_pipes100", category: "lifetime", title: "Century Aviator", description: "Pass 100 pipes lifetime", goal: 100, rewardFeathers: 1 },
  { id: "life_pipes500", category: "lifetime", title: "Veteran Ace", description: "Pass 500 pipes lifetime", goal: 500, rewardFeathers: 1 },
  { id: "life_coins100", category: "lifetime", title: "Gold Prospector", description: "Collect 100 in-flight gold coins", goal: 100, rewardFeathers: 1 },
  { id: "life_coins500", category: "lifetime", title: "Gold Hoarder", description: "Collect 500 in-flight gold coins", goal: 500, rewardFeathers: 1 },
  { id: "life_tokens500", category: "lifetime", title: "Vault Tycoon", description: "Earn 500 lifetime tokens", goal: 500, rewardFeathers: 1 },
  { id: "life_score40", category: "lifetime", title: "Apex Legend", description: "Achieve a single-run score of 40+", goal: 40, rewardFeathers: 1 },
  { id: "life_nearmiss20", category: "lifetime", title: "Danger Master", description: "Execute 20 lifetime near-misses", goal: 20, rewardFeathers: 1 },
  { id: "life_fever10", category: "lifetime", title: "Fever Fiend", description: "Trigger Fever Mode 10 times", goal: 10, rewardFeathers: 1 },
  { id: "life_shield5", category: "lifetime", title: "Aegis Defender", description: "Survive 5 crashes with Star Shield", goal: 5, rewardFeathers: 1 },
  { id: "life_airtime300", category: "lifetime", title: "Stratosphere Pilot", description: "Accumulate 300 seconds airtime", goal: 300, rewardFeathers: 1 },
  { id: "life_cyber30", category: "lifetime", title: "Cyberpunk Native", description: "Pass 30 pipes in Neon Cyberpunk", goal: 30, rewardFeathers: 1 },
  { id: "life_magma30", category: "lifetime", title: "Magma Drake", description: "Pass 30 pipes in Volcanic Rift", goal: 30, rewardFeathers: 1 },
];

export function getDailyMissionsForDate(dateStr: string): Mission[] {
  // Deterministic 3 missions based on UTC date seed
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const pos = Math.abs(hash);

  const m1 = DAILY_MISSION_POOL[pos % DAILY_MISSION_POOL.length]!;
  const m2 = DAILY_MISSION_POOL[(pos + 3) % DAILY_MISSION_POOL.length]!;
  const m3 = DAILY_MISSION_POOL[(pos + 7) % DAILY_MISSION_POOL.length]!;

  const unique = [m1];
  if (!unique.some((m) => m.id === m2.id)) unique.push(m2);
  else unique.push(DAILY_MISSION_POOL[(pos + 1) % DAILY_MISSION_POOL.length]!);

  if (!unique.some((m) => m.id === m3.id)) unique.push(m3);
  else unique.push(DAILY_MISSION_POOL[(pos + 5) % DAILY_MISSION_POOL.length]!);

  return unique.map((m) => ({ ...m, current: 0, completed: false, claimed: false }));
}

export function getLifetimeMissions(stored?: Mission[]): Mission[] {
  const storedMap = new Map((stored || []).map((m) => [m.id, m]));
  return LIFETIME_MISSIONS.map((def) => {
    const s = storedMap.get(def.id);
    return {
      ...def,
      current: s ? s.current : 0,
      completed: s ? s.completed : false,
      claimed: s ? s.claimed : false,
    };
  });
}

export function recordMissionEvent(
  missions: Mission[],
  event: MissionEventType,
  value = 1,
): { newlyCompleted: Mission[] } {
  const newlyCompleted: Mission[] = [];

  for (const m of missions) {
    if (m.completed) continue;

    let matches = false;

    // Passing pipes
    if (event === "pass") {
      if (m.id.includes("pipes20") || m.id.includes("pipes100") || m.id.includes("pipes500")) {
        matches = true;
      } else if (m.id.includes("pipes_run12")) {
        matches = true;
      }
    }

    // Coins & Tokens
    if (event === "tokenCollect" && (m.id.includes("coins15") || m.id.includes("coins100") || m.id.includes("coins500") || m.id.startsWith("coins15"))) matches = true;
    if (event === "magnetToken" && m.id.includes("magnet10")) matches = true;
    if (event === "tokensBanked" && (m.id.includes("tokens30") || m.id.includes("tokens500") || m.id.startsWith("tokens50"))) matches = true;

    // Acrobatics
    if (event === "nearMiss" && (m.id.includes("nearmiss") || m.id.startsWith("nearmiss"))) matches = true;
    if (event === "combo5" && (m.id.includes("combo5") || m.id.startsWith("combo5"))) matches = true;

    // Power-ups
    if (event === "slowmo" && (m.id.includes("slowmo") || m.id.startsWith("slowmo"))) matches = true;
    if (event === "rainbow" && (m.id.includes("rainbow") || m.id.startsWith("rainbow"))) matches = true;
    if (event === "shield_save" && (m.id.includes("shield") || m.id.startsWith("shield_save"))) matches = true;
    if (event === "stargem" && (m.id.includes("stargem") || m.id.startsWith("stargem"))) matches = true;
    if (event === "speedsurge" && (m.id.includes("surge") || m.id.startsWith("speedsurge"))) matches = true;
    if (event === "magnet" && (m.id.includes("magnet2") || m.id.startsWith("magnet2"))) matches = true;
    if (event === "fever" && (m.id.includes("fever") || m.id.startsWith("fever"))) matches = true;

    // Time & Survival
    if (event === "airtime" && (m.id.includes("airtime") || m.id.startsWith("airtime"))) matches = true;
    if (event === "rewind" && (m.id.includes("rewind") || m.id.startsWith("rewind"))) matches = true;

    // Biomes
    if (event === "cyberPass" && (m.id.includes("cyber") || m.id.startsWith("cyber_pipes"))) matches = true;
    if (event === "candyPass" && (m.id.includes("candy") || m.id.startsWith("candy_pipes"))) matches = true;
    if (event === "magmaPass" && (m.id.includes("magma") || m.id.startsWith("magma_pipes"))) matches = true;

    // Score Milestone
    if (event === "scoreMilestone" && (m.id.includes("score") || m.id.startsWith("score"))) {
      m.current = Math.max(m.current, value);
      if (m.current >= m.goal) {
        m.completed = true;
        newlyCompleted.push(m);
      }
      continue;
    }

    if (matches) {
      m.current += value;
      if (m.current >= m.goal) {
        m.completed = true;
        newlyCompleted.push(m);
      }
    }
  }

  return { newlyCompleted };
}
