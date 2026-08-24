import { describe, it, expect } from "vitest";
import { mulberry32, worldRand } from "./rand";
import type { World } from "./types";

describe("mulberry32", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("worldRand", () => {
  it("advances world rngState deterministically", () => {
    const w = { rngState: 7 } as World;
    const v1 = worldRand(w);
    expect(w.rngState).not.toBe(7);
    const w2 = { rngState: 7 } as World;
    expect(worldRand(w2)).toBe(v1);
  });
});
