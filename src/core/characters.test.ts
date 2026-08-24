import { describe, it, expect } from "vitest";
import { CHARACTERS, isCharacterUnlocked } from "./characters";

describe("characters", () => {
  it("defines Classic Peep as the free starter character", () => {
    expect(CHARACTERS.bird.unlockType).toBe("free");
    expect(CHARACTERS.bird.unlockValue).toBe(0);
    expect(isCharacterUnlocked("bird", 0, 0, [])).toBe(true);
  });

  it("locks Flappy Neko until score >= 15", () => {
    expect(isCharacterUnlocked("neko", 14, 0, [])).toBe(false);
    expect(isCharacterUnlocked("neko", 15, 0, [])).toBe(true);
  });

  it("locks Shiba Doge until score >= 35", () => {
    expect(isCharacterUnlocked("doge", 34, 0, [])).toBe(false);
    expect(isCharacterUnlocked("doge", 35, 0, [])).toBe(true);
  });

  it("locks Astro Hammy until score >= 60", () => {
    expect(isCharacterUnlocked("hamster", 59, 0, [])).toBe(false);
    expect(isCharacterUnlocked("hamster", 60, 0, [])).toBe(true);
  });

  it("locks Chibi Dragon until score >= 100", () => {
    expect(isCharacterUnlocked("dragon", 99, 0, [])).toBe(false);
    expect(isCharacterUnlocked("dragon", 100, 0, [])).toBe(true);
  });

  it("allows character selection if present in unlockedList override", () => {
    expect(isCharacterUnlocked("dragon", 0, 0, ["dragon"])).toBe(true);
  });
});
