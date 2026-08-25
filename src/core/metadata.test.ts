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

  it("contains canonical domain link and robots meta tag", () => {
    expect(html).toContain('<link rel="canonical" href="https://flopy.space/" />');
    expect(html).toContain('name="robots"');
  });

  it("contains OpenGraph social sharing tags pointing to https://flopy.space/", () => {
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="og:url" content="https://flopy.space/"');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:site_name" content="FLOPY.SPACE"');
    expect(html).toContain('property="og:image:width"');
    expect(html).toContain('property="og:image:height"');
  });

  it("contains Twitter Card metadata", () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:url" content="https://flopy.space/"');
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('name="twitter:image"');
  });

  it("contains mobile PWA, Apple Touch Icon, and Safari mask-icon tags", () => {
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="apple-mobile-web-app-title" content="FLOPY.SPACE"');
    expect(html).toContain('name="theme-color" content="#0a1024"');
    expect(html).toContain('rel="mask-icon"');
  });

  it("contains Schema.org JSON-LD structured data for VideoGame and WebApplication", () => {
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type": "VideoGame"');
    expect(html).toContain('"operatingSystem": "Any"');
    expect(html).toContain('"applicationCategory": "GameApplication"');
  });
});
