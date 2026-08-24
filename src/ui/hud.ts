export interface HudApi {
  setScore: (score: number) => void;
  setCombo: (combo: number, multiplier: number) => void;
  setFeathers: (count: number) => void;
  setTimeSurvived: (seconds: number) => void;
  setSlowmoMeter: (frac: number) => void;
  setFeverMeter: (active: boolean, frac: number) => void;
  setBiomeBadge: (name: string, emoji: string) => void;
  setPowerUps: (rainbowLeft: number, hasShield: boolean, magnetLeft: number) => void;
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

    <!-- Header info: Biome badge, Score, Combo, Survival Time, Feathers -->
    <div id="hud-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; opacity: 0; transition: opacity 0.25s ease;">
      <!-- Left: Compact Biome badge -->
      <div id="hud-biome" style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #fff; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 4px 10px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 4px 16px rgba(0,0,0,0.3); max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <span id="hud-biome-emoji">🌿</span> <span id="hud-biome-name">Meadow</span>
      </div>

      <!-- Center: Compact Score + Combo Badge + Fever Alert + Power-up Badges -->
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
        <div id="hud-score" style="font-size: clamp(42px, 11vw, 56px); font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 0.95; text-shadow: 0 4px 20px rgba(0,0,0,0.7); letter-spacing: -0.02em;">
          0
        </div>
        <div id="hud-combo" style="display: none; margin-top: 4px; background: linear-gradient(135deg, #ff2a6d, #ff6200); color: #fff; font-size: 11px; font-weight: 800; padding: 3px 12px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 10px rgba(255,42,109,0.5); text-transform: uppercase;">
          COMBO ×1
        </div>
        <div id="hud-fever" style="display: none; margin-top: 3px; background: linear-gradient(135deg, #ff007f, #7209b7); color: #fff; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 10px; letter-spacing: 1px; animation: softGlowPulse 0.8s infinite alternate; text-transform: uppercase; box-shadow: 0 0 14px #ff007f;">
          🔥 FEVER RUSH 2X
        </div>
        <div id="hud-powerup-pills" style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; justify-content: center;">
          <div id="hud-pill-rainbow" style="display: none; font-size: 10px; font-weight: 800; color: #fff; background: linear-gradient(135deg, rgba(255,0,127,0.75), rgba(0,212,255,0.75)); padding: 3px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.35); box-shadow: 0 0 10px rgba(255,0,127,0.45);">
            🌈 TRAIL 3X <span id="hud-pill-rainbow-time">7s</span>
          </div>
          <div id="hud-pill-shield" style="display: none; font-size: 10px; font-weight: 800; color: #ffd700; background: rgba(255,215,0,0.25); padding: 3px 10px; border-radius: 10px; border: 1px solid rgba(255,215,0,0.55); box-shadow: 0 0 10px rgba(255,215,0,0.45);">
            🛡️ 1-HIT GUARD
          </div>
          <div id="hud-pill-magnet" style="display: none; font-size: 10px; font-weight: 800; color: #00f5d4; background: rgba(0,245,212,0.25); padding: 3px 10px; border-radius: 10px; border: 1px solid rgba(0,245,212,0.55); box-shadow: 0 0 10px rgba(0,245,212,0.45);">
            🧲 VACUUM <span id="hud-pill-magnet-time">6s</span>
          </div>
        </div>
      </div>

      <!-- Right: Time Survived & Feathers -->
      <div style="display: flex; gap: 6px; align-items: center;">
        <div id="hud-time" style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #fff; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 4px 10px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          ⏱️ <span id="hud-time-val">00:00</span>
        </div>
        <div id="hud-feathers" style="display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; color: #00e5ff; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 4px 10px; border-radius: 16px; border: 1px solid rgba(0,229,255,0.3); box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          <span>🪶</span> <span id="hud-feather-count">0</span>
        </div>
      </div>
    </div>

    <!-- Minimalist, Glancable Rewind Card (Bottom Docked, 100% Sightline Peek) -->
    <div id="hud-rewind-panel" style="display: none; position: absolute; inset: 0; pointer-events: auto; z-index: 48; flex-direction: column; align-items: center; justify-content: flex-end; background: linear-gradient(180deg, transparent 40%, rgba(8, 12, 24, 0.75) 100%); padding: max(16px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); box-sizing: border-box;">
      <div style="text-align: center; max-width: 320px; width: 90%; animation: popIn 0.28s cubic-bezier(0.2, 0.8, 0.4, 1); display: flex; flex-direction: column; align-items: center;">
        
        <!-- Score Capsule -->
        <div style="background: rgba(10, 16, 32, 0.85); border: 1.5px solid rgba(0, 229, 255, 0.4); border-radius: 20px; padding: 12px 18px; width: 100%; box-sizing: border-box; margin-bottom: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,229,255,0.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <div id="hud-rewind-score" style="font-size: 42px; font-weight: 900; line-height: 1; color: #fff; text-shadow: 0 0 16px rgba(0,229,255,0.6); font-variant-numeric: tabular-nums;">0</div>
            <div style="display: flex; gap: 10px; font-size: 12px; font-weight: 800;">
              <span style="color: #94a3b8;">BEST <span id="hud-rewind-best" style="color: #ffd700;">0</span></span>
              <span id="hud-rewind-feathers" style="color: #00e5ff;">🪶 0</span>
            </div>
          </div>
          <div id="hud-rewind-badge" style="font-size: 10px; font-weight: 800; color: #00f5d4; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
            ⚡ 1.5s Safe Runway + Shield
          </div>
        </div>

        <!-- High-Impact Primary CTA -->
        <button id="hud-rewind-btn" class="btn interactive" style="width: 100%; height: 50px; font-size: 15px; font-weight: 900; background: linear-gradient(135deg, #00e5ff, #00f5d4); border: none; border-radius: 25px; color: #002233; cursor: pointer; box-shadow: 0 0 24px rgba(0, 229, 255, 0.6); letter-spacing: 0.5px; animation: softGlowPulse 1.2s infinite alternate;">
          ⚡ REWIND (−1 🪶)
        </button>

        <!-- Minimal Subdued Dismiss Link -->
        <button id="hud-giveup-btn" class="btn interactive" style="background: none; border: none; color: #94a3b8; font-size: 11px; font-weight: 700; padding: 8px 16px; margin-top: 4px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;">
          Give up
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

  const headerEl = hud.querySelector("#hud-header") as HTMLElement;
  const scoreEl = hud.querySelector("#hud-score")!;
  const comboEl = hud.querySelector("#hud-combo") as HTMLElement;
  const feverEl = hud.querySelector("#hud-fever") as HTMLElement;
  const timeVal = hud.querySelector("#hud-time-val") as HTMLElement;
  const featherEl = hud.querySelector("#hud-feather-count")!;
  const biomeEmoji = hud.querySelector("#hud-biome-emoji")!;
  const biomeName = hud.querySelector("#hud-biome-name")!;
  const slowmoBar = hud.querySelector("#slowmo-meter-bar") as HTMLElement;
  const feverBar = hud.querySelector("#fever-meter-bar") as HTMLElement;

  // Rewind modal elements
  const rewindPanel = hud.querySelector("#hud-rewind-panel") as HTMLElement;
  const rewindBadge = hud.querySelector("#hud-rewind-badge") as HTMLElement;
  const rewindScore = hud.querySelector("#hud-rewind-score") as HTMLElement;
  const rewindBest = hud.querySelector("#hud-rewind-best") as HTMLElement;
  const rewindFeathers = hud.querySelector("#hud-rewind-feathers") as HTMLElement;
  const rewindBtn = hud.querySelector("#hud-rewind-btn") as HTMLButtonElement;
  const giveUpBtn = hud.querySelector("#hud-giveup-btn") as HTMLButtonElement;

  const rainbowPill = hud.querySelector("#hud-pill-rainbow") as HTMLElement;
  const rainbowTime = hud.querySelector("#hud-pill-rainbow-time") as HTMLElement;
  const shieldPill = hud.querySelector("#hud-pill-shield") as HTMLElement;
  const magnetPill = hud.querySelector("#hud-pill-magnet") as HTMLElement;
  const magnetTime = hud.querySelector("#hud-pill-magnet-time") as HTMLElement;

  return {
    setScore(score: number) {
      scoreEl.textContent = score.toString();
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
      featherEl.textContent = count.toString();
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
      biomeName.textContent = name;
      biomeEmoji.textContent = emoji;
    },
    setPowerUps(rainbowLeft: number, hasShield: boolean, magnetLeft: number) {
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
      countdownVal.textContent = text;
      countdownContainer.style.display = "flex";
      countdownRing.style.animation = "none";
      void countdownRing.offsetWidth; // trigger reflow
      countdownRing.style.animation = "popIn 0.3s cubic-bezier(0.2, 0.8, 0.4, 1)";
    },
    hideCountdown() {
      countdownContainer.style.display = "none";
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
      combo: number,
      multiplier: number,
      feathers: number,
      _timeSec: number,
      onRewind: () => void,
      onGiveUp: () => void,
    ) {
      rewindScore.textContent = score.toString();
      rewindBest.textContent = best.toString();
      rewindFeathers.textContent = `🪶 ${feathers}`;

      // Minimal, glanceable context tag
      if (combo >= 3) {
        rewindBadge.textContent = `★ KEEP ×${multiplier} COMBO (${combo} STREAK)`;
        rewindBadge.style.color = "#ff007f";
      } else if (score >= best && score > 0) {
        rewindBadge.textContent = "★ NEW RECORD RUN";
        rewindBadge.style.color = "#ffd700";
      } else if (best - score <= 20 && best - score > 0) {
        rewindBadge.textContent = `★ ${best - score} PTS TO BEST`;
        rewindBadge.style.color = "#00f5d4";
      } else {
        rewindBadge.textContent = "⚡ 1.5S RUNWAY + INVULNERABILITY";
        rewindBadge.style.color = "#00e5ff";
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
