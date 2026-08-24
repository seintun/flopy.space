import { describe, it, expect } from "vitest";
import { CHARACTERS, isCharacterUnlocked, isCharacterClaimable } from "./characters";

describe("characters", () => {
  it("defines Classic Peep as the free starter character", () => {
    expect(CHARACTERS.bird.unlockType).toBe("free");
    expect(CHARACTERS.bird.unlockValue).toBe(0);
    expect(isCharacterUnlocked("bird", [])).toBe(true);
  });

  it("makes Flappy Neko claimable at tokens >= 25", () => {
    expect(isCharacterClaimable("neko", 24, [])).toBe(false);
    expect(isCharacterClaimable("neko", 25, [])).toBe(true);
    expect(isCharacterUnlocked("neko", [])).toBe(false);
    expect(isCharacterUnlocked("neko", ["neko"])).toBe(true);
  });

  it("makes Shiba Doge claimable at tokens >= 110", () => {
    expect(isCharacterClaimable("doge", 109, [])).toBe(false);
    expect(isCharacterClaimable("doge", 110, [])).toBe(true);
  });

  it("makes Astro Hammy claimable at tokens >= 300", () => {
    expect(isCharacterClaimable("hamster", 299, [])).toBe(false);
    expect(isCharacterClaimable("hamster", 300, [])).toBe(true);
  });

  it("makes Chibi Dragon claimable at tokens >= 660", () => {
    expect(isCharacterClaimable("dragon", 659, [])).toBe(false);
    expect(isCharacterClaimable("dragon", 660, [])).toBe(true);
  });

  it("allows character selection if present in unlockedList override", () => {
    expect(isCharacterUnlocked("dragon", ["dragon"])).toBe(true);
  });
});
