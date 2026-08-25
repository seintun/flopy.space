import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { showDeductionFlyout } from "./uiEffects";

describe("UI Effects Module", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles headless environment safely without throwing", () => {
    expect(() => {
      showDeductionFlyout({} as HTMLElement, 50);
    }).not.toThrow();
  });

  it("spawns and removes flyout with document mock", () => {
    const appended: any[] = [];
    const mockEl = {
      className: "",
      style: { cssText: "", transform: "", opacity: "" },
      textContent: "",
      remove: vi.fn(),
    };

    const originalDoc = (globalThis as any).document;
    (globalThis as any).document = {
      createElement: () => mockEl,
      body: {
        appendChild: (el: any) => appended.push(el),
      },
    };

    const target = {
      getBoundingClientRect: () => ({ left: 100, top: 200, width: 80 }),
    } as any;

    showDeductionFlyout(target, 45);

    expect(appended.length).toBe(1);
    expect(mockEl.textContent).toBe("-45 🪙");

    vi.advanceTimersByTime(850);
    expect(mockEl.remove).toHaveBeenCalled();

    (globalThis as any).document = originalDoc;
  });
});
