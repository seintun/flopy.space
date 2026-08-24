import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAll,
  saveBest,
  bankFeathers,
  touchStreak,
  unlockFor,
  setSkin,
  clearStorageForTest,
} from "./storage";

describe("storage", () => {
  beforeEach(() => {
    clearStorageForTest();
  });

  it("loads defensive defaults", () => {
    const data = loadAll();
    expect(data.best).toBe(0);
    expect(data.feathers).toBe(0);
    expect(data.muted).toBe(false);
    expect(data.skin).toBe("classic");
    expect(data.unlocked).toEqual(["classic"]);
  });

  it("updates best score and flags isNewBest", () => {
    expect(saveBest(10)).toEqual({ best: 10, isNewBest: true });
    expect(saveBest(8)).toEqual({ best: 10, isNewBest: false });
    expect(saveBest(15)).toEqual({ best: 15, isNewBest: true });
  });

  it("banks feathers up to max cap 9", () => {
    expect(bankFeathers(4, 1)).toBe(3); // 4 earned - 1 used = 3
    expect(bankFeathers(10, 0)).toBe(9); // capped at 9
  });

  it("calculates daily streaks correctly", () => {
    const s1 = touchStreak("2026-08-20");
    expect(s1).toBe(1);

    // Same day
    const s2 = touchStreak("2026-08-20");
    expect(s2).toBe(1);

    // Next day -> increment
    const s3 = touchStreak("2026-08-21");
    expect(s3).toBe(2);

    // Gap day -> reset to 1
    const s4 = touchStreak("2026-08-24");
    expect(s4).toBe(1);
  });

  it("unlocks skins at thresholds 15, 30, 50", () => {
    expect(unlockFor(10)).toEqual(["classic"]);
    expect(unlockFor(15)).toEqual(["classic", "sunrise"]);
    expect(unlockFor(35)).toEqual(["classic", "sunrise", "ember"]);
    expect(unlockFor(55)).toEqual(["classic", "sunrise", "ember", "void"]);
  });

  it("persists skin selection", () => {
    unlockFor(20);
    setSkin("sunrise");
    expect(loadAll().skin).toBe("sunrise");
  });
});
