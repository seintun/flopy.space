import { describe, it, expect } from "vitest";
import { getDailyMissionsForDate, recordMissionEvent } from "./missions";

describe("missions", () => {
  it("generates deterministic 3 daily missions for a date", () => {
    const m1 = getDailyMissionsForDate("2026-08-24");
    const m2 = getDailyMissionsForDate("2026-08-24");
    expect(m1).toEqual(m2);
    expect(m1.length).toBe(3);
  });

  it("tracks event progress and reports newly completed missions", () => {
    const missions = [
      { id: "pipes15", title: "Flap Master", description: "", goal: 2, current: 0, rewardFeathers: 1, completed: false, claimed: false },
    ];

    const r1 = recordMissionEvent(missions, "pass", 1);
    expect(r1.newlyCompleted.length).toBe(0);
    expect(missions[0]!.current).toBe(1);

    const r2 = recordMissionEvent(missions, "pass", 1);
    expect(r2.newlyCompleted.length).toBe(1);
    expect(missions[0]!.completed).toBe(true);
  });
});
