import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

async function run() {
  console.log("🚀 Starting Vite Preview Server...");
  const server = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  server.stdout.on("data", (data) => {
    // console.log(`[server] ${data}`);
  });

  server.stderr.on("data", (data) => {
    // console.error(`[server err] ${data}`);
  });

  // Wait for server to boot
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log("🌐 Launching Chromium in Mobile Viewport (iPhone 14 / Pixel: 390x844, DPR: 2)...");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  try {
    console.log("📍 Navigating to http://localhost:4173...");
    await page.goto("http://localhost:4173", { waitUntil: "networkidle" });

    // 1. Test Menu View & Tabs Navigation
    console.log("🧪 1. Testing Menu State & Tab Switching...");
    await page.waitForSelector("#main-menu", { state: "visible" });
    const mainMenu = await page.$("#main-menu");
    expectTrue(await mainMenu.isVisible(), "Main menu is visible");

    const screenshotsDir = path.join(process.cwd(), "tests", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    await page.screenshot({ path: path.join(screenshotsDir, "01_menu_heroes.png") });
    console.log("📸 Saved: 01_menu_heroes.png");

    // Click Scenes Tab
    console.log("   Clicking Scenes Tab...");
    await page.click('button[data-tab="scenes"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, "02_menu_scenes.png") });
    console.log("📸 Saved: 02_menu_scenes.png");

    // Click Quests Tab
    console.log("   Clicking Quests Tab...");
    await page.click('button[data-tab="quests"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, "03_menu_quests.png") });
    console.log("📸 Saved: 03_menu_quests.png");

    // 2. Tap to Start -> Countdown
    console.log("🧪 2. Starting Run (Tapping Screen to Fly)...");
    await page.touchscreen.tap(195, 250);

    // Verify Countdown overlay appears
    await page.waitForSelector("#hud-countdown", { state: "visible", timeout: 2000 });
    const countdownVal = await page.$eval("#hud-countdown-val", (el) => el.textContent);
    console.log(`   Countdown active: "${countdownVal}"`);
    await page.screenshot({ path: path.join(screenshotsDir, "04_countdown.png") });
    console.log("📸 Saved: 04_countdown.png");

    // 3. Wait for Countdown to complete -> Playing state
    console.log("🧪 3. Transitioning to Active Playing State...");
    await page.waitForTimeout(1600); // 1.6s countdown
    await page.waitForSelector("#hud-header", { state: "visible" });

    // Verify HUD elements
    const scoreText = await page.$eval("#hud-score", (el) => el.textContent);
    const featherText = await page.$eval("#hud-feather-count", (el) => el.textContent);
    console.log(`   HUD Verified -> Score: ${scoreText}, Feathers: ${featherText}`);

    // Perform interactive flapping
    console.log("🧪 4. Flapping & Flight Simulation...");
    for (let i = 0; i < 8; i++) {
      await page.touchscreen.tap(195, 422);
      await page.waitForTimeout(220);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "05_playing_flight.png") });
    console.log("📸 Saved: 05_playing_flight.png");

    // 4. Let bird hit ground/pipe to trigger collision
    console.log("🧪 5. Simulating Collision & Inspecting Rewind / GameOver Modal...");
    await page.waitForTimeout(2500);

    const rewindPanelVisible = await page.$eval("#hud-rewind-panel", (el) => el.style.display === "flex").catch(() => false);
    const gameoverVisible = await page.$eval("#gameover-overlay", (el) => el.style.display === "flex").catch(() => false);

    console.log(`   Rewind Panel Active: ${rewindPanelVisible}, GameOver Active: ${gameoverVisible}`);

    if (rewindPanelVisible) {
      await page.screenshot({ path: path.join(screenshotsDir, "06_rewind_choice.png") });
      console.log("📸 Saved: 06_rewind_choice.png");

      const giveUpBtn = await page.$("#hud-giveup-btn");
      if (giveUpBtn) {
        console.log("   Accepting death / give up...");
        await giveUpBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await page.waitForSelector("#gameover-overlay", { state: "visible", timeout: 4000 });
    await page.screenshot({ path: path.join(screenshotsDir, "07_gameover.png") });
    console.log("📸 Saved: 07_gameover.png");

    // Test Retry button
    console.log("🧪 6. Testing Retry Button from GameOver Screen...");
    const retryBtn = await page.$("#go-retry-btn");
    if (retryBtn) {
      await retryBtn.click({ force: true });
      await page.waitForSelector("#hud-countdown", { state: "visible", timeout: 3000 });
      console.log("   Restarted run successfully via Retry CTA!");
    }

    // 6. Check console errors
    console.log("🧪 7. Inspecting Console Logs & WebGL Errors...");
    if (consoleErrors.length > 0) {
      console.error("❌ Console errors detected:", consoleErrors);
      throw new Error(`Found ${consoleErrors.length} console errors during test run`);
    } else {
      console.log("✅ Zero WebGL or runtime console errors detected!");
    }

    console.log("🎉 ALL PLAYWRIGHT / CHROME E2E TESTS PASSED PERFECTLY!");
  } finally {
    await browser.close();
    server.kill();
  }
}

function expectTrue(val, msg) {
  if (!val) throw new Error(`Assertion failed: ${msg}`);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
