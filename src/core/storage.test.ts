import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAll,
  saveBest,
  bankFeathers,
  addFeathers,
  spendFeathers,
  touchStreak,
  unlockFor,
  setSkin,
  recordPlaySession,
  clearStorageForTest,
} from "./storage";

describe("storage", () => {
  beforeEach(() => {
    clearStorageForTest();
  });

  it("loads defensive defaults with Classic Peep bird starter", () => {
    const data = loadAll();
    expect(data.best).toBe(0);
    expect(data.feathers).toBe(0);
    expect(data.muted).toBe(false);
    expect(data.character).toBe("bird");
    expect(data.skin).toBe("classic");
    expect(data.unlocked).toEqual(["classic"]);
    expect(data.totalPlayTimeSec).toBe(0);
    expect(data.totalRuns).toBe(0);
  });

  it("updates best score and flags isNewBest", () => {
    expect(saveBest(10)).toEqual({ best: 10, isNewBest: true });
    expect(saveBest(8)).toEqual({ best: 10, isNewBest: false });
    expect(saveBest(15)).toEqual({ best: 15, isNewBest: true });
  });

  it("banks feathers up to max cap 3", () => {
    expect(bankFeathers(2, 0)).toBe(2);
    expect(bankFeathers(4, 1)).toBe(3); // 4 earned - 1 used = 3 (capped at 3)
    expect(bankFeathers(10, 0)).toBe(3); // capped at 3
  });

  it("addFeathers adds to existing balance up to cap without overwriting", () => {
    clearStorageForTest();
    bankFeathers(2);
    expect(loadAll().feathers).toBe(2);

    // Add 1 feather -> should reach 3
    expect(addFeathers(1)).toBe(3);
    expect(loadAll().feathers).toBe(3);

    // Add 1 more when at 3/3 -> should stay at 3 (capped)
    expect(addFeathers(1)).toBe(3);
    expect(loadAll().feathers).toBe(3);
  });

  it("spendFeathers decrements balance and respects availability", () => {
    clearStorageForTest();
    addFeathers(3);
    expect(loadAll().feathers).toBe(3);

    expect(spendFeathers(1)).toBe(true);
    expect(loadAll().feathers).toBe(2);

    expect(spendFeathers(2)).toBe(true);
    expect(loadAll().feathers).toBe(0);

    // Attempting to spend with 0 feathers fails
    expect(spendFeathers(1)).toBe(false);
    expect(loadAll().feathers).toBe(0);
  });

  it("records play session time and pipes passed incrementally", () => {
    recordPlaySession(24.5, 6);
    let data = loadAll();
    expect(data.totalPlayTimeSec).toBe(25);
    expect(data.totalRuns).toBe(1);
    expect(data.totalPipesPassed).toBe(6);

    recordPlaySession(35.2, 10);
    data = loadAll();
    expect(data.totalPlayTimeSec).toBe(60);
    expect(data.totalRuns).toBe(2);
    expect(data.totalPipesPassed).toBe(16);
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

  it("unlocks skins at thresholds 15, 30, 50, 100", () => {
    expect(unlockFor(10)).toEqual(["classic"]);
    expect(unlockFor(15)).toEqual(["classic", "sunrise"]);
    expect(unlockFor(35)).toEqual(["classic", "sunrise", "ember"]);
    expect(unlockFor(55)).toEqual(["classic", "sunrise", "ember", "void"]);
    expect(unlockFor(100)).toEqual(["classic", "sunrise", "ember", "void", "prism"]);
  });

  it("persists skin selection", () => {
    unlockFor(20);
    setSkin("sunrise");
    expect(loadAll().skin).toBe("sunrise");
  });
});
