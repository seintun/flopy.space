import { inject as injectAnalytics, track } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

let isInitialized = false;

export function initAnalytics(): void {
  if (isInitialized) return;
  try {
    injectAnalytics({ mode: "auto" });
    injectSpeedInsights();
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
  | "character_selected";

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
