export interface Mission {
  id: string;
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
  | "fever"
  | "combo5"
  | "scoreMilestone";

export function getDailyMissionsForDate(dateStr: string): Mission[] {
  // Deterministic 3 missions based on date seed
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const pos = Math.abs(hash);

  const pool: Array<Omit<Mission, "current" | "completed" | "claimed">> = [
    { id: "pipes15", title: "Flap Master", description: "Fly past 15 pipes in total", goal: 15, rewardFeathers: 1 },
    { id: "nearmiss2", title: "Daredevil", description: "Perform 2 near-misses", goal: 2, rewardFeathers: 1 },
    { id: "slowmo2", title: "Time Bender", description: "Collect 2 slow-mo orbs", goal: 2, rewardFeathers: 1 },
    { id: "fever1", title: "Fever Rush", description: "Trigger Fever Mode once", goal: 1, rewardFeathers: 2 },
    { id: "combo5", title: "Combo King", description: "Reach a 5x combo multiplier", goal: 1, rewardFeathers: 2 },
    { id: "score25", title: "High Flyer", description: "Reach a score of 25 in one run", goal: 25, rewardFeathers: 2 },
  ];

  const m1 = pool[pos % pool.length]!;
  const m2 = pool[(pos + 2) % pool.length]!;
  const m3 = pool[(pos + 4) % pool.length]!;

  const unique = [m1];
  if (!unique.some((m) => m.id === m2.id)) unique.push(m2);
  else unique.push(pool[(pos + 1) % pool.length]!);

  if (!unique.some((m) => m.id === m3.id)) unique.push(m3);
  else unique.push(pool[(pos + 3) % pool.length]!);

  return unique.map((m) => ({ ...m, current: 0, completed: false, claimed: false }));
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
    if (m.id.startsWith("pipes") && event === "pass") matches = true;
    if (m.id.startsWith("nearmiss") && event === "nearMiss") matches = true;
    if (m.id.startsWith("slowmo") && event === "slowmo") matches = true;
    if (m.id.startsWith("fever") && event === "fever") matches = true;
    if (m.id.startsWith("combo5") && event === "combo5") matches = true;
    if (m.id.startsWith("score") && event === "scoreMilestone") {
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
