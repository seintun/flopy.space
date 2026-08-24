# Flappy3D Design Spec

Date: 2026-08-23
Status: Approved (brainstorm complete, user approved all sections)

## Overview

A mobile-first, portrait-oriented 3D flappy bird game for the browser. The player taps anywhere to flap a bird through procedural pipe gaps in a stylized-realistic 3D world. The signature twist is a time dimension: slow-motion powerups, a death-rewind mechanic, and a continuous day/night cycle. An addiction loop of combo multipliers, near-miss bonuses, feather tokens, and unlockable skins drives retention. All state is local (localStorage); there is no backend.

## Platform

- Browser game, desktop + mobile, **mobile portrait is the priority target**.
- Whole screen is the tap target (`pointerdown`, no click delay). Keyboard Space is a desktop fallback.
- Performance budget: pixelRatio ≤ 2, ≤ 60k triangles, particle pool ≤ 200, no post-processing pipeline. Target 60fps on a mid-range phone.
- Optional PWA manifest so the game installs to a home screen.

## Tech Stack

- Vite + TypeScript (strict mode)
- Three.js for rendering (the only runtime dependency)
- Vitest for logic tests
- WebAudio API for fully procedural sound (zero audio asset downloads)
- localStorage for persistence

## 1. Gameplay & Physics

All units are world units and seconds. Physics runs at a fixed timestep of `DT = 1/120` using an accumulator; the renderer interpolates with `alpha = acc / DT`.

| Constant | Value | Meaning |
|---|---|---|
| GRAVITY | −22 u/s² | Downward acceleration |
| FLAP_VELOCITY | +7.5 u/s | Instant velocity set on flap (impulse, not acceleration) |
| TERMINAL_VY | −14 u/s | Fall speed clamp |
| BIRD_VISUAL_RADIUS / HITBOX_RADIUS | 0.45 / 0.3825 | Hitbox is 85% of visual size (forgiving) |
| GROUND_Y / CEILING_Y | −6 / 8 | Play band; ceiling clamps position without death |
| PIPE_RADIUS | 0.9 | Pipe cylinder radius (AABB half-extent on x/z) |
| PIPE_SPACING_DIST | 11 u | Distance between pipe spawns (distance-based, not time-based) |
| GAP_START → GAP_MIN | 4.5 → 2.8 u | Gap height shrinks linearly, reaching minimum at score 40 |
| GAP_WANDER_MAX | 1.5 u | Max center jump between consecutive gaps (never impossible) |
| BASE_SCROLL → MAX_SCROLL | 6 → 12 u/s | Scroll speed ramps +0.15 per point |
| NEAR_MISS_MARGIN | 0.3 u | Near-miss threshold from gap edge |

- Bird pitch lerps toward the velocity angle: −25° when rising, easing to −90° at terminal dive; smoothing factor 8/s.
- Collision: sphere-vs-AABB against upper/lower pipe boxes plus ground plane. Invulnerable ticks skip collision.
- Pipes are recycled through an object pool (~10 live max). First pipe spawns after a ~3s grace distance.
- Randomness uses a serializable LCG seeded per-run (`worldRand`) so snapshots/rewind are deterministic.

## 2. Time Dimension ("4D")

One `TimeSystem` module owns a single `timeScale`; every per-frame delta flows through it.

1. **Bullet-time orbs**: clock orbs spawn every 8–12 pipes between gaps. Collecting one eases `timeScale` to 0.35 over 0.15s, holds 3s of real time, eases back to 1.0. Player input remains full-rate — slow-mo feels like a superpower. HUD shows a draining meter.
2. **Death rewind**: on collision, 60ms hitstop freeze, then the last 1.5s replays backward as a ghost trail. A choice screen offers Rewind (costs 1 feather token, max 3 per run, earned every 10 points) or Accept Death. Implementation: ring buffer of 180 world snapshots recorded each tick; rewind restores the oldest snapshot and grants ~1s invulnerability shimmer.
3. **Day/night cycle**: sky palette shifts continuously across dawn→day→dusk→night every 20 points (full cycle = 80 points), driving background gradient dome, sun/moon light angle, star fade-in. Purely visual progression telegraph. Palette math is a pure, tested function of score.

## 3. Juice & Addiction Loop

- **Game feel**: flap wing-snap + FOV kick (60→64° decay) + feather puff + whoosh; score chime pitch rises with combo; near-miss "CLOSE!" popup + bonus + 80ms micro slow-mo flash; death = hitstop → shake (trauma-based Perlin offset, never nausea-inducing) → feather explosion; milestone celebration every 10 points.
- **Progression** (all localStorage, keys prefixed `f3d.`): best score, best-today streak counter (consecutive days played), combo multiplier ×1→×5 (broken only by death; near-misses bump faster: +2 vs +1), feather token balance persisting between runs (cap 9), bird skins unlocked at best-score milestones 0/15/30/50 (material/color swaps only).

## 4. Architecture

Hand-rolled fixed-timestep engine under Three.js views. Pure logic modules live in `src/core/**` and must not import `three` (meshes are views over mutable `World` state).

```
main.ts            bootstrap, resize, loop kick
core/game.ts       state machine MENU→PLAYING→HITSTOP→REWIND_REPLAY→REWIND_CHOICE→GAME_OVER
core/loop.ts       fixed-timestep accumulator honoring time.frozen
core/time.ts       timeScale authority + snapshot-freeze (hitstop)
core/snapshots.ts  180-slot ring buffer record/rewind
core/input.ts      pointerdown + Space → flap callback
core/audio.ts      WebAudio synth SFX
core/storage.ts    localStorage wrapper (f3d.* keys)
core/rand.ts       LCG worldRand(w) + mulberry32 for tests
entities/*View.ts  bird, pipes, orbs mesh views synced from World
systems/juice.ts   shake trauma, FOV kick, particle pool, popups
render/*           scene lights/fog, sky gradient dome + day/night, chase camera rig
ui/hud.ts          DOM overlay (score, combo badge, feathers, meter, buttons)
```

Loop contract: accumulate real dt × `time.scale`; run zero or more fixed steps; render once with interpolation alpha. When `time.frozen`, skip stepping but keep rendering.

## Testing Strategy

- Vitest unit tests for all pure logic: physics trajectory vs analytic arc, difficulty curve boundaries + monotonicity, spawner property test (consecutive gap delta ≤ 1.5 over 10k seeds; gap always fits play band), collision edge cases, scoring/combo/feather cadence, TimeSystem easing/hitstop, SnapshotBuffer round-trip equality, palette stops + wraparound, storage schema.
- View/juice/render tasks are verified by build + typecheck + a manual QA checklist (per-task harness notes included in plan).
- Final gate: full suite green, production build passes, manual QA checklist (60fps scroll, notch safe areas, double-tap zoom dead, audio-after-gesture, rewind edge cases).

## Non-goals

No backend, no online leaderboards, no accounts, no post-processing chain, no asset pipeline (all geometry/materials procedural).
