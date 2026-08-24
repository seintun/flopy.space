import { inject as injectAnalytics, track } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

let isInitialized = false;

export function initAnalytics(): void {
  if (isInitialized) return;
  try {
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      injectAnalytics({ mode: "production" });
      injectSpeedInsights();
    }
    isInitialized = true;
  } catch {
    // Graceful fallback for offline / test environments
  }
}

export type AnalyticsEvent =
  | "game_start"
  | "game_over"
  | "pwa_install"
  | "quest_claim"
  | "rewind_used"
  | "fever_mode"
  | "skin_selected"
  | "character_selected"
  | "unlock_claimed";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  try {
    track(event, properties);
  } catch {
    // Non-blocking fallback
  }
}
