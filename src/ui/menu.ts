import {
  loadAll,
  setSkin,
  setCharacter,
  setBiome,
  setMuted,
  SKINS,
  touchStreak,
  getStoredMissions,
  saveStoredMissions,
  bankFeathers,
} from "../core/storage";
import { CHARACTERS, type CharacterId, isCharacterUnlocked } from "../core/characters";
import { BIOMES, type BiomeId } from "../core/biomes";

export interface MenuCallbacks {
  onStart: () => void;
  onCharacterChange: (charId: CharacterId) => void;
  onSkinChange: (skinId: string) => void;
  onBiomeChange: (biomeId: BiomeId | "auto") => void;
  onMuteToggle: (muted: boolean) => void;
  onMissionClaim?: () => void;
  onToast?: (msg: string) => void;
}

function enableDragScroll(el: HTMLElement): void {
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasMoved = false;

  el.classList.add("drag-scroll");

  el.addEventListener("pointerdown", (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isDown = true;
    hasMoved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });

  const onPointerMove = (e: PointerEvent) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) {
      hasMoved = true;
    }
    el.scrollLeft = scrollLeft - walk;
  };

  const onPointerUp = () => {
    if (!isDown) return;
    isDown = false;
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  el.addEventListener(
    "click",
    (e) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
        hasMoved = false;
      }
    },
    true,
  );
}

export class MenuView {
  private el: HTMLElement;
  private streakEl: HTMLElement;
  private feathersEl: HTMLElement;
  private playTimeEl: HTMLElement;
  private bestEl: HTMLElement;
  private muteBtn: HTMLElement;
  private tabContentEl: HTMLElement;
  private activeTab: "heroes" | "scenes" | "quests" | "skins" = "heroes";

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
      padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      box-sizing: border-box;
      pointer-events: none;
    `;

    this.el.innerHTML = `
      <!-- Top header bar: Streak, Playtime, Feathers & Mute -->
      <div id="menu-header" class="interactive" style="display: flex; justify-content: space-between; align-items: center; width: 100%; pointer-events: auto;">
        <div style="display: flex; gap: 6px; align-items: center;">
          <div id="menu-streak" style="display: flex; align-items: center; gap: 4px; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 10px; border-radius: 18px; border: 1px solid rgba(255, 120, 0, 0.35); font-weight: 800; font-size: 11px; color: #ff9e00; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
            🔥 <span id="menu-streak-count">1</span>d Streak
          </div>
          <div id="menu-playtime" style="display: flex; align-items: center; gap: 4px; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 10px; border-radius: 18px; border: 1px solid rgba(0, 245, 212, 0.35); font-weight: 800; font-size: 11px; color: #00f5d4; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
            ⏱️ <span id="menu-playtime-count">0</span>m
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <div id="menu-feathers" style="display: flex; align-items: center; gap: 4px; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 10px; border-radius: 18px; border: 1px solid rgba(0, 229, 255, 0.35); font-weight: 800; font-size: 11px; color: #00e5ff; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
            🪶 <span id="menu-feather-count">0</span>
          </div>
          <button id="menu-mute-btn" class="btn interactive" style="background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.16); color: #fff; font-size: 14px; width: 34px; height: 34px; min-width: 34px; min-height: 34px; border-radius: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3); touch-action: manipulation;">
            🔊
          </button>
        </div>
      </div>

      <!-- Center Title & Tap Prompt -->
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; margin-top: 4px; animation: titleFloat 2.5s ease-in-out infinite alternate;">
        <h1 style="font-size: clamp(30px, 8.5vw, 44px); font-weight: 900; margin: 0 0 2px 0; background: linear-gradient(180deg, #ffffff 15%, #bae6fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 20px rgba(0, 229, 255, 0.45)); letter-spacing: -0.02em; text-align: center;">
          FLAPPY 3D
        </h1>
        <div id="menu-best-label" style="font-size: 11px; font-weight: 800; color: #bae6fd; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; background: rgba(13, 17, 30, 0.6); border: 1px solid rgba(255, 255, 255, 0.12); padding: 3px 12px; border-radius: 12px; backdrop-filter: blur(8px);">
          BEST <span id="menu-best-val" style="color: #fff; margin-left: 2px;">0</span>
        </div>
        <div style="font-size: clamp(12px, 3.6vw, 14px); font-weight: 800; color: #fff; background: rgba(13, 17, 30, 0.7); border: 1px solid rgba(0, 229, 255, 0.5); padding: 8px 20px; border-radius: 22px; letter-spacing: 0.5px; animation: softGlowPulse 1.8s infinite alternate; text-shadow: 0 0 10px rgba(0,229,255,0.7); backdrop-filter: blur(12px);">
          SPACE OR TAP TO FLY
        </div>
      </div>

