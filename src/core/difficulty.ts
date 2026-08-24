import { BASE_SCROLL, MAX_SCROLL, SCROLL_RAMP, GAP_START, GAP_MIN, GAP_SHRINK_END_SCORE } from "./constants";

export function scrollForScore(score: number): number {
  return Math.min(MAX_SCROLL, BASE_SCROLL + SCROLL_RAMP * Math.max(0, score));
}

export function gapForScore(score: number): number {
  const t = Math.min(1, Math.max(0, score) / GAP_SHRINK_END_SCORE);
  return GAP_START - (GAP_START - GAP_MIN) * t;
}
