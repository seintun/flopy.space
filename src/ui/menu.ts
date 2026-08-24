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
}

export class MenuView {
  private el: HTMLElement;
  private streakEl: HTMLElement;
  private feathersEl: HTMLElement;
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
      padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      box-sizing: border-box;
      pointer-events: none;
    `;

    this.el.innerHTML = `
      <!-- Top header bar: Streak, Feathers & Mute -->
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; pointer-events: auto;">
        <div id="menu-streak" style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 18px; border: 1px solid rgba(255,120,0,0.35); font-weight: 800; font-size: 13px; color: #ff9e00;">
          🔥 <span id="menu-streak-count">1</span>d Streak
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <div id="menu-feathers" style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 18px; border: 1px solid rgba(0,229,255,0.35); font-weight: 800; font-size: 13px; color: #00e5ff;">
            🪶 <span id="menu-feather-count">0</span>
          </div>
          <button id="menu-mute-btn" class="btn interactive" style="background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 16px; width: 38px; height: 38px; border-radius: 19px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            🔊
          </button>
        </div>
      </div>

      <!-- Center Title & Tap Prompt -->
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; margin-top: -10px;">
        <h1 style="font-size: 42px; font-weight: 900; margin: 0 0 4px 0; color: #ffd700; letter-spacing: 2px; text-shadow: 0 4px 24px rgba(255,215,0,0.6); text-align: center;">
          FLAPPY 3D
        </h1>
        <div id="menu-best-label" style="font-size: 13px; font-weight: 800; color: #00e5ff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; background: rgba(0,0,0,0.35); padding: 3px 12px; border-radius: 12px;">
          Best: <span id="menu-best-val">0</span>
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #fff; background: rgba(0,229,255,0.25); border: 1px solid rgba(0,229,255,0.45); padding: 8px 22px; border-radius: 20px; letter-spacing: 1px; animation: pulse 1.4s infinite alternate; text-shadow: 0 0 10px rgba(0,229,255,0.8);">
          TAP SCREEN TO FLY
        </div>
      </div>

      <!-- Bottom Drawer / Tabs Panel -->
      <div style="width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center; pointer-events: auto; background: rgba(10, 15, 30, 0.88); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 10px; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <!-- Tab navigation bar -->
        <div id="menu-tabs" style="display: flex; width: 100%; gap: 4px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <button data-tab="heroes" class="btn interactive tab-btn" style="flex: 1; padding: 6px 2px; border: none; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer;">
            🐱 HEROES
          </button>
          <button data-tab="scenes" class="btn interactive tab-btn" style="flex: 1; padding: 6px 2px; border: none; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer;">
            🌄 SCENES
          </button>
          <button data-tab="quests" class="btn interactive tab-btn" style="flex: 1; padding: 6px 2px; border: none; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer;">
            🎯 QUESTS
          </button>
          <button data-tab="skins" class="btn interactive tab-btn" style="flex: 1; padding: 6px 2px; border: none; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer;">
            🎨 SKINS
          </button>
        </div>

        <!-- Tab content area -->
        <div id="menu-tab-content" style="width: 100%; min-height: 110px; max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          <!-- Dynamically populated tab items -->
        </div>
      </div>
    `;

    container.appendChild(this.el);

    this.streakEl = this.el.querySelector("#menu-streak-count")!;
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
      (btn as HTMLElement).style.background = isSelected ? "rgba(0,229,255,0.25)" : "transparent";
      (btn as HTMLElement).style.color = isSelected ? "#00e5ff" : "rgba(255,255,255,0.6)";
      (btn as HTMLElement).style.border = isSelected ? "1px solid rgba(0,229,255,0.4)" : "none";
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
    heroesContainer.style.cssText = "display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;";

    Object.values(CHARACTERS).forEach((char) => {
      const isUnlocked = isCharacterUnlocked(char.id, data.best, streak, data.unlockedChars);
      const isSelected = data.character === char.id;

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 100px;
        background: ${isSelected ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.06)"};
        border: 2px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"};
        border-radius: 14px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.6"};
      `;

