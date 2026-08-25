import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InstallManager } from "./installManager";

describe("InstallManager Universal PWA Handler", () => {
  let listeners: Record<string, Function[]> = {};
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
    listeners = {};

    (globalThis as any).window = {
      addEventListener: (evt: string, fn: Function) => {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt]!.push(fn);
      },
      dispatchEvent: (evt: any) => {
        const type = evt.type;
        listeners[type]?.forEach((fn) => fn(evt));
      },
      matchMedia: () => ({ matches: false }),
    };

    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
        standalone: false,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    delete (globalThis as any).window;
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("detects non-standalone browser default state", () => {
    const mgr = new InstallManager();
    expect(mgr.isStandalone()).toBe(false);
    expect(mgr.getInstallState()).toBe("desktop");
  });

  it("detects iOS user agent correctly", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
        standalone: false,
      },
      configurable: true,
      writable: true,
    });
    const mgr = new InstallManager();
    expect(mgr.isIOS()).toBe(true);
    expect(mgr.getInstallState()).toBe("ios");
  });

  it("captures beforeinstallprompt event and flags canInstall", () => {
    let stateChanged = false;
    const mgr = new InstallManager((canInstall) => {
      stateChanged = canInstall;
    });

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockChoice = Promise.resolve({ outcome: "accepted" as const });
    const event = {
      type: "beforeinstallprompt",
      prompt: mockPrompt,
      userChoice: mockChoice,
      preventDefault: vi.fn(),
    };

    (globalThis as any).window.dispatchEvent(event);

    expect(mgr.canInstall()).toBe(true);
    expect(stateChanged).toBe(true);
    expect(mgr.getInstallState()).toBe("native");
  });

  it("prompts install and tracks acceptance", async () => {
    const mgr = new InstallManager();
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockChoice = Promise.resolve({ outcome: "accepted" as const });
    const event = {
      type: "beforeinstallprompt",
      prompt: mockPrompt,
      userChoice: mockChoice,
      preventDefault: vi.fn(),
    };

    (globalThis as any).window.dispatchEvent(event);

    const accepted = await mgr.promptInstall();
    expect(accepted).toBe(true);
    expect(mockPrompt).toHaveBeenCalled();
    expect(mgr.canInstall()).toBe(false);
  });
});
