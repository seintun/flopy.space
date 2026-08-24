import { BIRD_X, GROUND_Y, HITBOX_RADIUS, PIPE_RADIUS } from "./constants";
import type { HitType, World } from "./types";

const CEILING_TOP = 99; // effectively open-top upper pipe box

export function sphereHitsAabb(
  cx: number, cy: number, cz: number, r: number,
  minx: number, miny: number, minz: number, maxx: number, maxy: number, maxz: number,
): boolean {
  const nx = Math.max(minx, Math.min(cx, maxx));
  const ny = Math.max(miny, Math.min(cy, maxy));
  const nz = Math.max(minz, Math.min(cz, maxz));
  const dx = cx - nx, dy = cy - ny, dz = cz - nz;
  return dx * dx + dy * dy + dz * dz < r * r;
}

export function checkCollisions(w: World): HitType | null {
  const b = w.bird;
  if (!b.alive || w.tick < b.invulnUntilTick) return null;
  if (b.y - GROUND_Y <= HITBOX_RADIUS) return "ground";
  for (const p of w.pipes) {
    if (Math.abs(p.x - BIRD_X) > PIPE_RADIUS + HITBOX_RADIUS) continue;
    const gapTop = p.gapCenter + p.gapHeight / 2;
    const gapBot = p.gapCenter - p.gapHeight / 2;
    const minx = p.x - PIPE_RADIUS, maxx = p.x + PIPE_RADIUS;
    const lowerHit = sphereHitsAabb(BIRD_X, b.y, 0, HITBOX_RADIUS, minx, GROUND_Y - 1, -PIPE_RADIUS, maxx, gapBot, PIPE_RADIUS);
    const upperHit = sphereHitsAabb(BIRD_X, b.y, 0, HITBOX_RADIUS, minx, gapTop, -PIPE_RADIUS, maxx, CEILING_TOP, PIPE_RADIUS);
    if (lowerHit || upperHit) return "pipe";
  }
  return null;
}
