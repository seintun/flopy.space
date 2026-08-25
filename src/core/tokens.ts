import type { InFlightToken } from "./types";

export interface TokenCollectEvent {
  id: number;
  value: number;
  rawVal: number;
  isChubby: boolean;
}

/**
 * Updates in-flight token movement (magnet suction & near-miss draft)
 * and resolves collection events with multiplier calculations.
 */
export function updateInFlightTokens(
  tokens: InFlightToken[],
  birdY: number,
  dt: number,
  hasMagnet: boolean,
  magnetRadius: number,
  isChubby: boolean,
  onCollect?: (e: TokenCollectEvent) => void,
): number {
  let totalValCollected = 0;
  const chubbyCoinMult = isChubby ? 3 : 1;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.taken) continue;

    const dx = t.x - 0;
    const dy = t.y - birdY;
    const distSq = dx * dx + dy * dy;

    // Super Magnet / Fever vortex suction (8.5 radius) + Near-miss draft (1.4 radius)
    if (hasMagnet && distSq < magnetRadius * magnetRadius) {
      t.x += (0 - t.x) * 14 * dt;
      t.y += (birdY - t.y) * 14 * dt;
    } else if (distSq < 2.0) {
      // Subtle near-miss micro-draft
      t.x += (0 - t.x) * 3.5 * dt;
      t.y += (birdY - t.y) * 3.5 * dt;
    }

    if (distSq < 0.75) {
      t.taken = true;
      const rawVal = t.value || 1;
      const val = rawVal * chubbyCoinMult;
      totalValCollected += val;

      onCollect?.({
        id: t.id,
        value: val,
        rawVal,
        isChubby,
      });
    }
  }

  return totalValCollected;
}
