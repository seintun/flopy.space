# Production Readiness, Agent Indexing & Architectural Decoupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perform an AAA-tier production scan, create index-ready `AGENTS.md` and `GEMINI.md` (with `CLAUDE.md` symlink), decouple monolithic game/UI logic, resolve all security/DOM vulnerabilities, eliminate 120Hz GC pauses, cut input latency, and optimize bundle footprint.

**Architecture:** Unidirectional deterministic game architecture separating headless 120Hz physics simulation from Three.js WebGL rendering, procedural WebAudio synthesis, and responsive DOM overlays. Extract duplicate UI flyouts and token/power-up resolution logic into reusable pure modules, harden security (XSS/CSP/storage schemas), fix frame pacing with sub-frame alpha interpolation, and provide structured agent-indexing documentation at repository root.

**Tech Stack:** TypeScript (ES2022), Three.js (r174), WebAudio API, WebGL, Service Worker (PWA), Vitest, Vite 6, Playwright.

**Spec:** [ARCHITECTURE.md](file:///Users/seintun/code/sandbox/ox-alpha/ARCHITECTURE.md), [README.md](file:///Users/seintun/code/sandbox/ox-alpha/README.md), and [Research Synthesis](file:///Users/seintun/.gemini/antigravity/brain/9f95b496-7456-41a2-a02e-b21138dfb2dc/research_synthesis.md)

## Global Constraints

- Zero runtime heap allocation during active 120Hz physics and rendering tick.
- 100% offline capability via Service Worker cache-first asset strategy with zero external network dependencies for audio or graphics.
- 0ms touch input latency on mobile devices via pointerdown gesture capture and passive event suppression.
- Strict cross-platform determinism via integer tick simulation time ($t = \text{tick} \times \Delta t_{\text{fixed}}$).
- All tests must pass with 0 warnings in Vitest.

---

### Task 1: Create Comprehensive `AGENTS.md`, `GEMINI.md` and `CLAUDE.md` Symlink

**Files:**
- Create: `AGENTS.md`
- Create: `GEMINI.md`
- Create: `CLAUDE.md` (Symlink to `AGENTS.md`)
- Test: `tests/indexing.test.ts`

**Interfaces:**
- Consumes: Project architecture specifications, directory topologies, research audit synthesis.
- Produces: Machine-readable agent guidelines, codebase index, architectural maps, performance constraints, and testing commands.

- [x] **Step 1: Write failing indexing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Create AGENTS.md, GEMINI.md, and symlink CLAUDE.md**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 2: Refactor UI Flyout & Deduction Helpers into Decoupled UI Utilities

**Files:**
- Create: `src/ui/uiEffects.ts`
- Modify: `src/ui/menu.ts:36-65`
- Modify: `src/ui/gameover.ts:25-55`
- Test: `src/ui/uiEffects.test.ts`

**Interfaces:**
- Consumes: `HTMLElement`, number cost amount.
- Produces: `showDeductionFlyout(targetEl: HTMLElement, cost: number): void` with automated DOM animation and GC cleanup.

- [x] **Step 1: Write unit test for UI effects**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/ui/uiEffects.ts` and import in `menu.ts` & `gameover.ts`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 3: Decouple In-Flight Token & Magnetic Physics into Pure Headless Helpers

**Files:**
- Create: `src/core/tokens.ts`
- Modify: `src/core/game.ts:537-570`
- Test: `src/core/tokens.test.ts`

**Interfaces:**
- Consumes: `InFlightToken[]`, `birdY: number`, `dt: number`, `hasMagnet: boolean`, `magnetRadius: number`, `isChubby: boolean`.
- Produces: `updateInFlightTokens(tokens: InFlightToken[], birdY: number, dt: number, hasMagnet: boolean, magnetRadius: number, isChubby: boolean): { collectedVal: number; collectedCount: number }`.

- [x] **Step 1: Write unit tests for in-flight tokens physics**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/core/tokens.ts` and integrate into `src/core/game.ts`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 4: Security Hardening (XSS, Storage Schema Typeguards, Strict CSP)

**Files:**
- Modify: `src/core/storage.ts`
- Modify: `src/systems/juice.ts`
- Modify: `src/ui/menu.ts`
- Modify: `src/main.ts`
- Modify: `vercel.json`
- Test: `src/core/storage.test.ts`

**Interfaces:**
- Consumes: Untrusted storage JSON, dynamic HUD text.
- Produces: Sanitized DOM manipulation, type-safe parse guards, strict HTTP security headers.

- [x] **Step 1: Write unit tests for storage corruption resilience**
- [x] **Step 2: Run test to check failure/pass**
- [x] **Step 3: Implement `safeParseArray` in `storage.ts`, use `textContent` in `juice.ts` & `menu.ts`, gate `__FLOPY_GAME__` behind `DEV`, add CSP to `vercel.json`**
- [x] **Step 4: Run test to verify all pass**
- [x] **Step 5: Commit changes**

---

### Task 5: Mobile Zero-Latency Touch, Sub-Frame Alpha & PWA Cache-First

**Files:**
- Modify: `src/core/input.ts`
- Modify: `src/entities/characterView.ts`
- Modify: `src/style.css`
- Modify: `public/sw.js`
- Test: `src/core/offline.test.ts`

**Interfaces:**
- Consumes: Touch/pointer input gestures, fixed-tick alpha values.
- Produces: 0ms tap reaction, smooth 90Hz/144Hz sub-frame interpolation, bulletproof offline PWA navigation.

- [x] **Step 1: Update input and offline tests**
- [x] **Step 2: Implement precision `isInteractive` check, `touch-action: manipulation`, sub-frame alpha interpolation in `CharacterView`, and Network-First navigation SW strategy**
- [x] **Step 3: Run test suite**
- [x] **Step 4: Run build**
- [x] **Step 5: Commit changes**

---

### Task 6: Final Verification & Integration

**Files:**
- Test: Full Vitest suite (`npm test`)
- Test: Production Build (`npm run build`)

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run production build**
- [x] **Step 3: Commit final verification**