      <!-- Bottom Drawer / Tabs Panel -->
      <div id="menu-drawer" class="interactive" style="width: 100%; max-width: min(380px, 94vw); display: flex; flex-direction: column; align-items: center; pointer-events: auto; background: rgba(12, 16, 28, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 20px; padding: 8px 10px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
        <!-- Tab navigation bar -->
        <div id="menu-tabs" style="display: flex; width: 100%; gap: 6px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
          <button data-tab="heroes" class="btn interactive tab-btn" style="flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
            🐱 HEROES
          </button>
          <button data-tab="scenes" class="btn interactive tab-btn" style="flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
            🌄 SCENES
          </button>
          <button data-tab="quests" class="btn interactive tab-btn" style="flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
            🎯 QUESTS
          </button>
          <button data-tab="skins" class="btn interactive tab-btn" style="flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
            🎨 SKINS
          </button>
        </div>

        <!-- Tab content area -->
        <div id="menu-tab-content" style="width: 100%; min-height: 115px; max-height: 145px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          <!-- Dynamically populated tab items -->
        </div>
      </div>
    `;

    container.appendChild(this.el);

    this.streakEl = this.el.querySelector("#menu-streak-count")!;
    this.playTimeEl = this.el.querySelector("#menu-playtime-count")!;
    this.feathersEl = this.el.querySelector("#menu-feather-count")!;
    this.bestEl = this.el.querySelector("#menu-best-val")!;
    this.muteBtn = this.el.querySelector("#menu-mute-btn")!;
    this.tabContentEl = this.el.querySelector("#menu-tab-content")!;

    // Mute button click
    this.muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const current = loadAll().muted;
      const next = !current;
      setMuted(next);
      this.muteBtn.textContent = next ? "🔇" : "🔊";
      this.callbacks.onMuteToggle(next);
    });

    // Prevent accidental game start when tapping or dragging anywhere inside the menu drawer or header
    const drawer = this.el.querySelector("#menu-drawer");
    drawer?.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    const headerBar = this.el.querySelector("#menu-header");
    headerBar?.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });

    // Tab buttons
    const tabButtons = this.el.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tab = (btn as HTMLElement).dataset.tab as "heroes" | "scenes" | "quests" | "skins";
        this.activeTab = tab;
        this.renderTabContent();
      });
    });

    this.refresh();
  }

  refresh(): void {
    const data = loadAll();
    const streak = touchStreak();
    this.streakEl.textContent = streak.toString();
    this.playTimeEl.textContent = `${Math.round(data.totalPlayTimeSec / 60)}`;
    this.feathersEl.textContent = data.feathers.toString();
    this.bestEl.textContent = data.best.toString();
    this.muteBtn.textContent = data.muted ? "🔇" : "🔊";

    this.renderTabContent();
  }

  private renderTabContent(): void {
    const data = loadAll();
    const streak = touchStreak();

    // Update tab button styles
    const tabButtons = this.el.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      const isSelected = (btn as HTMLElement).dataset.tab === this.activeTab;
      (btn as HTMLElement).style.background = isSelected ? "rgba(0, 229, 255, 0.2)" : "transparent";
      (btn as HTMLElement).style.color = isSelected ? "#00e5ff" : "rgba(255, 255, 255, 0.55)";
      (btn as HTMLElement).style.border = isSelected ? "1px solid rgba(0, 229, 255, 0.45)" : "1px solid transparent";
    });

    this.tabContentEl.innerHTML = "";

    switch (this.activeTab) {
      case "heroes":
        this.renderHeroesTab(data, streak);
        break;
      case "scenes":
        this.renderScenesTab(data);
        break;
      case "quests":
        this.renderQuestsTab();
        break;
      case "skins":
        this.renderSkinsTab(data);
        break;
    }
  }

  // 1. HEROES TAB
  private renderHeroesTab(data: ReturnType<typeof loadAll>, streak: number): void {
    const heroesContainer = document.createElement("div");
    heroesContainer.style.cssText = "display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 8px 2px; width: 100%; box-sizing: border-box;";

    Object.values(CHARACTERS).forEach((char) => {
      const isUnlocked = isCharacterUnlocked(char.id, data.best, streak, data.unlockedChars, data.totalPlayTimeSec);
      const isSelected = data.character === char.id;

      const progressPct = char.unlockType === "score"
        ? Math.min(100, Math.round((data.best / char.unlockValue) * 100))
        : char.unlockType === "streak"
          ? Math.min(100, Math.round((streak / char.unlockValue) * 100))
          : 100;

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 102px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      card.innerHTML = `
        <div style="font-size: 26px; margin-bottom: 2px;">${char.emoji}</div>
        <div style="font-size: 11px; font-weight: 800; color: #fff; letter-spacing: -0.01em;">${char.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isUnlocked ? "SELECT" : `🔒 Score ${char.unlockValue}`}
        </div>
        ${!isUnlocked ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ff9e00;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isUnlocked) {
          setCharacter(char.id);
          this.callbacks.onCharacterChange(char.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Score ${char.unlockValue} to unlock ${char.name}!`);
        }
      };

      heroesContainer.appendChild(card);
    });

    this.tabContentEl.appendChild(heroesContainer);
    enableDragScroll(heroesContainer);
  }

  // 2. SCENES TAB
  private renderScenesTab(data: ReturnType<typeof loadAll>): void {
    const scenesContainer = document.createElement("div");
    scenesContainer.style.cssText = "display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 8px 2px; width: 100%; box-sizing: border-box;";

    // Auto Dynamic option
    const autoSelected = data.biome === "auto";
    const autoCard = document.createElement("div");
    autoCard.className = "btn interactive";
    autoCard.style.cssText = `
      flex: 0 0 96px;
      background: ${autoSelected ? "rgba(0, 229, 255, 0.18)" : "rgba(255, 255, 255, 0.05)"};
      border: 1.5px solid ${autoSelected ? "#00e5ff" : "rgba(255, 255, 255, 0.16)"};
      border-radius: 16px;
      padding: 8px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      box-shadow: ${autoSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : "none"};
      touch-action: pan-x;
      user-select: none;
    `;
    autoCard.innerHTML = `
      <div style="font-size: 22px;">🌀</div>
      <div style="font-size: 11px; font-weight: 800; color: #fff;">Dynamic</div>
      <div style="font-size: 9px; font-weight: 700; color: #00e5ff; margin-top: 4px;">${autoSelected ? "✓ ACTIVE" : "SELECT"}</div>
    `;
    autoCard.onclick = (e) => {
      e.stopPropagation();
      setBiome("auto");
      this.callbacks.onBiomeChange("auto");
      this.refresh();
    };
    scenesContainer.appendChild(autoCard);

    // Biomes
    Object.values(BIOMES).forEach((b) => {
      const isSelected = data.biome === b.id;
      const isUnlocked = data.best >= b.unlockScore;
      const progressPct = Math.min(100, Math.round((data.best / (b.unlockScore || 1)) * 100));

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 96px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;
      card.innerHTML = `
        <div style="font-size: 22px;">${b.emoji}</div>
        <div style="font-size: 10px; font-weight: 800; color: #fff;">${b.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isUnlocked ? "SELECT" : `🔒 Score ${b.unlockScore}`}
        </div>
        ${!isUnlocked ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ff9e00;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isUnlocked) {
          setBiome(b.id);
          this.callbacks.onBiomeChange(b.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Reach Score ${b.unlockScore} to unlock ${b.name}!`);
        }
      };

      scenesContainer.appendChild(card);
    });

    this.tabContentEl.appendChild(scenesContainer);
    enableDragScroll(scenesContainer);
  }

  // 3. DAILY QUESTS TAB
  private renderQuestsTab(): void {
    const missions = getStoredMissions();
    const list = document.createElement("div");
    list.style.cssText = "display: flex; flex-direction: column; gap: 6px; width: 100%;";

    missions.forEach((m) => {
      const item = document.createElement("div");
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid ${m.completed ? "rgba(0, 255, 195, 0.35)" : "rgba(255, 255, 255, 0.08)"};
        border-radius: 12px;
        padding: 6px 12px;
      `;

      const progressPct = Math.min(100, Math.round((m.current / m.goal) * 100));

      item.innerHTML = `
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 800; color: #fff;">${m.title}</div>
          <div style="font-size: 9px; color: #94a3b8;">${m.description} (${m.current}/${m.goal})</div>
          <div style="width: 100%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 4px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: ${m.completed ? "linear-gradient(90deg, #00ffc3, #00b4d8)" : "#00e5ff"};"></div>
          </div>
        </div>
        <div style="margin-left: 10px;">
          ${
            m.claimed
              ? '<span style="font-size: 10px; color: #64748b; font-weight: 800;">CLAIMED</span>'
              : m.completed
                ? `<button class="btn interactive claim-btn" data-id="${m.id}" style="background: linear-gradient(135deg, #00ffc3, #00b4d8); color: #002233; font-weight: 800; font-size: 10px; border: none; border-radius: 10px; padding: 4px 10px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,255,195,0.4);">CLAIM +${m.rewardFeathers}🪶</button>`
                : `<span style="font-size: 10px; color: #00e5ff; font-weight: 800;">+${m.rewardFeathers} 🪶</span>`
          }
        </div>
      `;

      const claimBtn = item.querySelector(".claim-btn");
      if (claimBtn) {
        claimBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          m.claimed = true;
          saveStoredMissions(missions);
          bankFeathers(loadAll().feathers + m.rewardFeathers);
          this.callbacks.onMissionClaim?.();
          this.refresh();
        });
      }

      list.appendChild(item);
    });

