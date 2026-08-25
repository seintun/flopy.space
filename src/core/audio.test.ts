import { describe, it, expect } from "vitest";
import { AudioSys } from "./audio";

describe("AudioSys Architecture & Safety", () => {
  it("initializes in unmuted state and toggles muting cleanly", () => {
    const audio = new AudioSys();
    expect(audio.isMuted()).toBe(false);
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
  });

  it("handles all hero sounds safely in headless/node environments without throwing", () => {
    const audio = new AudioSys();
    const heroes: ("cat" | "dog" | "dragon" | "hamster" | "bird")[] = [
      "cat",
      "dog",
      "dragon",
      "hamster",
      "bird",
    ];

    for (const h of heroes) {
      expect(() => {
        audio.flap(h);
        audio.nearMiss(h);
        audio.die(h);
      }).not.toThrow();
    }
  });

  it("handles all powerup and game event audio methods safely", () => {
    const audio = new AudioSys();
    expect(() => {
      audio.chibiPickup();
      audio.chubbyPickup();
      audio.voidMineHit();
      audio.gravitySinkHit();
      audio.tokenChime(0);
      audio.tokenChime(7);
      audio.tokenChime(15);
      audio.score(10);
      audio.rainbowTrail();
      audio.feverStart();
      audio.biomeWarp();
      audio.missionComplete();
      audio.shieldActive();
      audio.shieldBreak();
      audio.magnetActive();
      audio.starGem();
      audio.rewind();
      audio.rewindResume();
      audio.milestone();
      audio.countdownTick(3);
      audio.countdownGo();
    }).not.toThrow();
  });
});
