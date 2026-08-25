import { describe, it, expect } from "vitest";
import { CHARACTERS, isCharacterUnlocked, isCharacterClaimable } from "./characters";

describe("characters", () => {
  it("defines Classic Peep as the free starter character", () => {
    expect(CHARACTERS.bird.unlockType).toBe("free");
    expect(CHARACTERS.bird.unlockValue).toBe(0);
    expect(isCharacterUnlocked("bird", [])).toBe(true);
  });

  it("makes Flappy Neko claimable at tokens >= 40", () => {
    expect(isCharacterClaimable("neko", 39, [])).toBe(false);
    expect(isCharacterClaimable("neko", 40, [])).toBe(true);
    expect(isCharacterUnlocked("neko", [])).toBe(false);
    expect(isCharacterUnlocked("neko", ["neko"])).toBe(true);
  });

  it("makes Shiba Doge claimable at tokens >= 210", () => {
    expect(isCharacterClaimable("doge", 209, [])).toBe(false);
    expect(isCharacterClaimable("doge", 210, [])).toBe(true);
  });

  it("makes Astro Hammy claimable at tokens >= 560", () => {
    expect(isCharacterClaimable("hamster", 559, [])).toBe(false);
    expect(isCharacterClaimable("hamster", 560, [])).toBe(true);
  });

  it("makes Chibi Dragon claimable at tokens >= 1250", () => {
    expect(isCharacterClaimable("dragon", 1249, [])).toBe(false);
    expect(isCharacterClaimable("dragon", 1250, [])).toBe(true);
  });

  it("allows character selection if present in unlockedList override", () => {
    expect(isCharacterUnlocked("dragon", ["dragon"])).toBe(true);
  });
});
