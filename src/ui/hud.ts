export interface HudApi {
  setScore: (score: number) => void;
  setCombo: (combo: number, multiplier: number) => void;
  setFeathers: (count: number) => void;
  setSlowmoMeter: (frac: number) => void;
  setFeverMeter: (active: boolean, frac: number) => void;
  setBiomeBadge: (name: string, emoji: string) => void;
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
    <!-- Top slow-mo & fever meters -->
    <div id="slowmo-meter-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: rgba(0,0,0,0.4); overflow: hidden;">
      <div id="slowmo-meter-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00e5ff, #00ffc3); box-shadow: 0 0 10px #00e5ff; transition: width 0.05s linear;"></div>
      <div id="fever-meter-bar" style="position: absolute; top: 0; left: 0; width: 0%; height: 100%; background: linear-gradient(90deg, #ff007f, #ffd166, #00f5d4); box-shadow: 0 0 14px #ff007f; transition: width 0.05s linear;"></div>
    </div>

    <!-- Header info: Biome badge, Score, Combo, Feathers -->
    <div id="hud-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; opacity: 0; transition: opacity 0.25s ease;">
      <!-- Left: Biome badge -->
      <div id="hud-biome" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #fff; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <span id="hud-biome-emoji">🌿</span> <span id="hud-biome-name">Meadow</span>
      </div>

      <!-- Center: Big Score + Combo Badge + Fever Alert -->
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
        <div id="hud-score" style="font-size: 58px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; text-shadow: 0 4px 20px rgba(0,0,0,0.7); letter-spacing: -0.02em;">
          0
        </div>
        <div id="hud-combo" style="display: none; margin-top: 6px; background: linear-gradient(135deg, #ff2a6d, #ff6200); color: #fff; font-size: 13px; font-weight: 800; padding: 4px 14px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 2px 12px rgba(255,42,109,0.5); text-transform: uppercase;">
          COMBO ×1
        </div>
        <div id="hud-fever" style="display: none; margin-top: 5px; background: linear-gradient(135deg, #ff007f, #7209b7); color: #fff; font-size: 11px; font-weight: 900; padding: 4px 14px; border-radius: 12px; letter-spacing: 1px; animation: softGlowPulse 0.8s infinite alternate; text-transform: uppercase; box-shadow: 0 0 16px #ff007f;">
          🔥 FEVER RUSH 2X
        </div>
      </div>

      <!-- Right: Feathers -->
      <div id="hud-feathers" style="display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 800; color: #00e5ff; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(0,229,255,0.3); box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <span>🪶</span> <span id="hud-feather-count">0</span>
      </div>
    </div>

    <!-- Rewind Choice Panel (Bottom overlay) -->
    <div id="hud-rewind-panel" style="display: none; pointer-events: auto; flex-direction: column; align-items: center; background: rgba(10, 16, 32, 0.92); border: 1.5px solid rgba(0, 229, 255, 0.6); border-radius: 24px; padding: 24px 20px; margin: auto auto 24px auto; width: 90%; max-width: 340px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 28px rgba(0,229,255,0.35); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); animation: popIn 0.3s cubic-bezier(0.2, 0.8, 0.4, 1);">
      <div style="font-size: 13px; font-weight: 900; color: #00e5ff; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
        TIME REWIND READY
      </div>
      <div id="hud-rewind-subtitle" style="font-size: 13px; color: #b0b8d0; margin-bottom: 18px; text-align: center;">
        Rewind 1.5s before crash?
      </div>
      <div style="display: flex; gap: 10px; width: 100%;">
        <button id="hud-rewind-btn" class="btn interactive" style="flex: 2; height: 52px; border: none; border-radius: 26px; background: linear-gradient(135deg, #00e5ff, #0088cc); color: #002233; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 18px rgba(0,229,255,0.45); letter-spacing: 0.5px;">
          REWIND (−1 🪶)
        </button>
        <button id="hud-giveup-btn" class="btn interactive" style="flex: 1; height: 52px; border: 1px solid rgba(255,255,255,0.15); border-radius: 26px; background: rgba(255,255,255,0.06); color: #9aa0b8; font-size: 13px; font-weight: 700; cursor: pointer;">
          GIVE UP
        </button>
      </div>
    </div>
  `;

  container.appendChild(hud);

  const headerEl = hud.querySelector("#hud-header") as HTMLElement;
  const scoreEl = hud.querySelector("#hud-score")!;
  const comboEl = hud.querySelector("#hud-combo") as HTMLElement;
  const feverEl = hud.querySelector("#hud-fever") as HTMLElement;
  const featherEl = hud.querySelector("#hud-feather-count")!;
  const biomeEmoji = hud.querySelector("#hud-biome-emoji")!;
  const biomeName = hud.querySelector("#hud-biome-name")!;
  const slowmoBar = hud.querySelector("#slowmo-meter-bar") as HTMLElement;
  const feverBar = hud.querySelector("#fever-meter-bar") as HTMLElement;
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
    setFeverMeter(active: boolean, frac: number) {
      const pct = Math.max(0, Math.min(1, frac)) * 100;
      feverBar.style.width = `${pct}%`;
      feverEl.style.display = active ? "block" : "none";
    },
    setBiomeBadge(name: string, emoji: string) {
      biomeName.textContent = name;
      biomeEmoji.textContent = emoji;
    },
    showMenu() {
      headerEl.style.opacity = "0";
    },
    hideMenu() {
      headerEl.style.opacity = "1";
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