    this.tabContentEl.appendChild(list);
  }

  // 4. SKINS TAB
  private renderSkinsTab(data: ReturnType<typeof loadAll>): void {
    const list = document.createElement("div");
    list.className = "drag-scroll";
    list.style.cssText = "display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 8px 2px; width: 100%; box-sizing: border-box;";

    Object.values(SKINS).forEach((skin) => {
      const isUnlocked = data.best >= skin.unlockScore || data.unlocked.includes(skin.id);
      const isSelected = data.skin === skin.id;
      const bodyHex = skin.bodyColor.toString(16).padStart(6, "0");
      const bellyHex = skin.bellyColor.toString(16).padStart(6, "0");
      const progressPct = Math.min(100, Math.round((data.best / (skin.unlockScore || 1)) * 100));

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 102px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      card.innerHTML = `
        <div style="width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #${bodyHex}, #${bellyHex}); border: 2px solid rgba(255,255,255,0.4); box-shadow: 0 4px 12px #${bodyHex}66, inset 0 2px 4px rgba(255,255,255,0.7); margin-bottom: 3px;"></div>
        <div style="font-size: 10px; font-weight: 800; color: #fff; letter-spacing: -0.01em; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${skin.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 3px;">
          ${isSelected ? "✓ ACTIVE" : isUnlocked ? "SELECT" : `🔒 Score ${skin.unlockScore}`}
        </div>
        ${!isUnlocked ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ff9e00;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isUnlocked) {
          setSkin(skin.id);
          this.callbacks.onSkinChange(skin.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Reach Score ${skin.unlockScore} to unlock ${skin.name}!`);
        }
      };

      list.appendChild(card);
    });

    this.tabContentEl.appendChild(list);
    enableDragScroll(list);
  }

  show(): void {
    this.refresh();
    this.el.style.display = "flex";
  }

  hide(): void {
    this.el.style.display = "none";
  }
}
