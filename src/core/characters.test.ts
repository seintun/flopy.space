import { describe, it, expect } from "vitest";
import { CHARACTERS, isCharacterUnlocked } from "./characters";

describe("characters", () => {
  it("contains 5 unique playable characters with defined models and sound types", () => {
    const list = Object.values(CHARACTERS);
    expect(list.length).toBe(5);
    const ids = list.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("neko is unlocked by default", () => {
    expect(isCharacterUnlocked("neko", 0, 0, [])).toBe(true);
  });

  it("unlocks doge and dragon by score", () => {
    expect(isCharacterUnlocked("doge", 10, 0, [])).toBe(false);
    expect(isCharacterUnlocked("doge", 15, 0, [])).toBe(true);

    expect(isCharacterUnlocked("dragon", 29, 0, [])).toBe(false);
    expect(isCharacterUnlocked("dragon", 30, 0, [])).toBe(true);
  });

  it("unlocks classic bird by 2-day streak", () => {
    expect(isCharacterUnlocked("bird", 0, 1, [])).toBe(false);
    expect(isCharacterUnlocked("bird", 0, 2, [])).toBe(true);
  });

  it("honors unlocked list override from purchased feathers", () => {
    expect(isCharacterUnlocked("hamster", 0, 0, ["hamster"])).toBe(true);
  });
});
