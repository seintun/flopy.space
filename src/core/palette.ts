import { lerpHex } from "../utils/color";

export interface PaletteOut {
  skyTop: number;
  skyBottom: number;
  fogColor: number;
  sunAngle: number;
  starAlpha: number;
}

interface Stop {
  skyTop: number;
  skyBottom: number;
  fogColor: number;
  sunAngle: number;
  starAlpha: number;
}

const STOPS: Stop[] = [
  { skyTop: 0x2c3e6b, skyBottom: 0xffb347, fogColor: 0xd9a06b, sunAngle: -0.4, starAlpha: 0.25 }, // dawn (0)
  { skyTop: 0x3aa0ff, skyBottom: 0xbfe8ff, fogColor: 0xcfe8ff, sunAngle: 1.2, starAlpha: 0 },      // day (20)
  { skyTop: 0x1a2350, skyBottom: 0xff7e47, fogColor: 0xb06b8f, sunAngle: 2.8, starAlpha: 0.15 },   // dusk (40)
  { skyTop: 0x070b1e, skyBottom: 0x1c2b52, fogColor: 0x10182e, sunAngle: 4.2, starAlpha: 1 },      // night (60)
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dayNight(score: number): PaletteOut {
  const cycle = ((score % 80) + 80) % 80;
  const segment = cycle / 20;
  const idx = Math.floor(segment);
  const t = segment - idx;
  const s1 = STOPS[idx]!;
  const s2 = STOPS[(idx + 1) % STOPS.length]!;

  let targetAngle = s2.sunAngle;
  if (idx === STOPS.length - 1) {
    targetAngle = s2.sunAngle + Math.PI * 2;
  }
  const sunAngle = lerp(s1.sunAngle, targetAngle, t);

  return {
    skyTop: lerpHex(s1.skyTop, s2.skyTop, t),
    skyBottom: lerpHex(s1.skyBottom, s2.skyBottom, t),
    fogColor: lerpHex(s1.fogColor, s2.fogColor, t),
    sunAngle,
    starAlpha: lerp(s1.starAlpha, s2.starAlpha, t),
  };
}
