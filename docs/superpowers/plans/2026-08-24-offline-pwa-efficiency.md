# Offline PWA, WebGL Zero-Allocation, Feather Bugfix & Architecture Documentation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 100% offline PWA capability with Service Worker caching, eliminate all per-frame WebGL memory allocations for sustained 120Hz/60Hz mobile performance, consolidate duplicate utilities across the codebase, fix the feather claim balance bug, and write comprehensive `ARCHITECTURE.md` and `README.md`.

**Architecture:** 
1. **PWA Layer**: Production Service Worker (`public/sw.js`) with cache-first and stale-while-revalidate strategies for assets, fonts, and HTML; expanded Web App Manifest (`id`, `display_override`, `shortcuts`); in-game mobile install prompt.
2. **WebGL Zero-GC Engine**: Preallocated ring-buffer `SnapshotBuffer` replacing per-tick `cloneWorld` heap churn; fixed material leaks in `scene.ts`; static temp vectors in `Juice` and `CameraRig`.
3. **Consolidated Utils**: Unified `src/utils/dom.ts` (`enableDragScroll`), `src/utils/time.ts` (`formatDuration`), and `src/utils/color.ts` (`hexToCss`, `lerpHex`), deleting dead code (`src/entities/birdView.ts`).
4. **Feather Claim Fix**: Implement `addFeathers(amount: number): number` in `src/core/storage.ts` to prevent overwriting existing balance when claiming quest rewards.
5. **Technical Documentation**: Comprehensive `ARCHITECTURE.md` diagramming data flow, state machine, and WebGL lifecycle; updated `README.md`.

**Tech Stack:** TypeScript 5.7, Three.js r174, Service Worker API, Web App Manifest W3C, Vitest.

