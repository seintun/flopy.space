import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAll,
  saveBest,
  bankFeathers,
  addFeathers,
  spendFeathers,
  addTokens,
  spendTokens,
  touchStreak,
  claimSkin,
  getPendingUnlocks,
  setSkin,
  recordPlaySession,
  getStoredMissions,
  saveStoredMissions,
  getUtcMidnightCountdown,
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

  it("claims skins and tracks pending unlock thresholds", () => {
    claimSkin("sunrise");
    expect(loadAll().unlocked).toEqual(["classic", "sunrise"]);
    claimSkin("ember");
    expect(loadAll().unlocked).toEqual(["classic", "sunrise", "ember"]);
  });

  it("getPendingUnlocks returns claimable items matching player token balance", () => {
    addTokens(100);
    const data = loadAll();
    const pending = getPendingUnlocks(data);
    expect(pending.some((p) => p.id === "neko")).toBe(true); // 40 tokens
    expect(pending.some((p) => p.id === "sunrise")).toBe(true); // 85 tokens
    expect(pending.some((p) => p.id === "cyber")).toBe(false); // 140 tokens
  });

  it("persists skin selection", () => {
    claimSkin("sunrise");
    setSkin("sunrise");
    expect(loadAll().skin).toBe("sunrise");
  });

  it("accrues tokens and handles atomic spend operations", () => {
    expect(loadAll().tokens).toBe(0);
    expect(loadAll().lifetimeTokens).toBe(0);

    // Earn 59 tokens from a run
    expect(addTokens(59)).toBe(59);
    expect(loadAll().tokens).toBe(59);
    expect(loadAll().lifetimeTokens).toBe(59);

    // Spend 40 tokens on Neko -> balance becomes 19
    expect(spendTokens(40)).toBe(true);
    expect(loadAll().tokens).toBe(19);
    expect(loadAll().lifetimeTokens).toBe(59); // lifetime never decreases

    // Insufficient funds rejected safely
    expect(spendTokens(100)).toBe(false);
    expect(loadAll().tokens).toBe(19);

    // Spend remaining 19 -> balance becomes 0
    expect(spendTokens(19)).toBe(true);
    expect(loadAll().tokens).toBe(0);
  });

  it("stores and retrieves daily and lifetime missions", () => {
    const missions = getStoredMissions();
    expect(missions.length).toBe(15); // 3 daily + 12 lifetime
    const daily = missions.filter((m) => m.category === "daily");
    const lifetime = missions.filter((m) => m.category === "lifetime");
    expect(daily.length).toBe(3);
    expect(lifetime.length).toBe(12);

    // Update progress on a lifetime mission
    lifetime[0]!.current = 50;
    saveStoredMissions(missions);

    const reloaded = getStoredMissions();
    const reloadedLifetime = reloaded.filter((m) => m.category === "lifetime");
    expect(reloadedLifetime[0]!.current).toBe(50);
  });

  it("computes valid UTC midnight countdown", () => {
    const countdown = getUtcMidnightCountdown();
    expect(countdown).toMatch(/^\d{2}h \d{2}m \d{2}s$/);
  });
});
