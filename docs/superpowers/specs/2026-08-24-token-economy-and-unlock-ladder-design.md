# Technical Design: Spendable Token Currency & Interleaved Unlock Progression Ladder

## Overview
This specification details the architecture and implementation for transitioning flopy.space from a raw score-gated auto-unlock system to a **Spendable Token Currency Economy** with an **Interleaved Multiplier Unlock Progression Ladder**.

Players accumulate spendable **🪙 Tokens** from run performance (1 score = 1 token). Tokens are deposited into a persistent vault and used to strategically purchase and unlock Heroes, Scenes (Worlds), and Skins.

---

## 1. Interleaved Multiplier Unlock Ladder

To prevent milestone collisions (unlocking two items simultaneously), all 11 unlockable items across categories are interleaved sequentially with an escalating price multiplier curve:

$$\text{Cost}(n) = \text{round}(25 \cdot n^{1.45})$$

| Tier | Cost (🪙) | Category | Item ID | Name | Emoji | Aesthetic / Theme |
|---|---|---|---|---|---|---|
| **0** | **0** (Free) | Starter | `bird`, `meadow`, `classic` | Classic Peep, Emerald Meadow, Classic Gold | 🐥🌿🌟 | Default Starter Roster |
| **1** | **25** | **Hero** | `neko` | Flappy Neko | 🐱 | Agile Lucky Tabby Cat |
| **2** | **50** | **Skin** | `sunrise` | Sakura Blossom | 🌸 | Pastel Floral Plumage |
| **3** | **75** | **Scene** | `cyber` | Neon Cyberpunk | 🌆 | Synthwave Skyline & Laser Grid |
| **4** | **110** | **Hero** | `doge` | Shiba Doge | 🐶 | Red Cape Shiba Inu |
| **5** | **160** | **Skin** | `ember` | Midnight Obsidian | 🌌 | Matte Stealth Dark Theme |
| **6** | **220** | **Scene** | `candy` | Candy Kingdom | 🍭 | Peppermint Pillars & Sugar Plains |
| **7** | **300** | **Hero** | `hamster` | Astro Hammy | 🐹 | Bubble Saucer Jet Thrusters |
| **8** | **400** | **Skin** | `void` | Cosmic Starcat | 🔮 | Nebula Glow Gradient |
| **9** | **520** | **Scene** | `magma` | Volcanic Rift | 🌋 | Basalt Crust & Glowing Magma |
| **10** | **660** | **Hero** | `dragon` | Chibi Dragon | 🐲 | Apex Winged Fire Drake |
| **11** | **820** | **Skin** | `prism` | Prism Hologram | 💎 | Iridescent Chromatic Hologram |

---

## 2. Storage & Economy Layer (`src/core/storage.ts`)

### Schema Updates
```typescript
export interface SaveData {
  best: number;
  tokens: number; // Persistent spendable currency
  lifetimeTokens: number; // All-time tokens earned for analytics
  feathers: number; // Max 3
  muted: boolean;
  streak: { lastDay: string; count: number };
  skin: string;
  character: CharacterId;
  biome: BiomeId | "auto";
  unlocked: string[]; // Claimed skins
  unlockedChars: string[]; // Claimed heroes
  unlockedBiomes: string[]; // Claimed scenes
  totalPlayTimeSec: number;
  totalRuns: number;
  totalPipesPassed: number;
}
```

### Helper API
- `addTokens(amount: number): number`: Adds tokens to `SaveData.tokens` and `SaveData.lifetimeTokens`. Returns new balance.
- `spendTokens(amount: number): boolean`: Checks `data.tokens >= amount`. If true, decrements balance, persists to `localStorage`, and returns `true`. If false, returns `false`.
- `isCharacterClaimable(charId, tokens, unlockedList)`: Checks if character cost is met with available tokens.
- `isSkinClaimable(skinId, tokens, unlockedList)`: Checks if skin cost is met with available tokens.
- `isBiomeClaimable(biomeId, tokens, unlockedList)`: Checks if scene cost is met with available tokens.
- `getPendingUnlocks(data: SaveData)`: Evaluates items where `tokens >= cost` and item is not yet claimed.

---

## 3. In-Game HUD & Menu Telemetry

### HUD (`src/ui/hud.ts`)
- Top-Right Anchor displays both tokens and feather bank:
  `[ 🪙 124 ] [ 🪶 2/3 ]`
- Dynamic counter updates when feathers or tokens change.

### Menu Bar (`src/ui/menu.ts`)
- Top status row: `🔥 1d` | `⏱️ 14m` on left; `🪙 124` | `🪶 3` | `🔊` on right.
- Goal Pill: Dynamically tracks next available unowned item on the ladder:
  `🎯 Next: 🐱 Flappy Neko (18/25 🪙)` with percentage fill.

### Item Cards in Drawer Tabs (`HEROES`, `SCENES`, `SKINS`)
- **Locked State (`tokens < cost`)**:
  Shows cost badge `🔒 25 🪙` + token progress bar `(18/25)`.
- **Claimable State (`tokens >= cost`)**:
  Shows glowing gold border + pulsing **`CLAIM 25 🪙 🎁`** button.
- **Claimed State**:
  Shows **`✓ ACTIVE`** (if equipped) or **`EQUIP`** (if owned).

---

## 4. Claim Action & Animated Deduction Juice

When player taps `CLAIM XX 🪙 🎁`:
1. `spendTokens(cost)` deducts tokens from vault.
2. Floating text `-XX 🪙` spawns above the clicked button, animating upwards + fading over 0.8s.
3. 3D gold confetti / coin sparkle burst (`game.juice.burst`).
4. Milestone fanfare audio chime (`audio.milestone()`).
5. Item is instantly unlocked and equipped.
6. HUD, menu drawer, and Game Over quick-swap update their balances immediately without page reload.

---

## 5. Verification & Testing Plan
- **Unit Tests (`src/core/storage.test.ts`, `src/core/characters.test.ts`, `src/core/biomes.test.ts`)**:
  - Verify `addTokens`, `spendTokens` (insufficient vs sufficient balance), and persistent reload.
  - Verify item claimability based on token balance.
- **Integration Tests (`src/core/automation.test.ts`)**:
  - Verify run score deposits matching token rewards.
- **Playwright E2E (`tests/gameplay_automation.mjs`)**:
  - Run full flight simulation, verify HUD token display, and test claim button deduction interaction.
