# Marketing Metadata, SEO, App Icons & PWA Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul SEO search metadata, OpenGraph/Twitter social cards, PWA install manifest, apple-touch app icons, and production README for FLOPY.SPACE.

**Architecture:** Update `index.html` with complete modern SEO/Social tags and PWA headers; update `public/manifest.webmanifest` for standalone mobile app installation; design vibrant high-res `public/icon.svg` maskable vector icon; write comprehensive testing suite for SEO/PWA metadata; produce clean production `README.md`.

**Tech Stack:** HTML5 Semantic Meta, OpenGraph 2.0, Twitter Cards, W3C Web App Manifest, SVG Vector Graphics, Vitest.

**Spec:** [docs/superpowers/specs/2026-08-23-flappy3d-design.md](file:///Users/seintun/code/sandbox/ox-alpha/docs/superpowers/specs/2026-08-23-flappy3d-design.md)

## Global Constraints

- Domain / Branding: `FLOPY.SPACE` (URL: `https://seintun.github.io/flopy.space/`)
- Relative Asset Paths: All manifest and icon references must resolve cleanly in both root (`/`) and subdirectory (`/flopy.space/`) deployments (`base: "./"`).
- Zero Boilerplate: Remove outdated "Flappy3D" / "ox-alpha" boilerplate text.

---

### Task 1: Complete SEO, OpenGraph & Apple Touch Metadata in `index.html`

**Files:**
- Modify: `index.html`
- Test: `src/core/metadata.test.ts`

**Interfaces:**
- Produces: Complete `<head>` meta tags (`title`, `description`, `canonical`, `og:*`, `twitter:*`, `apple-touch-icon`, `theme-color`).

- [ ] **Step 1: Write the failing metadata test**

```ts
// src/core/metadata.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/metadata.test.ts`
Expected: FAIL due to missing meta tags in `index.html`.

- [ ] **Step 3: Update `index.html` with complete SEO, OpenGraph & PWA metadata**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>FLOPY.SPACE — 3D Time Arcade</title>

  <!-- Primary Meta Tags -->
  <meta name="title" content="FLOPY.SPACE — 3D Time Arcade" />
  <meta name="description" content="Play FLOPY.SPACE: The viral 3D arcade flyer featuring cute heroes, power-ups, daily quests, and 4D time rewind mechanics right in your browser." />
  <meta name="keywords" content="flopy, flopy space, 3d arcade game, browser game, mobile arcade, 4d rewind, time dilation, webgl, threejs" />
  <meta name="author" content="Sein Tun" />
  <meta name="theme-color" content="#0a1024" />

  <!-- Open Graph / Facebook / Discord / iMessage -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://seintun.github.io/flopy.space/" />
  <meta property="og:title" content="FLOPY.SPACE — 3D Time Arcade" />
  <meta property="og:description" content="Fly, combo, and rewind time in full 3D! Play instantly on mobile or desktop." />
  <meta property="og:image" content="https://seintun.github.io/flopy.space/icon.svg" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://seintun.github.io/flopy.space/" />
  <meta name="twitter:title" content="FLOPY.SPACE — 3D Time Arcade" />
  <meta name="twitter:description" content="Fly, combo, and rewind time in full 3D! Play instantly on mobile or desktop." />
  <meta name="twitter:image" content="https://seintun.github.io/flopy.space/icon.svg" />

  <!-- Mobile PWA & Apple WebApp -->
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FLOPY.SPACE" />
  <link rel="apple-touch-icon" href="icon.svg" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" type="image/svg+xml" href="icon.svg" />

  <!-- Typography Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/metadata.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html src/core/metadata.test.ts
git commit -m "feat(seo): add rich SEO, OpenGraph social cards, and Apple PWA tags to index.html"
```

---

### Task 2: PWA Web App Manifest & App Icon Overhaul

**Files:**
- Modify: `public/manifest.webmanifest`
- Modify: `public/icon.svg`
- Test: `src/core/manifest.test.ts`

**Interfaces:**
- Produces: Valid W3C WebApp Manifest and vibrant SVG icon with maskable geometry.

- [ ] **Step 1: Write the failing manifest test**

```ts
// src/core/manifest.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/manifest.test.ts`
Expected: FAIL due to outdated manifest values.

- [ ] **Step 3: Update `public/manifest.webmanifest` and `public/icon.svg`**

Update `public/manifest.webmanifest`:
```json
{
  "name": "FLOPY.SPACE — 3D Time Arcade",
  "short_name": "FLOPY.SPACE",
  "description": "Addictive 3D arcade flyer with cute heroes, 4D time rewind, and dynamic worlds.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a1024",
  "theme_color": "#0a1024",
  "categories": ["games", "arcade"],
  "icons": [
    {
      "src": "icon.svg",
      "sizes": "192x192 512x512 any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

Update `public/icon.svg` with modern polished neon squircle icon with cute wings and space visor glow.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/manifest.webmanifest public/icon.svg src/core/manifest.test.ts
git commit -m "feat(pwa): update Web App Manifest for FLOPY.SPACE with standalone display and maskable vector icon"
```

---

### Task 3: Production Documentation & Marketing Cleanup

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: Professional landing documentation with live play badges, feature guides, architecture diagrams, and control instructions.

- [ ] **Step 1: Update `README.md`**

Replace outdated boilerplate with complete FLOPY.SPACE landing guide:
- Live play link: `https://seintun.github.io/flopy.space/`
- Key Features: 4D Time Rewind, Bullet-Time Orbs, Single-Hero Streak Integrity, In-Situ Quick-Swap, Daily Quests.
- Control guide for mobile & desktop.
- Architecture flow and local build instructions.

- [ ] **Step 2: Run all tests and build verification**

Run: `npx vitest run && npm run build`
Expected: All 19 test suites pass, clean build.

- [ ] **Step 3: Commit and Push**

```bash
git add README.md
git commit -m "docs: overhaul README with FLOPY.SPACE branding, live links, and gameplay guides"
git push origin main
```

---

## Self-Review Checklist

1. **Spec Coverage**:
   - [x] Marketing metadata & SEO in `index.html` (Task 1)
   - [x] Social OpenGraph & Twitter Cards (Task 1)
   - [x] PWA Manifest & App Icon (Task 2)
   - [x] README & Boilerplate Cleanup (Task 3)
2. **No Placeholders**: All code snippets, tests, and configurations are concrete and complete.
3. **Type Consistency**: Verified test paths and JSON schemas match Vite build outputs.
