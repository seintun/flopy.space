import {
  GRAVITY, FLAP_VELOCITY, TERMINAL_VY, CEILING_Y, HITBOX_RADIUS, PITCH_SMOOTHING,
} from "./constants";
import type { World } from "./types";

export function flap(w: World): void {
  if (!w.bird.alive) return;
  w.bird.vy = FLAP_VELOCITY;
}

export function stepBird(w: World, dt: number): void {
  const b = w.bird;
  b.vy = Math.max(TERMINAL_VY, b.vy + GRAVITY * dt);
  b.y += b.vy * dt;
  if (b.y > CEILING_Y - HITBOX_RADIUS) b.y = CEILING_Y - HITBOX_RADIUS;
  // target pitch: +25deg rising, easing to -90deg at terminal dive
  const frac = Math.min(1, Math.max(0, -b.vy / -TERMINAL_VY));
  const targetDeg = b.vy >= 0 ? 25 : -(90 * frac);
  const k = Math.min(1, PITCH_SMOOTHING * dt);
  b.pitch += (targetDeg - b.pitch) * k;
}
