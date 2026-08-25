import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Robots and Sitemap Discovery", () => {
  const rootDir = process.cwd();

  it("contains valid robots.txt allowing all user agents", () => {
    const robotsPath = path.join(rootDir, "public", "robots.txt");
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, "utf8");
    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain("Sitemap: https://flopy.space/sitemap.xml");
  });

  it("contains valid sitemap.xml with flopy.space URL", () => {
    const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const content = fs.readFileSync(sitemapPath, "utf8");
    expect(content).toContain("<loc>https://flopy.space/</loc>");
    expect(content).toContain("<changefreq>daily</changefreq>");
  });
});
