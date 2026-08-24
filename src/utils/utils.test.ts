import { describe, it, expect } from "vitest";
import { formatDuration } from "./time";
import { hexToCss, lerpHex } from "./color";

describe("Shared Utilities", () => {
  describe("time.ts", () => {
    it("formats durations accurately with sec suffix", () => {
      expect(formatDuration(0)).toBe("0.00sec");
      expect(formatDuration(1.55)).toBe("1.55sec");
      expect(formatDuration(9)).toBe("9.00sec");
      expect(formatDuration(65)).toBe("01:05sec");
    });
  });

  describe("color.ts", () => {
    it("converts hex integers to CSS strings", () => {
      expect(hexToCss(0xffd000)).toBe("#ffd000");
      expect(hexToCss(0x0f172a)).toBe("#0f172a");
      expect(hexToCss(0x00f5d4)).toBe("#00f5d4");
    });

    it("linearly interpolates colors correctly", () => {
      const red = 0xff0000;
      const blue = 0x0000ff;
      const mid = lerpHex(red, blue, 0.5);
      expect(mid).toBe(0x800080);
    });
  });
});
