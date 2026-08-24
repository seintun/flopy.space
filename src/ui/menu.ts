import { loadAll, setSkin, setMuted, SKINS, touchStreak } from "../core/storage";

export interface MenuCallbacks {
  onStart: () => void;
  onSkinChange: (skinId: string) => void;
  onMuteToggle: (muted: boolean) => void;
}

export class MenuView {
  private el: HTMLElement;
  private streakEl: HTMLElement;
  private bestEl: HTMLElement;
  private muteBtn: HTMLElement;
  private skinListEl: HTMLElement;

  constructor(container: HTMLElement, private callbacks: MenuCallbacks) {
    this.el = document.createElement("div");
    this.el.id = "main-menu";
    this.el.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      z-index: 40;
      color: #fff;
      padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
      box-sizing: border-box;
      pointer-events: none;
    `;

    this.el.innerHTML = `
      <!-- Top header bar: Streak & Mute -->
      <div style="display: flex; justify-content: space-between; width: 100%; pointer-events: auto;">
        <div id="menu-streak" style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); padding: 8px 14px; border-radius: 20px; border: 1px solid rgba(255,120,0,0.3); font-weight: 800; font-size: 14px; color: #ff9e00;">
          🔥 <span id="menu-streak-count">1</span> Day Streak
        </div>
        <button id="menu-mute-btn" class="btn interactive" style="background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 18px; width: 44px; height: 44px; border-radius: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          🔊
        </button>
      </div>

      <!-- Center Title & Tap Prompt -->
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; margin-top: -30px;">
        <h1 style="font-size: 48px; font-weight: 900; margin: 0 0 6px 0; color: #ffd700; letter-spacing: 2px; text-shadow: 0 4px 24px rgba(255,215,0,0.6); text-align: center;">
          FLAPPY CAT 🐾
        </h1>
        <div id="menu-best-label" style="font-size: 14px; font-weight: 800; color: #00e5ff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; background: rgba(0,0,0,0.35); padding: 4px 14px; border-radius: 12px;">
          Best: <span id="menu-best-val">0</span>
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #fff; background: rgba(0,229,255,0.2); border: 1px solid rgba(0,229,255,0.4); padding: 10px 24px; border-radius: 24px; letter-spacing: 1px; animation: pulse 1.4s infinite alternate; text-shadow: 0 0 10px rgba(0,229,255,0.8);">
          TAP SCREEN TO FLY
        </div>
      </div>

      <!-- Bottom Skins Selector -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: auto; margin-bottom: 8px;">
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #ccd; margin-bottom: 8px;">
          Cat Skin
        </div>
        <div id="menu-skin-list" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; max-width: 320px;">
          <!-- Dynamically populated skins -->
        </div>
      </div>
    `;

    container.appendChild(this.el);

    this.streakEl = this.el.querySelector("#menu-streak-count")!;
    this.bestEl = this.el.querySelector("#menu-best-val")!;
    this.muteBtn = this.el.querySelector("#menu-mute-btn")!;
    this.skinListEl = this.el.querySelector("#menu-skin-list")!;

    this.muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const current = loadAll().muted;
      const next = !current;
      setMuted(next);
      this.muteBtn.textContent = next ? "🔇" : "🔊";
      this.callbacks.onMuteToggle(next);
    });

    this.refresh();
  }

  refresh(): void {
    const data = loadAll();
    const streak = touchStreak();
    this.streakEl.textContent = streak.toString();
    this.bestEl.textContent = data.best.toString();
    this.muteBtn.textContent = data.muted ? "🔇" : "🔊";

    this.skinListEl.innerHTML = "";
    Object.values(SKINS).forEach((skin) => {
      const isUnlocked = data.unlocked.includes(skin.id);
      const isSelected = data.skin === skin.id;

      const chip = document.createElement("button");
      chip.className = "btn interactive";
      chip.style.cssText = `
        border: 2px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"};
        background: ${isSelected ? "rgba(0,229,255,0.2)" : "rgba(0,0,0,0.5)"};
        color: ${isUnlocked ? "#fff" : "#778"};
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 800;
        cursor: ${isUnlocked ? "pointer" : "default"};
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: ${isSelected ? "0 0 12px rgba(0,229,255,0.4)" : "none"};
      `;

      chip.innerHTML = `
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#${skin.bodyColor.toString(16).padStart(6, "0")};"></span>
        ${skin.name} ${isUnlocked ? "" : `🔒${skin.unlockScore}`}
      `;

      if (isUnlocked) {
        chip.onclick = (e) => {
          e.stopPropagation();
          setSkin(skin.id);
          this.callbacks.onSkinChange(skin.id);
          this.refresh();
        };
      }

      this.skinListEl.appendChild(chip);
    });
  }

  show(): void {
    this.refresh();
    this.el.style.display = "flex";
  }

  hide(): void {
    this.el.style.display = "none";
  }
}
