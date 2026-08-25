# Comprehensive Game-Feel, Audio & Retention Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate FLOPY.SPACE game-feel, procedural WebAudio synthesis, 120Hz juice performance, and behavioral retention loops into a premier, ultra-addictive arcade experience with zero audio clipping, zero memory leaks, species-specific voiceprints, pooled DOM popups, and frictionless restart UX.

**Architecture:** 
- **WebAudio Modernization**: Master `DynamicsCompressorNode` limiter, `onended` node auto-disconnection, species-specific voiceprint synthesis matrix (`flap`, `nearMiss`, `die`), distinct power-up SFX, octave-cascading coin arpeggios, and mobile lifecycle visibility listeners.
- **Juice & Visuals**: Pre-allocated DOM popup element pool (zero per-point allocations), rotational camera trauma roll (`camera.rotation.z`), managed border flash timers.
- **Dopamine & Retention UX**: Frictionless tap-to-skip countdowns, optional feather saving (eliminating forced rewind traps), animated score count-up tallies, and "Near-Record" spite/dopamine callout badges.

**Tech Stack:** TypeScript, WebAudio API, Three.js r174, Vitest, Vanilla DOM.

**Spec:** [`docs/superpowers/specs/2026-08-24-scale-shifters-and-kinetic-pipelines-spec.md`](file:///Users/seintun/code/sandbox/ox-alpha/docs/superpowers/specs/2026-08-24-scale-shifters-and-kinetic-pipelines-spec.md)

## Global Constraints
- Target 120Hz/60Hz smooth rendering with 0 GC spikes in the active loop.
- All WebAudio nodes must be disconnected on sound completion to prevent internal graph leaks.
- Master audio bus peak amplitude must never exceed 0 dBFS (enforced via `DynamicsCompressorNode`).
- Retain $100\%$ offline compatibility and PWA standalone performance.
- All tests must pass cleanly (`npm test` & `npm run build`).

---

### Task 1: WebAudio Architecture Modernization & Compressor Limiter

**Files:**
- Modify: `src/core/audio.ts`
- Test: `src/core/audio.test.ts` (create new test)

**Interfaces:**
- Produces: `AudioSys.unlock()`, `AudioSys.setMuted()`, `AudioSys.compressor`, `AudioSys.disposeTransientNode(osc, gain)`
- Connects master audio chain: `masterGain -> dynamicsCompressor -> ctx.destination`

- [ ] **Step 1: Write the failing unit tests for AudioSys**
Create `src/core/audio.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioSys } from "./audio";

describe("AudioSys Architecture & Safety", () => {
  it("initializes in muted/unmuted state cleanly without throwing in node/headless", () => {
    const audio = new AudioSys();
    expect(audio.isMuted()).toBe(false);
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
  });

  it("handles sound triggers safely when audio context is unavailable", () => {
    const audio = new AudioSys();
    expect(() => {
      audio.flap("cat");
      audio.nearMiss("neko");
      audio.die("dragon");
      audio.tokenChime(5);
      audio.chibiPickup();
      audio.chubbyPickup();
    }).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes**
Run: `npm test src/core/audio.test.ts`

- [ ] **Step 3: Update `src/core/audio.ts` with master compressor, node disconnection helper, and visibility listener**
```ts
// Inside AudioSys:
// Connect DynamicsCompressorNode before destination
this.compressor = this.ctx.createDynamicsCompressor();
this.compressor.threshold.setValueAtTime(-4, this.ctx.currentTime);
this.compressor.knee.setValueAtTime(4, this.ctx.currentTime);
this.compressor.ratio.setValueAtTime(16, this.ctx.currentTime);
this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

this.masterGain.connect(this.compressor);
this.compressor.connect(this.ctx.destination);
```
Add node auto-disconnect utility:
```ts
private registerNodeCleanup(source: AudioScheduledSourceNode, ...nodes: (AudioNode | undefined)[]): void {
  source.onended = () => {
    try {
      source.disconnect();
      nodes.forEach((n) => n?.disconnect());
    } catch {
      // already disconnected
    }
  };
}
```

- [ ] **Step 4: Run test to verify passes**
Run: `npm test src/core/audio.test.ts`

---

### Task 2: Species-Specific Hero SFX Matrix & Dedicated Power-Up Audio Palette

**Files:**
- Modify: `src/core/audio.ts`
- Modify: `src/core/characters.ts` (export `CharacterId` sound mapping if needed)
- Modify: `src/main.ts` (wire hero-specific death/near-miss and powerup audio)
- Test: `src/core/audio.test.ts`

**Interfaces:**
- Produces: 
  - `audio.nearMiss(charId: CharacterId): void`
  - `audio.die(charId: CharacterId): void`
  - `audio.chibiPickup(): void`
  - `audio.chubbyPickup(): void`
  - `audio.voidMineHit(): void`
  - `audio.gravitySinkHit(): void`
  - `audio.tokenChime(streak: number): void` (octave-cascading pentatonic)

- [ ] **Step 1: Write tests for hero SFX & powerup audio methods**
Update `src/core/audio.test.ts` to test all new sound triggers.

- [ ] **Step 2: Implement hero voiceprints in `src/core/audio.ts`**
- `die(charId)`:
  - `neko`: sad meow slide down ($450 \to 120\text{Hz}$)
  - `shiba`: playful cartoon whine/yelp ($380 \to 180\text{Hz}$)
  - `dragon`: low bass ember growl + puff ($180 \to 60\text{Hz}$)
  - `hamster`: spring boing slide ($900 \to 300\text{Hz}$)
  - `bird`: retro 8-bit noise fizzle
- `nearMiss(charId)`:
  - Sub-bass whoosh + species reaction chirp (Neko purr-squeak, Shiba boof, Dragon hiss, Hammy squeal).
- `chibiPickup()`: High-frequency sparkling chime arpeggio ($1046 \to 1318 \to 1567 \to 2093\text{Hz}$).
- `chubbyPickup()`: Comical slide whistle up ($220 \to 580\text{Hz}$) + sub-bass thud ($65\text{Hz}$).
- `tokenChime(streak)`: Pentatonic arpeggio that ascends cleanly across octaves ($C_5 \dots C_6 \dots G_6$) with harmonic overtone ring.

- [ ] **Step 3: Wire new SFX into `src/main.ts`**
Wire `onPass` near-miss, `onHit`, `onOrbCollect`, and `onTokenCollect`.

- [ ] **Step 4: Run tests**
Run: `npm test`

---

### Task 3: Zero-Allocation DOM Popup Pool & 3D Camera Rotational Trauma

**Files:**
- Modify: `src/systems/juice.ts`
- Modify: `src/render/camera.ts`
- Modify: `src/core/game.ts`
- Test: `src/systems/juice.test.ts` (create new test)

**Interfaces:**
- Produces: `Juice.popupAtWorld()`, `Juice.addTrauma()`, `Juice.flashBorder()`
- Rotational trauma roll: `camera.rotation.z` perturbation on impact.

- [ ] **Step 1: Write test for Juice DOM pooling & camera shake**
Create `src/systems/juice.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Juice } from "./juice";

