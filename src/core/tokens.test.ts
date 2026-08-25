import { describe, it, expect } from "vitest";
import { updateInFlightTokens, type TokenCollectEvent } from "./tokens";
import type { InFlightToken } from "./types";

describe("In-Flight Tokens System", () => {
  it("applies magnetic suction towards bird when magnet is active", () => {
    const tokens: InFlightToken[] = [
      { id: 1, x: 2.0, y: 1.5, taken: false, value: 1 },
    ];
    const events: TokenCollectEvent[] = [];
    updateInFlightTokens(tokens, 1.5, 0.1, true, 8.0, false, (e) => events.push(e));
    expect(events.length).toBe(0);
    // Token moved closer to x=0
    expect(tokens[0]!.x).toBeLessThan(2.0);
  });

  it("applies micro-draft when close even without magnet", () => {
    const tokens: InFlightToken[] = [
      { id: 1, x: 1.0, y: 1.5, taken: false, value: 1 },
    ];
    const events: TokenCollectEvent[] = [];
    updateInFlightTokens(tokens, 1.5, 0.05, false, 0, false, (e) => events.push(e));
    expect(events.length).toBe(0);
    expect(tokens[0]!.x).toBeLessThan(1.0);
  });

  it("collects token and applies 3x multiplier when chubby", () => {
    const tokens: InFlightToken[] = [
      { id: 1, x: 0.2, y: 1.5, taken: false, value: 2 },
    ];
    const events: TokenCollectEvent[] = [];
    const totalVal = updateInFlightTokens(tokens, 1.5, 0.016, false, 0, true, (e) => events.push(e));
    expect(totalVal).toBe(6); // 2 * 3
    expect(events.length).toBe(1);
    expect(events[0]!.value).toBe(6);
    expect(tokens[0]!.taken).toBe(true);
  });
});
