# PWA Game SEO, Marketing Metadata & Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform FLOPY.SPACE into an SEO powerhouse and viral-ready PWA with Schema.org JSON-LD structured data, rich social cards, multi-platform favicons, rich PWA manifest shortcuts/screenshots, `robots.txt`, and `sitemap.xml`.

**Architecture:** Update HTML head metadata with canonical domain tags (`https://flopy.space/`), structured JSON-LD (`VideoGame` and `WebApplication` schema), high-fidelity OpenGraph and Twitter cards, enhanced `manifest.webmanifest` with rich install UI prompts, and add `public/robots.txt` and `public/sitemap.xml`.

**Tech Stack:** HTML5, JSON-LD (Schema.org), Web App Manifest (W3C), SVG, XML Sitemap, Vitest.

**Spec:** [ARCHITECTURE.md](file:///Users/seintun/code/sandbox/ox-alpha/ARCHITECTURE.md) and [README.md](file:///Users/seintun/code/sandbox/ox-alpha/README.md)

## Global Constraints

- Canonical domain is strictly `https://flopy.space/` with mirror `https://seintun.github.io/flopy.space/`.
- 100% valid JSON-LD adhering to Schema.org standards for `VideoGame` and `WebApplication`.
- PWA manifest must pass Chrome Rich Install UI validation (requires name, description, icons, and screenshots/categories).
- All automated unit tests in `src/core/metadata.test.ts` and `src/core/manifest.test.ts` must pass.

---

### Task 1: Add Schema.org JSON-LD Structured Data, Canonical & Social Meta Tags in `index.html`

**Files:**
- Modify: `index.html:1-48`
- Modify: `src/core/metadata.test.ts`

**Interfaces:**
- Consumes: Game metadata, canonical URL `https://flopy.space/`, app icons, author credentials.
- Produces: Google Search rich snippets, Twitter large summary cards, OpenGraph embeds, Safari mask icon.

- [x] **Step 1: Write failing metadata tests**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `index.html` with complete SEO metadata and JSON-LD**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 2: Enhance PWA Web Manifest with Rich Install Metadata & App Shortcuts

**Files:**
- Modify: `public/manifest.webmanifest`
- Modify: `src/core/manifest.test.ts`

**Interfaces:**
- Consumes: PWA specifications, app categories, shortcuts.
- Produces: Chrome Rich Install UI dialog, app shortcuts ("Play Now", "Character Roster", "Daily Quests").

- [x] **Step 1: Write updated manifest tests**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `public/manifest.webmanifest` with rich metadata**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 3: Create `robots.txt` and `sitemap.xml` for Search Engine Indexing

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Create: `tests/seo.test.ts`

**Interfaces:**
- Consumes: Public site URL `https://flopy.space/`.
- Produces: Crawl directives for Googlebot, Bingbot, and search engine indexers.

- [x] **Step 1: Write SEO crawler tests**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Create `public/robots.txt` and `public/sitemap.xml`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 4: Final Verification & Production Build

**Files:**
- Test: `npm test`
- Test: `npm run build`

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run production build**
- [x] **Step 3: Commit final verification**
