import { describe, it, expect } from "vitest";
import { getDailyMissionsForDate, getLifetimeMissions, recordMissionEvent, type Mission } from "./missions";

describe("missions", () => {
  it("generates deterministic 3 daily missions for a date, each strictly granting 1 feather", () => {
    const m1 = getDailyMissionsForDate("2026-08-24");
    const m2 = getDailyMissionsForDate("2026-08-24");
    expect(m1).toEqual(m2);
    expect(m1.length).toBe(3);
    m1.forEach((m) => {
      expect(m.category).toBe("daily");
      expect(m.rewardFeathers).toBe(1); // 1 feather invariant
    });
  });

  it("loads 12 lifetime milestones, each strictly granting 1 feather", () => {
    const lifetime = getLifetimeMissions();
    expect(lifetime.length).toBe(12);
    lifetime.forEach((m) => {
      expect(m.category).toBe("lifetime");
      expect(m.rewardFeathers).toBe(1);
    });
  });

  it("tracks event progress across coins, powerups, biomes, and airtime", () => {
    const missions: Mission[] = [
      { id: "daily_coins15", category: "daily", title: "Coin Collector", description: "", goal: 15, current: 0, rewardFeathers: 1, completed: false, claimed: false },
      { id: "daily_shield1", category: "daily", title: "Shield Survivor", description: "", goal: 1, current: 0, rewardFeathers: 1, completed: false, claimed: false },
      { id: "life_cyber30", category: "lifetime", title: "Cyberpunk Native", description: "", goal: 30, current: 0, rewardFeathers: 1, completed: false, claimed: false },
    ];

    // Collect 10 coins
    recordMissionEvent(missions, "tokenCollect", 10);
    expect(missions[0]!.current).toBe(10);
    expect(missions[0]!.completed).toBe(false);

    // Collect 5 more coins -> completes
    const coinResult = recordMissionEvent(missions, "tokenCollect", 5);
    expect(missions[0]!.current).toBe(15);
    expect(missions[0]!.completed).toBe(true);
    expect(coinResult.newlyCompleted.some((m) => m.id === "daily_coins15")).toBe(true);

    // Shield save event
    const shieldResult = recordMissionEvent(missions, "shield_save", 1);
    expect(missions[1]!.completed).toBe(true);
    expect(shieldResult.newlyCompleted.some((m) => m.id === "daily_shield1")).toBe(true);

    // Cyber pass event
    recordMissionEvent(missions, "cyberPass", 30);
    expect(missions[2]!.completed).toBe(true);
  });
});
