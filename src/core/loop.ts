import { DT } from "./constants";

export function makeAccumulator() {
  let acc = 0;
  return {
    step(realDtScaled: number, frozen: boolean, fixed: (dt: number) => void): number {
      if (frozen) return 0;
      acc = Math.min(acc + realDtScaled, 0.25);
      while (acc >= DT) {
        fixed(DT);
        acc -= DT;
      }
      return acc / DT; // alpha for interpolation
    },
    reset() {
      acc = 0;
    },
  };
}
