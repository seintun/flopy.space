import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Web App Manifest", () => {
  const manifestPath = path.resolve(__dirname, "../../public/manifest.webmanifest");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw);

  it("contains correct FLOPY.SPACE app identifiers", () => {
    expect(manifest.name).toBe("FLOPY.SPACE — 3D Time Arcade");
    expect(manifest.short_name).toBe("FLOPY.SPACE");
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("portrait");
    expect(manifest.theme_color).toBe("#0a1024");
    expect(manifest.background_color).toBe("#0a1024");
    expect(manifest.categories).toContain("games");
  });

  it("defines maskable and any app icons", () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    const icon = manifest.icons[0];
    expect(icon.purpose).toContain("maskable");
    expect(icon.type).toBe("image/svg+xml");
  });
});