describe("Juice System", () => {
  it("initializes without errors and updates trauma decay smoothly", () => {
    const juice = new Juice();
    expect(juice.trauma).toBe(0);
    juice.addTrauma(0.5);
    expect(juice.trauma).toBe(0.5);
    const shake = juice.update(0.1);
    expect(shake.ox).toBeDefined();
    expect(shake.oy).toBeDefined();
    expect(shake.rot).toBeDefined();
    expect(juice.trauma).toBeLessThan(0.5);
  });
});
```

- [ ] **Step 2: Implement DOM popup recycling pool in `src/systems/juice.ts`**
Pre-allocate a pool of 12 DOM elements for floating text popups (`+1`, `+5 GEM!`, `+3 🪙`, `🐥 CHIBI NANO!`). Recycle oldest element when pool is saturated. Zero `document.createElement("div")` in the gameplay tick!

- [ ] **Step 3: Add rotational camera trauma roll in `src/systems/juice.ts` and `src/render/camera.ts`**
Add `rot` (roll angle) to shake output and apply to `camera.rotation.z`.

- [ ] **Step 4: Run tests**
Run: `npm test src/systems/juice.test.ts`

---

### Task 4: Transparent Rewind UX & Frictionless Retry Loop

**Files:**
- Modify: `src/ui/hud.ts`
- Modify: `src/ui/gameover.ts`
- Modify: `src/core/game.ts`
- Test: `src/ui/hud.test.ts`

**Interfaces:**
- Produces: 
  - `GameOverView.show()` with rolling integer tally & Near-Record psychological callout
  - `HudApi.showRewindPrompt()` preserving `giveUpBtn` ("Save Feather / End Run")
  - Fast tap-to-skip countdown on retry

- [ ] **Step 1: Write unit tests for HUD rewind prompt and GameOver near-record badge logic**
Verify `giveUpBtn` is always accessible when feathers $> 0$.

- [ ] **Step 2: Update `src/ui/hud.ts` to allow saving feathers**
Ensure `giveUpBtn` is always visible alongside `rewindBtn` so player is never forced to spend feathers if they prefer to end a low-scoring run.

- [ ] **Step 3: Update `src/ui/gameover.ts` with rolling integer tally and Near-Record badges**
- Add integer lerp animation ($0 \to \text{final score}$ in $400\text{ms}$) with tick audio.
- Add dynamic callout:
  - If `score >= best`: `👑 NEW PERSONAL BEST RECORD!`
  - If `best - score <= 8` and `score > 5`: `🔥 SO CLOSE! Only ${best - score} pipes from New Best Record!`
  - If `tokensRunCollected >= 10`: `🪙 GOLD RUSH! +${tokensRunCollected} Coins Banked`

- [ ] **Step 4: Enable tap-to-skip countdown in `src/core/game.ts` / `src/main.ts`**
Tapping during `countdown` state skips remaining timer and immediately transitions to `playing` with a flap impulse.

- [ ] **Step 5: Run tests**
Run: `npm test`

---

### Task 5: Full Integration Verification & Spec Self-Review

**Files:**
- Verify: All test files
- Build: `npm run build`

- [ ] **Step 1: Run complete test suite**
Run: `npm test`

- [ ] **Step 2: Run production typecheck and build**
Run: `npm run build`

- [ ] **Step 3: Review spec coverage and document changes**
Update `walkthrough.md` with verification results.
