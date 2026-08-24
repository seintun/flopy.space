# Spendable Token Currency Economy & Interleaved Unlock Progression Ladder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a persistent spendable **🪙 Token Economy** where run scores deposit 1:1 into player vaults, paired with an **Interleaved Multiplier Unlock Progression Ladder** (11 unique milestones alternating Hero $\to$ Skin $\to$ Scene) and animated floating `-XX 🪙` deduction juice upon claiming.

**Architecture:** Extend `src/core/storage.ts` with `tokens` & `lifetimeTokens` and atomic `spendTokens()` / `addTokens()` mutations. Rebalance `CHARACTERS`, `BIOMES`, `SKINS`, and `getNextGoal` to the 11-step escalating price curve. Update `src/ui/hud.ts`, `src/ui/menu.ts`, and `src/ui/gameover.ts` with real-time token telemetry, goal progress fill bars, and animated floating deduction VFX.

**Tech Stack:** TypeScript, Three.js, WebAudio API, LocalStorage, Vitest, Playwright.

**Spec:** [`docs/superpowers/specs/2026-08-24-token-economy-and-unlock-ladder-design.md`](file:///Users/seintun/code/sandbox/ox-alpha/docs/superpowers/specs/2026-08-24-token-economy-and-unlock-ladder-design.md)

## Global Constraints
- `f3d.tokens` and `f3d.lifetimeTokens` stored in `localStorage` with fallback to in-memory store.
- Zero milestone collisions: no two items across any category share an unlock price.
- 100% deterministic, zero runtime memory leaks or frame drops during floating deduction VFX.

---

### Task 1: Core Token Storage & Atomic Ledger
**Files:**
- Modify: [`src/core/storage.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/storage.ts)
- Test: [`src/core/storage.test.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/storage.test.ts)

**Interfaces:**
- Produces:
  - `addTokens(amount: number): number`
  - `spendTokens(amount: number): boolean`
  - `getStoredTokens(): number`

- [ ] **Step 1: Write failing tests for token storage and spending in `src/core/storage.test.ts`**
- [ ] **Step 2: Run `npm test src/core/storage.test.ts` to verify failure**
- [ ] **Step 3: Implement `tokens`, `lifetimeTokens`, `addTokens`, and `spendTokens` in `src/core/storage.ts`**
- [ ] **Step 4: Run `npm test src/core/storage.test.ts` to verify pass**
- [ ] **Step 5: Commit changes (`feat: add persistent token currency storage and atomic spend methods`)**

---

### Task 2: Interleaved Multiplier Unlock Pricing & Eligibility Logic
**Files:**
- Modify: [`src/core/characters.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/characters.ts)
- Modify: [`src/core/biomes.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/biomes.ts)
- Modify: [`src/core/storage.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/storage.ts)
- Modify: [`src/core/goals.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/goals.ts)
- Test: [`src/core/characters.test.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/characters.test.ts)
- Test: [`src/core/goals.test.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/goals.test.ts)

**Interfaces:**
- Produces:
  - Interleaved unlock ladder: Neko (25), Sakura (50), Cyber (75), Doge (110), Obsidian (160), Candy (220), Hammy (300), Cosmic (400), Magma (520), Dragon (660), Prism (820).
  - `isCharacterClaimable(charId, tokens, unlockedChars): boolean`
  - `isSkinClaimable(skinId, tokens, unlockedSkins): boolean`
  - `isBiomeClaimable(biomeId, tokens, unlockedBiomes): boolean`
  - `getNextGoal(tokens: number, data: SaveData)`

- [ ] **Step 1: Write unit tests for interleaved pricing and claimability against token balances**
- [ ] **Step 2: Update `CHARACTERS`, `BIOMES`, `SKINS` pricing and claim helpers in core modules**
- [ ] **Step 3: Update `getNextGoal` in `src/core/goals.ts` to track next unowned item on the token ladder**
- [ ] **Step 4: Run unit tests across `characters.test.ts`, `goals.test.ts`, `storage.test.ts` to verify pass**
- [ ] **Step 5: Commit changes (`feat: implement interleaved multiplier unlock ladder across heroes, scenes, and skins`)**

---

### Task 3: Run Completion Token Accrual Engine
**Files:**
- Modify: [`src/main.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/main.ts)
- Modify: [`src/core/game.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/game.ts)
- Test: [`src/core/automation.test.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/core/automation.test.ts)

**Interfaces:**
- Consumes: `addTokens(score)` from `src/core/storage.ts`
- Produces: Live token balance telemetry on run completion

- [ ] **Step 1: Write test for run score to token conversion in `src/core/automation.test.ts`**
- [ ] **Step 2: Wire token deposit upon `gameOver` in `src/main.ts` and update telemetry hooks**
- [ ] **Step 3: Run `npm test src/core/automation.test.ts` to verify pass**
- [ ] **Step 4: Commit changes (`feat: deposit run score as spendable tokens upon game over`)**

---

### Task 4: In-Game HUD Telemetry & Menu Drawer Store UI
**Files:**
- Modify: [`src/ui/hud.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/ui/hud.ts)
- Modify: [`src/ui/menu.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/ui/menu.ts)

**Interfaces:**
- Produces:
  - `hud.setTokens(tokens: number)`
  - Real-time token counter badge in top-right HUD: `[ 🪙 124 ] [ 🪶 2/3 ]`
  - Menu header token count and drawer card claim buttons: `CLAIM 25 🪙 🎁`

- [ ] **Step 1: Add token counter pill to `#hud-right` in `src/ui/hud.ts`**
- [ ] **Step 2: Add token counter to `#menu-header` and update drawer item cards in `src/ui/menu.ts`**
- [ ] **Step 3: Update `🎯 Next` goal pill to display next unowned item and token progress bar**
- [ ] **Step 4: Verify build and unit tests with `npm test`**
- [ ] **Step 5: Commit changes (`feat: add token telemetry to in-game HUD and menu drawer`)**

---

### Task 5: Post-Run Game Over Redemption & Animated Floating Deduction VFX
**Files:**
- Modify: [`src/ui/gameover.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/ui/gameover.ts)
- Modify: [`src/main.ts`](file:///Users/seintun/code/sandbox/ox-alpha/src/main.ts)
- Modify: [`tests/gameplay_automation.mjs`](file:///Users/seintun/code/sandbox/ox-alpha/tests/gameplay_automation.mjs)

**Interfaces:**
- Produces:
  - Floating `-XX 🪙` text animation upon item purchase
  - Immediate balance refresh across all screens
  - Playwright E2E verification of token flow

- [ ] **Step 1: Add floating `-XX 🪙` deduction animation helper in `src/ui/gameover.ts` and `src/ui/menu.ts`**
- [ ] **Step 2: Wire token deduction upon clicking `CLAIM XX 🪙 🎁` on Game Over banner and quick-swap**
- [ ] **Step 3: Update Playwright automation script to verify token display and purchase flow**
- [ ] **Step 4: Run full verification suite: `npm test && npm run build && npm run test:e2e`**
- [ ] **Step 5: Commit changes (`feat: add celebratory token deduction animation and post-run claim flow`)**

---

## Verification Plan

### Automated Tests
- `npm test`: Run all 24 unit test suites (100+ tests) including new token ledger and pricing assertions.
- `npm run build`: Confirm 0 TypeScript compiler errors.
- `npm run test:e2e`: Headless Chrome Playwright automation testing flight, spacebar, collision, token accrual, and claim UI.

### Manual Verification
- Verify top-right HUD shows `[ 🪙 0 ]` on start and updates after scoring.
- Verify `HEROES`, `SCENES`, `SKINS` display prices on the interleaved ladder.
- Verify claiming an item deducts the exact token amount and floats `-XX 🪙` with celebratory particle effects.