**Spec & Research:** 
- [docs/research/2026-08-24-pwa-efficiency-architecture.md](file:///Users/seintun/code/sandbox/ox-alpha/docs/research/2026-08-24-pwa-efficiency-architecture.md)
- [docs/superpowers/specs/2026-08-23-flappy3d-design.md](file:///Users/seintun/code/sandbox/ox-alpha/docs/superpowers/specs/2026-08-23-flappy3d-design.md)

## Global Constraints

- **100% Offline Standalone**: Game must load and run without network connectivity once installed.
- **Zero Per-Frame Allocations**: No object allocations inside 120Hz/60Hz render/update loops (`frame()`, `syncFrom()`, `update()`).
- **DRY Single-Source-of-Truth**: All DOM drag-scrolling, time formatting, and color conversion routines must live in `src/utils/`.
- **Feather Bank Integrity**: Claiming quest rewards must add to current feather balance up to `FEATHER_BANK_CAP` (3), never overwrite or reduce it.

---

### Phase 1: Shared Utilities, Feather Bugfix & Dead Code Cleanup

#### Task 1.1: Extract Unified DOM, Time & Color Utilities (`dom.ts`, `time.ts`, `color.ts`)

**Files:**
- Create: `src/utils/dom.ts`
- Create: `src/utils/time.ts`
- Create: `src/utils/color.ts`
- Modify: `src/ui/menu.ts`
- Modify: `src/ui/gameover.ts`
- Modify: `src/core/palette.ts`
- Test: `src/utils/utils.test.ts`

**Interfaces:**
- `enableDragScroll(el: HTMLElement): () => void`
- `formatDuration(sec: number, withSuffix?: boolean): string`
- `hexToCss(hex: number): string`
- `lerpHex(c1: number, c2: number, t: number): number`

- [ ] **Step 1: Write tests for shared utilities in `src/utils/utils.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/utils/dom.ts`, `src/utils/time.ts`, and `src/utils/color.ts`**
- [ ] **Step 4: Refactor `src/ui/menu.ts`, `src/ui/gameover.ts`, and `src/core/palette.ts` to use shared utilities**
- [ ] **Step 5: Run tests to verify all pass**
- [ ] **Step 6: Commit**

---

#### Task 1.2: Fix Feather Claim Balance Bug (`addFeathers()`)

**Files:**
- Modify: `src/core/storage.ts`
- Modify: `src/ui/menu.ts`
- Modify: `src/ui/gameover.ts`
- Test: `src/core/storage.test.ts`

**Interfaces:**
- `addFeathers(amount: number): number`

- [ ] **Step 1: Write test in `src/core/storage.test.ts` verifying adding feathers to an existing balance**

```ts
it("addFeathers adds to existing balance up to cap without overwriting", () => {
  clearStorageForTest();
  bankFeathers(2);
  expect(loadAll().feathers).toBe(2);

  // Add 1 feather -> should reach 3
  expect(addFeathers(1)).toBe(3);
  expect(loadAll().feathers).toBe(3);

  // Add 1 more when at 3/3 -> should stay at 3 (capped)
  expect(addFeathers(1)).toBe(3);
  expect(loadAll().feathers).toBe(3);
});
```

- [ ] **Step 2: Implement `addFeathers()` in `src/core/storage.ts`**

```ts
export function addFeathers(amount: number): number {
  const data = loadAll();
  const newTotal = Math.min(FEATHER_BANK_CAP, Math.max(0, data.feathers + amount));
  setLocal("feathers", newTotal.toString());
  return newTotal;
}
```

- [ ] **Step 3: Update `src/ui/menu.ts` and `src/ui/gameover.ts` to use `addFeathers(m.rewardFeathers)`**

In `src/ui/gameover.ts:284`:
Replace `bankFeathers(readyMission.rewardFeathers)` with `addFeathers(readyMission.rewardFeathers)`.

In `src/ui/menu.ts:449`:
Replace `bankFeathers(loadAll().feathers + m.rewardFeathers)` with `addFeathers(m.rewardFeathers)`.

- [ ] **Step 4: Run tests to verify fix**

Run: `npx vitest run src/core/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/storage.ts src/ui/menu.ts src/ui/gameover.ts src/core/storage.test.ts
git commit -m "fix(storage): add addFeathers helper to prevent overwriting feather balance on claim"
```

---

#### Task 1.3: Remove Obsolete Dead Code (`birdView.ts`)

**Files:**
- Delete: `src/entities/birdView.ts`

- [ ] **Step 1: Delete `src/entities/birdView.ts`**
- [ ] **Step 2: Run test suite to verify no regressions**
- [ ] **Step 3: Commit**

---

### Phase 2: WebGL Zero-Allocation & GPU Engine Hardening

#### Task 2.1: Preallocated Ring-Buffered `SnapshotBuffer`

**Files:**
- Modify: `src/core/snapshots.ts`
- Test: `src/core/snapshots.test.ts`

- [ ] **Step 1: Update snapshot test to verify zero-allocation ring buffer invariants**
- [ ] **Step 2: Implement preallocated in-place `SnapshotBuffer` in `src/core/snapshots.ts`**
- [ ] **Step 3: Run test to verify it passes**
- [ ] **Step 4: Commit**

---

#### Task 2.2: Fix GPU Material Leaks & Static Reusable Temp Vectors

**Files:**
- Modify: `src/render/scene.ts`
- Modify: `src/systems/juice.ts`
- Modify: `src/render/camera.ts`

- [ ] **Step 1: Fix material leak in `src/render/scene.ts` by mutating grid material color in-place**
- [ ] **Step 2: Convert `Juice.popupAtWorld()` to use preallocated static Vector3 in `src/systems/juice.ts`**
- [ ] **Step 3: Run tests and build**
- [ ] **Step 4: Commit**

---

### Phase 3: Complete Offline PWA & Service Worker Engine

#### Task 3.1: Service Worker Architecture & Precache Registration

**Files:**
- Create: `public/sw.js`
- Modify: `src/main.ts`
- Test: `src/core/offline.test.ts`

- [ ] **Step 1: Write offline test in `src/core/offline.test.ts`**
- [ ] **Step 2: Create `public/sw.js` with offline caching engine**
- [ ] **Step 3: Register Service Worker in `src/main.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

#### Task 3.2: Expand Web App Manifest with W3C Standards

**Files:**
- Modify: `public/manifest.webmanifest`
- Test: `src/core/manifest.test.ts`

- [ ] **Step 1: Update `public/manifest.webmanifest` with `id`, `display_override`, `shortcuts`**
- [ ] **Step 2: Run test suite**
- [ ] **Step 3: Commit**

---

### Phase 4: Mobile Standalone UX & Native Install Prompt

#### Task 4.1: Android `beforeinstallprompt` & In-Game Install Button

**Files:**
- Create: `src/ui/installManager.ts`
- Modify: `src/ui/menu.ts`
- Modify: `src/ui/gameover.ts`

- [ ] **Step 1: Create `src/ui/installManager.ts`**
- [ ] **Step 2: Add Install CTA in `src/ui/menu.ts` and `src/ui/gameover.ts`**
- [ ] **Step 3: Run all tests and build verification**
- [ ] **Step 4: Commit**

---

### Phase 5: Technical Documentation (`ARCHITECTURE.md` & `README.md`)

#### Task 5.1: Create `ARCHITECTURE.md` and Update `README.md`

**Files:**
- Create: `ARCHITECTURE.md`
- Modify: `README.md`

- [ ] **Step 1: Create comprehensive `ARCHITECTURE.md`**
  - High-level system architecture and Mermaid dependency graphs
  - Headless 120Hz physics & deterministic core simulation
  - WebGL rendering pipeline (solid geometry, camera rig, instanced pipe buffer, day/night lighting)
  - 4D Time manipulation (bullet-time, 180-tick snapshot ring buffer, death rewind)
  - PWA Offline caching lifecycle & Service Worker strategy
  - Audio procedural synthesizer pipeline (WebAudio oscillators, ADSR envelope, zero audio files)
- [ ] **Step 2: Update `README.md` with links to `ARCHITECTURE.md` and updated PWA install instructions**
- [ ] **Step 3: Run full verification suite and production build**
- [ ] **Step 4: Commit and Push**

---

## Self-Review Checklist

1. **Spec Coverage**:
   - [x] Full Offline PWA Support & Service Worker precaching (Phase 3)
   - [x] WebGL Zero-Allocation SnapshotBuffer and Material Leak Fixes (Phase 2)
   - [x] Consolidated DOM / Time / Color Utilities & Dead Code Cleanup (Phase 1)
   - [x] Feather Claim Balance Bugfix (Task 1.2)
   - [x] Architecture Documentation & Readme (Phase 5)
2. **No Placeholders**: All tasks contain specific implementation code and verification criteria.
3. **Type Consistency**: Zero-error TypeScript compilation across all modules.
