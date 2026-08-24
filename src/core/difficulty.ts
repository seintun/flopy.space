import { BASE_SCROLL, MAX_SCROLL, SCROLL_RAMP, GAP_START, GAP_MIN, GAP_SHRINK_END_SCORE } from "./constants";

export function scrollForScore(score: number, rewindsUsed = 0): number {
  const rewindBoost = Math.min(2.0, rewindsUsed * 0.75);
  return Math.min(MAX_SCROLL, BASE_SCROLL + SCROLL_RAMP * Math.max(0, score) + rewindBoost);
}

export function gapForScore(score: number, rewindsUsed = 0): number {
  const t = Math.min(1, Math.max(0, score) / GAP_SHRINK_END_SCORE);
  const baseGap = GAP_START - (GAP_START - GAP_MIN) * t;
  const gapTighten = Math.min(0.3, rewindsUsed * 0.12);
  return Math.max(GAP_MIN - 0.2, baseGap - gapTighten);
}

export interface RewindTier {
  invulnTicks: number;
  slowmoDuration: number;
  slowmoInitialScale: number;
  popupText: string;
  popupColor: string;
  toastTitle: string;
  toastDesc: string;
}

export function getRewindTierParams(rewindsBefore: number): RewindTier {
  if (rewindsBefore <= 0) {
    return {
      invulnTicks: 120, // 1.0s
      slowmoDuration: 1.8,
      slowmoInitialScale: 0.45,
      popupText: "⚡ BULLET TIME",
      popupColor: "#00e5ff",
      toastTitle: "REWIND 1/3: BULLET-TIME",
      toastDesc: "Speed slowed to 45% for easy sync",
    };
  }
  if (rewindsBefore === 1) {
    return {
      invulnTicks: 75, // 0.625s
      slowmoDuration: 1.2,
      slowmoInitialScale: 0.65,
      popupText: "⚡ TEMPORAL FLUX",
      popupColor: "#ffd700",
      toastTitle: "REWIND 2/3: HIGHER TENSION",
      toastDesc: "Tighter safety window & speed boost",
    };
  }
  return {
    invulnTicks: 45, // 0.375s
    slowmoDuration: 0.7,
    slowmoInitialScale: 0.85,
    popupText: "💀 TEMPORAL OVERLOAD",
    popupColor: "#ff007f",
    toastTitle: "FINAL REWIND 3/3: MAX RISK",
    toastDesc: "Minimal invulnerability & hyper tempo!",
  };
}
