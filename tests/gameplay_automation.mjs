import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

async function run() {
  console.log("🎮 ============================================================");
  console.log("🚀 STARTING AUTOMATED GAMEPLAY TEST (CHROME + PLAYWRIGHT)");
  console.log("🎮 ============================================================\n");

  console.log("📦 Starting local Vite server on port 4173...");
  const server = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 400, height: 850 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  const screenshotsDir = path.join(process.cwd(), "tests", "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. Load Game
    console.log("📍 1. Navigating to game...");
    await page.goto("http://localhost:4173", { waitUntil: "networkidle" });
    await page.waitForSelector("#main-menu", { state: "visible" });
    console.log("   ✅ Menu loaded successfully.");

    // 2. Start Game via Spacebar
    console.log("\n⌨️ 2. Testing Game Start via SPACEBAR Keydown...");
    await page.keyboard.press("Space");
    await page.waitForSelector("#hud-countdown", { state: "visible", timeout: 3000 });
    console.log("   ✅ Spacebar started countdown.");

    // 3. Wait for Playing State
    console.log("\n▶️ 3. Testing Game Running Loop (RAF & World State)...");
    await page.waitForTimeout(1600); // 1.6s countdown
    await page.waitForSelector("#hud-header", { state: "visible" });

    const isRunning = await page.evaluate(() => {
      const g = window.__FLOPY_GAME__;
      return g && g.state === "playing" && g.world.bird.alive;
    });
    expectTrue(isRunning, "Game state is 'playing' and bird is alive");
    console.log("   ✅ Game is running with active RAF physics loop.");

    // 4. Test Flapping via Spacebar
    console.log("\n⌨️ 4. Testing In-Flight Flap via Spacebar...");
    const vyBefore = await page.evaluate(() => window.__FLOPY_GAME__.world.bird.vy);
    await page.keyboard.press("Space");
    await page.waitForTimeout(60);
    const vyAfter = await page.evaluate(() => window.__FLOPY_GAME__.world.bird.vy);
    console.log(`   vy before: ${vyBefore.toFixed(2)}, vy after spacebar: ${vyAfter.toFixed(2)}`);
    expectTrue(vyAfter > vyBefore || vyAfter > 0, "Spacebar applied upward flap velocity");
    console.log("   ✅ Spacebar reliably triggers upward flap impulse.");

    // 5. Test Autopilot: Passing Pipes
    console.log("\n🏁 5. Testing Pipe Passing with Autonomous Flight Controller...");
    const startTime = Date.now();
    let maxScore = 0;

    // Run AI autopilot for up to 12 seconds to clear pipes
    while (Date.now() - startTime < 12000) {
      const state = await page.evaluate(() => {
        const g = window.__FLOPY_GAME__;
        if (!g || g.state !== "playing") return null;

        const birdY = g.world.bird.y;
        const birdVy = g.world.bird.vy;
        const score = g.world.score;
        const pipesPassed = g.world.pipesPassed;

        // Find closest upcoming pipe
        const upcoming = g.world.pipes
          .filter((p) => p.x > -1.5)
          .sort((a, b) => a.x - b.x)[0];

        return {
          birdY,
          birdVy,
          score,
          pipesPassed,
          targetY: upcoming ? upcoming.gapCenter : 1.5,
          pipeDist: upcoming ? upcoming.x : 99,
        };
      });

      if (!state) break;
      maxScore = Math.max(maxScore, state.pipesPassed);

      if (maxScore >= 2) {
        console.log(`   🎉 Successfully passed ${maxScore} pipes!`);
        break;
      }

      // Autopilot kinematic decision
      const desiredY = state.targetY;
      if (state.birdY < desiredY - 0.25 && state.birdVy < 1.0) {
        await page.keyboard.press("Space");
      }

      await page.waitForTimeout(45);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "auto_passed_pipes.png") });
    console.log(`   ✅ Pipe Passing Verified! Current pipes cleared: ${maxScore}`);
    expectTrue(maxScore >= 1, "At least 1 pipe was successfully cleared");

    // 6. Test Collision Detection
    console.log("\n💥 6. Testing Collision Detection (Floor / Pipe Crash)...");
    // Stop pressing space and let bird fall to ground or hit pipe
    await page.waitForTimeout(3000);

    const collisionResult = await page.evaluate(() => {
      const g = window.__FLOPY_GAME__;
      return {
        state: g ? g.state : null,
        birdAlive: g ? g.world.bird.alive : false,
      };
    });

    console.log(`   State after fall: "${collisionResult.state}", birdAlive: ${collisionResult.birdAlive}`);
    expectTrue(
      collisionResult.state === "rewindChoice" || collisionResult.state === "gameOver",
      "Collision triggered state transition to rewindChoice or gameOver",
    );
    console.log("   ✅ Collision Detection verified: fatal hit stopped run safely.");

    await page.screenshot({ path: path.join(screenshotsDir, "auto_collision_detected.png") });

    // 7. Verify Game Over & Token Economy Display
    console.log("\n🪙 7. Verifying Token Accrual & Post-Run Vault Telemetry...");
    if (collisionResult.state === "rewindChoice") {
      const giveUpBtn = await page.waitForSelector("#hud-giveup-btn", { state: "visible" });
      await giveUpBtn.click();
      await page.waitForSelector("#gameover-overlay", { state: "visible" });
    }

    const tokensVerified = await page.evaluate(() => {
      const g = window.__FLOPY_GAME__;
      const tokensEl = document.querySelector("#go-tokens");
      const tokensVal = tokensEl ? parseInt(tokensEl.textContent || "0", 10) : -1;
      return {
        hasTokensEl: !!tokensEl,
        tokensVal,
        score: g ? g.world.score : 0,
      };
    });

    console.log(`   Tokens in post-run card: ${tokensVerified.tokensVal} 🪙 (from score ${tokensVerified.score})`);
    expectTrue(tokensVerified.hasTokensEl, "Game Over card renders #go-tokens badge");
    expectTrue(tokensVerified.tokensVal >= tokensVerified.score, "Token vault accrued run score");
    console.log("   ✅ Token Economy verified: score deposited into vault successfully.");

    // 8. Check for runtime errors
    console.log("\n🔍 8. Verifying Console Logs & WebGL Status...");
    if (consoleErrors.length > 0) {
      console.error("❌ Console errors detected:", consoleErrors);
      throw new Error(`Found ${consoleErrors.length} console errors`);
    }
    console.log("   ✅ 0 runtime console / WebGL errors.");

    console.log("\n🎉 ============================================================");
    console.log("🏆 ALL AUTOMATED TESTS (RUNNING, SPACEBAR, PIPES, COLLISION) PASSED!");
    console.log("🎉 ============================================================\n");
  } finally {
    await browser.close();
    server.kill();
  }
}

function expectTrue(val, msg) {
  if (!val) throw new Error(`Assertion Failed: ${msg}`);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
