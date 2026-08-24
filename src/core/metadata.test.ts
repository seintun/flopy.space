import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SEO & Social Metadata", () => {
  const htmlPath = path.resolve(__dirname, "../../index.html");
  const html = fs.readFileSync(htmlPath, "utf-8");

  it("contains updated FLOPY.SPACE title and description", () => {
    expect(html).toContain("<title>FLOPY.SPACE — 3D Time Arcade</title>");
    expect(html).toContain('name="description"');
    expect(html).toContain("FLOPY.SPACE");
  });

  it("contains OpenGraph social sharing tags", () => {
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:type" content="website"');
  });

  it("contains Twitter Card metadata", () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('name="twitter:image"');
  });

  it("contains mobile PWA and Apple Touch Icon tags", () => {
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="apple-mobile-web-app-title" content="FLOPY.SPACE"');
    expect(html).toContain('name="theme-color" content="#0a1024"');
  });
});
