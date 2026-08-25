import { describe, it, expect } from "vitest";
import { Juice } from "./juice";

describe("Juice System & Shake Performance", () => {
  it("initializes without errors in headless mode", () => {
    const juice = new Juice();
    expect(juice.trauma).toBe(0);
  });

  it("decays trauma and generates ox, oy, and rot camera perturbation", () => {
    const juice = new Juice();
    juice.addTrauma(0.8);
    expect(juice.trauma).toBe(0.8);

    const shake = juice.update(0.1);
    expect(typeof shake.ox).toBe("number");
    expect(typeof shake.oy).toBe("number");
    expect(typeof shake.rot).toBe("number");
    expect(juice.trauma).toBeLessThan(0.8);
  });

  it("handles popups and border flashes safely", () => {
    const juice = new Juice();
    expect(() => {
      juice.popup("+1 PIPE", "#ffffff");
      juice.setBorderFx("fever");
      juice.setBorderFx("none");
      juice.flashBorder("#ff007f", 100);
      juice.burst(0, 0, 0, 10);
      juice.confetti(0, 0, 0, 15);
    }).not.toThrow();
  });
});
