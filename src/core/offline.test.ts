import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Offline PWA & Service Worker", () => {
  const swPath = path.resolve(__dirname, "../../public/sw.js");

  it("service worker precaches app shell and handles fetch events", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("CACHE_NAME");
    expect(swContent).toContain("addEventListener(\"install\"");
    expect(swContent).toContain("addEventListener(\"fetch\"");
    expect(swContent).toContain("addEventListener(\"activate\"");
  });

  it("main.ts contains service worker registration hook", () => {
    const mainPath = path.resolve(__dirname, "../../src/main.ts");
    const mainContent = fs.readFileSync(mainPath, "utf-8");
    expect(mainContent).toContain("serviceWorker");
    expect(mainContent).toContain("sw.js");
  });
});
