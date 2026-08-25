export interface HudApi {
  setScore: (score: number, pipesPassed?: number, bonusScore?: number) => void;
  setCombo: (combo: number, multiplier: number) => void;
  setFeathers: (count: number) => void;
  setTokens: (tokens: number) => void;
  setTimeSurvived: (seconds: number) => void;
  setSlowmoMeter: (frac: number) => void;
  setFeverMeter: (active: boolean, frac: number) => void;
  setBiomeBadge: (name: string, emoji: string) => void;
  setPowerUps: (
    rainbowLeft: number,
    hasShield: boolean,
    magnetLeft: number,
    heavyGravityLeft?: number,
    speedSurgeLeft?: number,
    chibiLeft?: number,
    chubbyLeft?: number,
  ) => void;
  showPowerUpToast: (icon: string, title: string, benefit: string, color: string) => void;
  showCountdown: (text: string) => void;
  hideCountdown: () => void;
  showMenu: () => void;
  hideMenu: () => void;
  showRewindPrompt: (
    score: number,
    best: number,
    combo: number,
    multiplier: number,
    feathers: number,
    timeSec: number,
    pipesPassed: number,
    bonusScore: number,
    onRewind: () => void,
    onGiveUp: () => void
  ) => void;
  hideRewindPrompt: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function initHud(container: HTMLElement): HudApi {
  const hud = document.createElement("div");
  hud.id = "hud";
  hud.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 30;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  `;

  hud.innerHTML = `
    <!-- Top slow-mo & fever meters -->
    <div id="slowmo-meter-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: rgba(0,0,0,0.4); overflow: hidden;">
      <div id="slowmo-meter-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00e5ff, #00ffc3); box-shadow: 0 0 10px #00e5ff; transition: width 0.05s linear;"></div>
      <div id="fever-meter-bar" style="position: absolute; top: 0; left: 0; width: 0%; height: 100%; background: linear-gradient(90deg, #ff007f, #ffd166, #00f5d4); box-shadow: 0 0 14px #ff007f; transition: width 0.05s linear;"></div>
    </div>

    <!-- Power-Up Pickup Toast Banner (Bottom Center, Zero Top/Hero Overlap) -->
    <div id="hud-powerup-toast" style="position: absolute; bottom: max(24px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%) translateY(20px); opacity: 0; pointer-events: none; z-index: 35; transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.25s ease; display: flex; align-items: center; gap: 8px; background: rgba(10, 15, 30, 0.92); border: 1.5px solid #00e5ff; border-radius: 20px; padding: 6px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(0,229,255,0.3); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); white-space: nowrap;">
      <span id="hud-toast-icon" style="font-size: 18px;">🛡️</span>
      <div style="display: flex; flex-direction: column;">
        <span id="hud-toast-title" style="font-size: 11px; font-weight: 900; color: #fff; letter-spacing: 0.5px; text-transform: uppercase;">SHIELD ACTIVE</span>
        <span id="hud-toast-benefit" style="font-size: 9px; font-weight: 700; color: #00e5ff; letter-spacing: 0.2px;">Blocks 1 fatal crash</span>
      </div>
    </div>

    <!-- Center 3-2-1 Countdown Overlay -->
    <div id="hud-countdown" style="display: none; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 45; flex-direction: column; align-items: center;">
      <div id="hud-countdown-ring" style="width: 110px; height: 110px; border-radius: 55px; background: rgba(10, 16, 32, 0.85); border: 3px solid #00e5ff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(0,229,255,0.6), inset 0 0 20px rgba(0,229,255,0.4); backdrop-filter: blur(16px); animation: popIn 0.3s cubic-bezier(0.2, 0.8, 0.4, 1);">
        <span id="hud-countdown-val" style="font-size: 54px; font-weight: 900; color: #fff; text-shadow: 0 0 24px rgba(0,229,255,0.8); letter-spacing: -0.02em;">3</span>
      </div>
    </div>

    <!-- Header info: Left (Biome + Time) | Center (Score) | Right (Tokens + Feathers) -->
    <div id="hud-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; opacity: 0; transition: opacity 0.25s ease; box-sizing: border-box;">
      
      <!-- Left Anchor: Biome + Time Capsule (Symmetric to right side) -->
      <div id="hud-left" style="flex: 1; display: flex; justify-content: flex-start; align-items: center; min-width: 0;">
        <div id="hud-biome-pill" role="status" aria-label="Current biome and time" style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 800; color: #fff; background: rgba(13, 17, 30, 0.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 5px 10px; border-radius: 18px; border: 1.5px solid rgba(255,255,255,0.18); box-shadow: 0 4px 16px rgba(0,0,0,0.4); max-width: 130px; box-sizing: border-box;">
          <span id="hud-biome-emoji" style="font-size: 14px; line-height: 1;">🌿</span>
          <span id="hud-biome-name" style="font-size: 11px; font-weight: 800; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px;">Meadow</span>
          <span style="color: rgba(255,255,255,0.25); font-size: 10px;">•</span>
          <span id="hud-time-val" style="font-size: 11px; font-weight: 800; color: #00f5d4; font-variant-numeric: tabular-nums;">00:00</span>
        </div>
      </div>

      <!-- Center Anchor: Large Focused Score + Secondary Pipes Counter -->
      <div id="hud-center" style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; pointer-events: none; margin: 0 4px;">
        <div id="hud-score" role="status" aria-label="Current score" style="font-size: clamp(38px, 11vw, 52px); font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 0.92; text-shadow: 0 4px 20px rgba(0,0,0,0.7); letter-spacing: -0.02em;">
          0
        </div>
        <div id="hud-score-sub" style="font-size: 10px; font-weight: 800; color: #cbd5e1; margin-top: 2px; background: rgba(13, 17, 30, 0.65); padding: 1px 7px; border-radius: 7px; text-shadow: 0 1px 4px rgba(0,0,0,0.8); white-space: nowrap;">
          <span id="hud-raw-pipes">0</span> pipes <span id="hud-bonus-tag" style="color: #ffd700; display: none;">(+0)</span>
        </div>
        <div id="hud-combo" style="display: none; margin-top: 3px; background: linear-gradient(135deg, #ff2a6d, #ff6200); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 10px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 2px 10px rgba(255,42,109,0.5); text-transform: uppercase;">
          COMBO ×1
        </div>
        <div id="hud-fever" style="display: none; margin-top: 3px; background: linear-gradient(135deg, #ff007f, #7209b7); color: #fff; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 8px; letter-spacing: 0.5px; animation: softGlowPulse 0.8s infinite alternate; text-transform: uppercase; box-shadow: 0 0 14px #ff007f;">
          🔥 FEVER 2X
        </div>
        <div id="hud-powerup-pills" style="display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap; justify-content: center;">
          <div id="hud-pill-rainbow" style="display: none; font-size: 9px; font-weight: 800; color: #fff; background: linear-gradient(135deg, rgba(255,0,127,0.75), rgba(0,212,255,0.75)); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.35); box-shadow: 0 0 10px rgba(255,0,127,0.45);">
            🌈 3X <span id="hud-pill-rainbow-time">7s</span>
          </div>
          <div id="hud-pill-shield" style="display: none; font-size: 9px; font-weight: 800; color: #ffd700; background: rgba(255,215,0,0.25); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.55); box-shadow: 0 0 10px rgba(255,215,0,0.45);">
            🛡️ SHIELD
          </div>
          <div id="hud-pill-magnet" style="display: none; font-size: 9px; font-weight: 800; color: #00f5d4; background: rgba(0,245,212,0.25); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(0,245,212,0.55); box-shadow: 0 0 10px rgba(0,245,212,0.45);">
            🧲 VACUUM <span id="hud-pill-magnet-time">6s</span>
          </div>
          <div id="hud-pill-gravity" style="display: none; font-size: 9px; font-weight: 800; color: #c77dff; background: rgba(157,78,221,0.28); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(157,78,221,0.65); box-shadow: 0 0 10px rgba(157,78,221,0.45);">
            ⚓ HEAVY <span id="hud-pill-gravity-time">2s</span>
          </div>
          <div id="hud-pill-surge" style="display: none; font-size: 9px; font-weight: 800; color: #ffbe0b; background: rgba(255,136,0,0.28); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,136,0,0.65); box-shadow: 0 0 10px rgba(255,136,0,0.45);">
            ⚡ SURGE 3X <span id="hud-pill-surge-time">2s</span>
          </div>
          <div id="hud-pill-chibi" style="display: none; font-size: 9px; font-weight: 800; color: #55ff99; background: rgba(85,255,153,0.28); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(85,255,153,0.65); box-shadow: 0 0 10px rgba(85,255,153,0.45);">
            🐥 CHIBI <span id="hud-pill-chibi-time">5s</span>
          </div>
          <div id="hud-pill-chubby" style="display: none; font-size: 9px; font-weight: 800; color: #ff66cc; background: rgba(255,102,204,0.28); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,102,204,0.65); box-shadow: 0 0 10px rgba(255,102,204,0.45);">
            🐡 CHUBBY 3X <span id="hud-pill-chubby-time">6s</span>
          </div>
        </div>
      </div>

      <!-- Right Anchor: Tokens + Feathers Bank (Symmetric to left side) -->
      <div id="hud-right" style="flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 6px; min-width: 0;">
        <div id="hud-tokens" role="status" aria-label="Tokens bank" style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 900; color: #ffd700; background: rgba(13, 17, 30, 0.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 5px 10px; border-radius: 18px; border: 1.5px solid rgba(255,215,0,0.45); box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(255,215,0,0.2); box-sizing: border-box;">
          <span style="font-size: 13px; line-height: 1;">🪙</span> <span id="hud-token-count" style="font-size: 12px; font-weight: 900; font-variant-numeric: tabular-nums;">0</span>
        </div>
        <div id="hud-feathers" role="status" aria-label="Feathers available" style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 900; color: #00e5ff; background: rgba(13, 17, 30, 0.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 5px 10px; border-radius: 18px; border: 1.5px solid rgba(0,229,255,0.45); box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(0,229,255,0.25); box-sizing: border-box;">
          <span style="font-size: 13px; line-height: 1;">🪶</span> <span id="hud-feather-count" style="font-size: 12px; font-weight: 900; font-variant-numeric: tabular-nums;">0/3</span>
        </div>
      </div>
    </div>

    <!-- Minimalist, Glancable Rewind Card (Bottom Docked, 100% Sightline Peek) -->
    <div id="hud-rewind-panel" style="display: none; position: absolute; inset: 0; pointer-events: auto; z-index: 48; flex-direction: column; align-items: center; justify-content: flex-end; background: linear-gradient(180deg, transparent 40%, rgba(8, 12, 24, 0.75) 100%); padding: max(16px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); box-sizing: border-box;">
      <div style="text-align: center; max-width: 320px; width: 90%; animation: popIn 0.28s cubic-bezier(0.2, 0.8, 0.4, 1); display: flex; flex-direction: column; align-items: center;">
        
        <!-- High-Impact Primary CTA (Positioned on top for fast ergonomic thumb reach) -->
        <button id="hud-rewind-btn" class="btn interactive" style="width: 100%; height: 54px; font-size: 16px; font-weight: 900; background: linear-gradient(135deg, #00e5ff, #00f5d4); border: none; border-radius: 27px; color: #002233; cursor: pointer; box-shadow: 0 0 28px rgba(0, 229, 255, 0.7); letter-spacing: 0.5px; animation: softGlowPulse 1.2s infinite alternate; touch-action: manipulation; margin-bottom: 12px;">
          ⚡ REWIND & RESUME (−1 🪶)
        </button>

        <!-- High-Glance Score & Stat Capsule -->
        <div style="background: rgba(10, 16, 32, 0.88); border: 1.5px solid rgba(0, 229, 255, 0.45); border-radius: 20px; padding: 14px 18px; width: 100%; box-sizing: border-box; box-shadow: 0 12px 32px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,229,255,0.14); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Total Score</span>
              <div id="hud-rewind-score" style="font-size: 46px; font-weight: 900; line-height: 1; color: #fff; text-shadow: 0 0 20px rgba(0,229,255,0.6); font-variant-numeric: tabular-nums;">0</div>
              <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-top: 2px;">
                <span id="hud-rewind-pipes">0</span> pipes • <span id="hud-rewind-bonus" style="color: #ffd700;">+0 bonus</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
              <div style="background: rgba(255, 215, 0, 0.14); border: 1px solid rgba(255, 215, 0, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">BEST</span>
                <span id="hud-rewind-best" style="font-size: 16px; font-weight: 900; color: #ffd700; font-variant-numeric: tabular-nums;">0</span>
              </div>
              <div style="background: rgba(0, 229, 255, 0.14); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 13px;">🪶</span>
                <span id="hud-rewind-feathers" style="font-size: 15px; font-weight: 900; color: #00e5ff; font-variant-numeric: tabular-nums;">0/3</span>
              </div>
            </div>
          </div>
          <div id="hud-rewind-badge" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-weight: 800; color: #00f5d4; letter-spacing: 0.5px; text-align: left;">
            ⚡ 1.5 SEC SAFE RUNWAY + SHIELD
          </div>
        </div>

        <!-- Tap-Friendly Secondary Give Up Button (Min 44px, safely spaced below scoreboard) -->
        <button id="hud-giveup-btn" class="btn interactive" style="width: 100%; height: 44px; min-height: 44px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 22px; color: #b0b8d0; font-size: 12px; font-weight: 800; margin-top: 10px; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
          GIVE UP & END RUN
        </button>
      </div>
    </div>
  `;

  container.appendChild(hud);

  const toastEl = hud.querySelector("#hud-powerup-toast") as HTMLElement;
  const toastIcon = hud.querySelector("#hud-toast-icon") as HTMLElement;
  const toastTitle = hud.querySelector("#hud-toast-title") as HTMLElement;
  const toastBenefit = hud.querySelector("#hud-toast-benefit") as HTMLElement;
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  const countdownContainer = hud.querySelector("#hud-countdown") as HTMLElement;
  const countdownVal = hud.querySelector("#hud-countdown-val") as HTMLElement;
  const countdownRing = hud.querySelector("#hud-countdown-ring") as HTMLElement;
  let countdownTimeout: ReturnType<typeof setTimeout> | null = null;

  const rawPipesEl = hud.querySelector("#hud-raw-pipes") as HTMLElement;
  const bonusTagEl = hud.querySelector("#hud-bonus-tag") as HTMLElement;

  const headerEl = hud.querySelector("#hud-header") as HTMLElement;
  const scoreEl = hud.querySelector("#hud-score")!;
  const comboEl = hud.querySelector("#hud-combo") as HTMLElement;
  const feverEl = hud.querySelector("#hud-fever") as HTMLElement;
  const timeVal = hud.querySelector("#hud-time-val") as HTMLElement;
  const featherEl = hud.querySelector("#hud-feather-count")!;
  const tokenEl = hud.querySelector("#hud-token-count")!;
  const biomeEmoji = hud.querySelector("#hud-biome-emoji")!;
  const biomeName = hud.querySelector("#hud-biome-name")!;
  const slowmoBar = hud.querySelector("#slowmo-meter-bar") as HTMLElement;
  const feverBar = hud.querySelector("#fever-meter-bar") as HTMLElement;

  // Rewind modal elements
  const rewindPanel = hud.querySelector("#hud-rewind-panel") as HTMLElement;
  const rewindBadge = hud.querySelector("#hud-rewind-badge") as HTMLElement;
  const rewindScore = hud.querySelector("#hud-rewind-score") as HTMLElement;
  const rewindPipesEl = hud.querySelector("#hud-rewind-pipes") as HTMLElement;
  const rewindBonusEl = hud.querySelector("#hud-rewind-bonus") as HTMLElement;
  const rewindBest = hud.querySelector("#hud-rewind-best") as HTMLElement;
  const rewindFeathers = hud.querySelector("#hud-rewind-feathers") as HTMLElement;
  const rewindBtn = hud.querySelector("#hud-rewind-btn") as HTMLButtonElement;
  const giveUpBtn = hud.querySelector("#hud-giveup-btn") as HTMLButtonElement;

  const rainbowPill = hud.querySelector("#hud-pill-rainbow") as HTMLElement;
  const rainbowTime = hud.querySelector("#hud-pill-rainbow-time") as HTMLElement;
  const shieldPill = hud.querySelector("#hud-pill-shield") as HTMLElement;
  const magnetPill = hud.querySelector("#hud-pill-magnet") as HTMLElement;
  const magnetTime = hud.querySelector("#hud-pill-magnet-time") as HTMLElement;
  const gravityPill = hud.querySelector("#hud-pill-gravity") as HTMLElement;
  const gravityTime = hud.querySelector("#hud-pill-gravity-time") as HTMLElement;
  const surgePill = hud.querySelector("#hud-pill-surge") as HTMLElement;
  const surgeTime = hud.querySelector("#hud-pill-surge-time") as HTMLElement;
  const chibiPill = hud.querySelector("#hud-pill-chibi") as HTMLElement;
  const chibiTime = hud.querySelector("#hud-pill-chibi-time") as HTMLElement;
  const chubbyPill = hud.querySelector("#hud-pill-chubby") as HTMLElement;
  const chubbyTime = hud.querySelector("#hud-pill-chubby-time") as HTMLElement;

  return {
    setScore(score: number, pipesPassed = score, bonusScore = 0) {
      scoreEl.textContent = score.toString();
      if (rawPipesEl) rawPipesEl.textContent = pipesPassed.toString();
      if (bonusTagEl) {
        if (bonusScore > 0) {
          bonusTagEl.style.display = "inline";
          bonusTagEl.textContent = `(+${bonusScore} bonus)`;
        } else {
          bonusTagEl.style.display = "none";
        }
      }
    },
    setCombo(combo: number, multiplier: number) {
      if (combo > 0) {
        comboEl.style.display = "block";
        comboEl.textContent = `COMBO ×${multiplier} (${combo})`;
      } else {
        comboEl.style.display = "none";
      }
    },
    setFeathers(count: number) {
      featherEl.textContent = `${count}/3`;
    },
    setTokens(tokens: number) {
      if (tokenEl) tokenEl.textContent = tokens.toString();
    },
    setTimeSurvived(seconds: number) {
      timeVal.textContent = formatTime(seconds);
    },
    setSlowmoMeter(frac: number) {
      const pct = Math.max(0, Math.min(1, frac)) * 100;
      slowmoBar.style.width = `${pct}%`;
    },
    setFeverMeter(active: boolean, frac: number) {
      const pct = Math.max(0, Math.min(1, frac)) * 100;
      feverBar.style.width = `${pct}%`;
      feverEl.style.display = active ? "block" : "none";
    },
    setBiomeBadge(name: string, emoji: string) {
      const shortName = name
        .replace("Emerald ", "")
        .replace("Neon ", "")
        .replace(" Kingdom", "")
        .replace(" Rift", "");
      biomeName.textContent = shortName;
      biomeEmoji.textContent = emoji;
    },
    setPowerUps(
      rainbowLeft: number,
      hasShield: boolean,
      magnetLeft: number,
      heavyGravityLeft = 0,
      speedSurgeLeft = 0,
      chibiLeft = 0,
      chubbyLeft = 0,
    ) {
      if (rainbowLeft > 0) {
        rainbowPill.style.display = "block";
        rainbowTime.textContent = `${Math.ceil(rainbowLeft)}s`;
      } else {
        rainbowPill.style.display = "none";
      }

      shieldPill.style.display = hasShield ? "block" : "none";

      if (magnetLeft > 0) {
        magnetPill.style.display = "block";
        magnetTime.textContent = `${Math.ceil(magnetLeft)}s`;
      } else {
        magnetPill.style.display = "none";
      }

      if (heavyGravityLeft > 0) {
        gravityPill.style.display = "block";
        gravityTime.textContent = `${Math.ceil(heavyGravityLeft)}s`;
      } else {
        gravityPill.style.display = "none";
      }

      if (speedSurgeLeft > 0) {
        surgePill.style.display = "block";
        surgeTime.textContent = `${Math.ceil(speedSurgeLeft)}s`;
      } else {
        surgePill.style.display = "none";
      }

      if (chibiLeft > 0) {
        chibiPill.style.display = "block";
        chibiTime.textContent = `${Math.ceil(chibiLeft)}s`;
      } else {
        chibiPill.style.display = "none";
      }

      if (chubbyLeft > 0) {
        chubbyPill.style.display = "block";
        chubbyTime.textContent = `${Math.ceil(chubbyLeft)}s`;
      } else {
        chubbyPill.style.display = "none";
      }
    },
    showPowerUpToast(icon: string, title: string, benefit: string, color: string) {
      if (toastTimeout) clearTimeout(toastTimeout);

      toastIcon.textContent = icon;
      toastTitle.textContent = title;
      toastBenefit.textContent = benefit;
      toastBenefit.style.color = color;
      toastEl.style.borderColor = color;
      toastEl.style.boxShadow = `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${color}55`;

      toastEl.style.opacity = "1";
      toastEl.style.transform = "translateX(-50%) translateY(0px)";

      toastTimeout = setTimeout(() => {
        toastEl.style.opacity = "0";
        toastEl.style.transform = "translateX(-50%) translateY(20px)";
      }, 1400);
    },
    showCountdown(text: string) {
      if (countdownTimeout) {
        clearTimeout(countdownTimeout);
        countdownTimeout = null;
      }
      countdownVal.textContent = text;
      countdownContainer.style.display = "flex";
      countdownContainer.style.opacity = "1";
      countdownRing.style.animation = "none";
      void countdownRing.offsetWidth; // trigger reflow
      countdownRing.style.animation = "popIn 0.3s cubic-bezier(0.2, 0.8, 0.4, 1)";

      if (text === "FLAP!") {
        countdownRing.style.borderColor = "#00f5d4";
        countdownRing.style.boxShadow = "0 0 50px rgba(0,245,212,0.85), inset 0 0 25px rgba(0,245,212,0.5)";
        countdownVal.style.fontSize = "38px";
        countdownVal.style.color = "#00f5d4";
        // Hold FLAP! prominently for 0.7s with smooth ease out so it's clearly readable!
        countdownTimeout = setTimeout(() => {
          countdownContainer.style.transition = "opacity 0.35s ease, transform 0.35s ease";
          countdownContainer.style.opacity = "0";
          setTimeout(() => {
            countdownContainer.style.display = "none";
            countdownContainer.style.transition = "";
            countdownTimeout = null;
          }, 350);
        }, 650);
      } else {
        countdownRing.style.borderColor = "#00e5ff";
        countdownRing.style.boxShadow = "0 0 40px rgba(0,229,255,0.6), inset 0 0 20px rgba(0,229,255,0.4)";
        countdownVal.style.fontSize = "54px";
        countdownVal.style.color = "#fff";
      }
    },
    hideCountdown() {
      if (!countdownTimeout) {
        countdownContainer.style.display = "none";
      }
    },
    showMenu() {
      headerEl.style.opacity = "0";
      if (toastTimeout) clearTimeout(toastTimeout);
      toastEl.style.opacity = "0";
      countdownContainer.style.display = "none";
      rewindPanel.style.display = "none";
    },
    hideMenu() {
      headerEl.style.opacity = "1";
    },
    showRewindPrompt(
      score: number,
      best: number,
      _combo: number,
      _multiplier: number,
      feathers: number,
      _timeSec: number,
      pipesPassed = score,
      bonusScore = 0,
      onRewind: () => void,
      onGiveUp: () => void,
    ) {
      const effectiveBest = Math.max(score, best);
      rewindScore.textContent = score.toString();
      if (rewindPipesEl) rewindPipesEl.textContent = pipesPassed.toString();
      if (rewindBonusEl) rewindBonusEl.textContent = `+${bonusScore} bonus`;
      rewindBest.textContent = effectiveBest.toString();
      rewindFeathers.textContent = `${feathers}/3`;

      // Minimal, truthful, glanceable context tag
      if (score >= best && score > 0) {
        rewindBadge.textContent = "★ PROTECT NEW BEST RUN";
        rewindBadge.style.color = "#ffd700";
      } else if (best - score <= 20 && best - score > 0) {
        rewindBadge.textContent = `★ ${best - score} PTS TO BEST RECORD`;
        rewindBadge.style.color = "#00f5d4";
      } else {
        rewindBadge.textContent = "⚡ 1.5 SEC SAFE RUNWAY + BULLET-TIME";
        rewindBadge.style.color = "#00e5ff";
      }

      if (feathers > 0) {
        giveUpBtn.style.display = "block";
        giveUpBtn.textContent = "SAVE FEATHERS & END RUN";
        rewindBtn.style.display = "block";
        rewindBtn.innerHTML = "⚡ REWIND & RESUME (−1 🪶)";
      } else {
        giveUpBtn.style.display = "block";
        giveUpBtn.textContent = "VIEW FINAL RESULTS";
        rewindBtn.style.display = "none";
      }

      rewindPanel.style.display = "flex";
      rewindBtn.onclick = (e) => {
        e.stopPropagation();
        rewindPanel.style.display = "none";
        onRewind();
      };
      giveUpBtn.onclick = (e) => {
        e.stopPropagation();
        rewindPanel.style.display = "none";
        onGiveUp();
      };
    },
    hideRewindPrompt() {
      rewindPanel.style.display = "none";
    },
  };
}
