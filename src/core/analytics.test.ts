import { describe, it, expect } from "vitest";
import { initAnalytics, trackEvent } from "./analytics";

describe("Analytics", () => {
  it("initializes analytics without throwing in test environment", () => {
    expect(() => initAnalytics()).not.toThrow();
  });

  it("tracks custom gameplay events safely", () => {
    expect(() =>
      trackEvent("game_start", { character: "bird", skin: "classic", streak: 2 }),
    ).not.toThrow();
    expect(() =>
      trackEvent("game_over", { score: 42, best: 50, duration: 35 }),
    ).not.toThrow();
    expect(() =>
      trackEvent("pwa_install", { outcome: "accepted" }),
    ).not.toThrow();
  });
});
