export interface HudApi {
  setScore: (score: number) => void;
  setCombo: (combo: number, multiplier: number) => void;
  setFeathers: (count: number) => void;
  setSlowmoMeter: (frac: number) => void;
  showMenu: () => void;
  hideMenu: () => void;
  showRewindPrompt: (feathers: number, onRewind: () => void, onGiveUp: () => void) => void;
  hideRewindPrompt: () => void;
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
    padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  `;

  hud.innerHTML = `
    <!-- Top slow-mo meter bar -->
    <div id="slowmo-meter-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: rgba(0,0,0,0.4); overflow: hidden;">
      <div id="slowmo-meter-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00e5ff, #00ffc3); box-shadow: 0 0 10px #00e5ff; transition: width 0.05s linear;"></div>
    </div>

    <!-- Header info: Score, Combo, Feathers -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
      <!-- Left spacer -->
      <div style="width: 60px;"></div>

      <!-- Center: Big Score + Combo Badge -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div id="hud-score" style="font-size: 64px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; text-shadow: 0 4px 16px rgba(0,0,0,0.6);">
          0
        </div>
        <div id="hud-combo" style="display: none; margin-top: 6px; background: linear-gradient(135deg, #ff2a6d, #ff6200); color: #fff; font-size: 14px; font-weight: 900; padding: 4px 14px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 2px 10px rgba(255,42,109,0.5); text-transform: uppercase;">
          COMBO ×1
        </div>
      </div>

      <!-- Right: Feathers -->
      <div id="hud-feathers" style="display: flex; align-items: center; gap: 4px; font-size: 20px; font-weight: 800; color: #00e5ff; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 16px; border: 1px solid rgba(0,229,255,0.3);">
        <span>🪶</span> <span id="hud-feather-count">0</span>
      </div>
    </div>

    <!-- Center Tap prompt -->
    <div id="hud-menu-panel" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: auto; text-align: center;">
      <h1 style="font-size: 42px; font-weight: 900; margin: 0 0 8px 0; color: #ffd700; letter-spacing: 2px; text-shadow: 0 4px 20px rgba(255,215,0,0.5);">
        FLAPPY CAT 🐾
      </h1>
      <div style="font-size: 16px; font-weight: 700; color: #ffffff; background: rgba(0,0,0,0.4); padding: 8px 18px; border-radius: 20px; letter-spacing: 1px; animation: pulse 1.5s infinite alternate;">
        TAP TO FLY
      </div>
    </div>

    <!-- Rewind Choice Panel (Bottom overlay) -->
    <div id="hud-rewind-panel" style="display: none; pointer-events: auto; flex-direction: column; align-items: center; background: rgba(10, 16, 36, 0.92); border: 2px solid #00e5ff; border-radius: 24px; padding: 24px 20px; margin: auto auto 20px auto; width: 90%; max-width: 320px; box-shadow: 0 0 30px rgba(0,229,255,0.4); backdrop-filter: blur(12px);">
      <div style="font-size: 14px; font-weight: 900; color: #00e5ff; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
        TIME REWIND READY
      </div>
      <div id="hud-rewind-subtitle" style="font-size: 13px; color: #ccd; margin-bottom: 18px; text-align: center;">
        Rewind 1.5s before crash?
      </div>
      <div style="display: flex; gap: 12px; width: 100%;">
        <button id="hud-rewind-btn" class="btn interactive" style="flex: 2; height: 56px; border: none; border-radius: 28px; background: linear-gradient(135deg, #00e5ff, #0088cc); color: #002233; font-size: 16px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 16px rgba(0,229,255,0.5);">
          REWIND (−1 🪶)
        </button>
        <button id="hud-giveup-btn" class="btn interactive" style="flex: 1; height: 56px; border: 1px solid rgba(255,255,255,0.2); border-radius: 28px; background: rgba(255,255,255,0.08); color: #bbb; font-size: 14px; font-weight: 700; cursor: pointer;">
          GIVE UP
        </button>
      </div>
    </div>
  `;

  container.appendChild(hud);

  const scoreEl = hud.querySelector("#hud-score")!;
  const comboEl = hud.querySelector("#hud-combo") as HTMLElement;
  const featherEl = hud.querySelector("#hud-feather-count")!;
  const slowmoBar = hud.querySelector("#slowmo-meter-bar") as HTMLElement;
  const menuPanel = hud.querySelector("#hud-menu-panel") as HTMLElement;
  const rewindPanel = hud.querySelector("#hud-rewind-panel") as HTMLElement;
  const rewindSubtitle = hud.querySelector("#hud-rewind-subtitle") as HTMLElement;
  const rewindBtn = hud.querySelector("#hud-rewind-btn") as HTMLButtonElement;
  const giveUpBtn = hud.querySelector("#hud-giveup-btn") as HTMLButtonElement;

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
    setSlowmoMeter(frac: number) {
      const pct = Math.max(0, Math.min(1, frac)) * 100;
      slowmoBar.style.width = `${pct}%`;
    },
    showMenu() {
      menuPanel.style.display = "flex";
    },
    hideMenu() {
      menuPanel.style.display = "none";
    },
    showRewindPrompt(feathers: number, onRewind: () => void, onGiveUp: () => void) {
      rewindSubtitle.textContent = `Rewind 1.5s before crash? (${feathers} 🪶 available)`;
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
