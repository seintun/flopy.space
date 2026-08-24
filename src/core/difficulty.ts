import {
  BASE_SCROLL,
  MAX_SCROLL,
  GAP_START,
  GAP_MIN,
  SCROLL_RAMP_MID,
  BREATHER_GAP_HEIGHT,
} from "./constants";

export function scrollForScore(score: number, rewindsUsed = 0, speedSurgeTimer = 0): number {
  const s = Math.max(0, score);
  if (s === 0 && rewindsUsed === 0 && speedSurgeTimer === 0) {
    return BASE_SCROLL;
  }
  // Asymptotic Sigmoidal speed curve
  const sExp = Math.pow(s, 1.6);
  const midExp = Math.pow(SCROLL_RAMP_MID, 1.6);
  const sigFactor = sExp / (sExp + midExp);
  const baseRamped = BASE_SCROLL + (MAX_SCROLL - BASE_SCROLL) * sigFactor;

  const rewindBoost = Math.min(2.0, rewindsUsed * 0.75);
  const surgeBoost = speedSurgeTimer > 0 ? 2.5 : 0;

  if (speedSurgeTimer > 0) {
    return Math.min(MAX_SCROLL + 2.5, baseRamped + rewindBoost + surgeBoost);
  }
  return Math.min(MAX_SCROLL, baseRamped + rewindBoost);
}

export function isBreatherPipe(pipesPassed: number): boolean {
  if (pipesPassed <= 0) return false;
  const mod = pipesPassed % 15;
  return mod === 0 || mod === 1;
}

export function gapForScore(score: number, rewindsUsed = 0, isBreather = false): number {
  if (isBreather) {
    return BREATHER_GAP_HEIGHT;
  }
  const s = Math.max(0, score);
  const baseGap = GAP_MIN + (GAP_START - GAP_MIN) * Math.exp(-0.04 * s);
  const gapTighten = Math.min(0.25, rewindsUsed * 0.1);
  return Math.max(GAP_MIN - 0.15, baseGap - gapTighten);
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