      card.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 2px;">${char.emoji}</div>
        <div style="font-size: 11px; font-weight: 800; color: #fff;">${char.name}</div>
        <div style="font-size: 9px; color: ${isUnlocked ? "#00e5ff" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isUnlocked ? "SELECT" : `🔒 ${char.unlockType === "score" ? `Score ${char.unlockValue}` : `${char.unlockValue}d Streak`}`}
        </div>
      `;

      if (isUnlocked) {
        card.onclick = (e) => {
          e.stopPropagation();
          setCharacter(char.id);
          this.callbacks.onCharacterChange(char.id);
          this.refresh();
        };
      }

      heroesContainer.appendChild(card);
    });

    this.tabContentEl.appendChild(heroesContainer);
  }

  // 2. SCENES TAB
  private renderScenesTab(data: ReturnType<typeof loadAll>): void {
    const scenesContainer = document.createElement("div");
    scenesContainer.style.cssText = "display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;";

    // Auto option
    const autoSelected = data.biome === "auto";
    const autoCard = document.createElement("div");
    autoCard.className = "btn interactive";
    autoCard.style.cssText = `
      flex: 0 0 90px;
      background: ${autoSelected ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.06)"};
      border: 2px solid ${autoSelected ? "#00e5ff" : "rgba(255,255,255,0.2)"};
      border-radius: 12px;
      padding: 8px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    `;
    autoCard.innerHTML = `
      <div style="font-size: 20px;">🌀</div>
      <div style="font-size: 11px; font-weight: 800;">Dynamic</div>
      <div style="font-size: 9px; color: #00e5ff; margin-top: 4px;">${autoSelected ? "✓ ACTIVE" : "SELECT"}</div>
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

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 95px;
        background: ${isSelected ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.06)"};
        border: 2px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"};
        border-radius: 12px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.6"};
      `;
      card.innerHTML = `
        <div style="font-size: 20px;">${b.emoji}</div>
        <div style="font-size: 10px; font-weight: 800;">${b.name}</div>
        <div style="font-size: 9px; color: ${isUnlocked ? "#00e5ff" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isUnlocked ? "SELECT" : `🔒 Score ${b.unlockScore}`}
        </div>
      `;

      if (isUnlocked) {
        card.onclick = (e) => {
          e.stopPropagation();
          setBiome(b.id);
          this.callbacks.onBiomeChange(b.id);
          this.refresh();
        };
      }
      scenesContainer.appendChild(card);
    });

    this.tabContentEl.appendChild(scenesContainer);
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
        background: rgba(255,255,255,0.06);
        border: 1px solid ${m.completed ? "rgba(0,255,160,0.4)" : "rgba(255,255,255,0.1)"};
        border-radius: 10px;
        padding: 6px 10px;
      `;

      const progressPct = Math.min(100, Math.round((m.current / m.goal) * 100));

      item.innerHTML = `
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 800; color: #fff;">${m.title}</div>
          <div style="font-size: 9px; color: #aaa;">${m.description} (${m.current}/${m.goal})</div>
          <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.4); border-radius: 2px; margin-top: 4px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: ${m.completed ? "#00ffc3" : "#00e5ff"};"></div>
          </div>
        </div>
        <div style="margin-left: 10px;">
          ${
            m.claimed
              ? '<span style="font-size: 10px; color: #888; font-weight: 800;">CLAIMED</span>'
              : m.completed
                ? `<button class="btn interactive claim-btn" data-id="${m.id}" style="background: linear-gradient(135deg, #00ffc3, #00b4d8); color: #002233; font-weight: 900; font-size: 10px; border: none; border-radius: 10px; padding: 4px 8px; cursor: pointer;">CLAIM +${m.rewardFeathers}🪶</button>`
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
    list.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;";

    Object.values(SKINS).forEach((skin) => {
      const isUnlocked = data.unlocked.includes(skin.id);
      const isSelected = data.skin === skin.id;

      const chip = document.createElement("button");
      chip.className = "btn interactive";
      chip.style.cssText = `
        border: 2px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"};
        background: ${isSelected ? "rgba(0,229,255,0.2)" : "rgba(0,0,0,0.5)"};
        color: ${isUnlocked ? "#fff" : "#778"};
        padding: 6px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 800;
        cursor: ${isUnlocked ? "pointer" : "default"};
        display: flex;
        align-items: center;
        gap: 4px;
      `;

      chip.innerHTML = `
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#${skin.bodyColor.toString(16).padStart(6, "0")};"></span>
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

      list.appendChild(chip);
    });

    this.tabContentEl.appendChild(list);
  }

  show(): void {
    this.refresh();
    this.el.style.display = "flex";
  }

  hide(): void {
    this.el.style.display = "none";
  }
}
