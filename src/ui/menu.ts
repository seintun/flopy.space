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
  addFeathers,
  spendTokens,
  claimCharacter,
  claimSkin,
  claimBiome,
  isSkinUnlocked,
  isSkinClaimable,
} from "../core/storage";
import {
  CHARACTERS,
  type CharacterId,
  isCharacterUnlocked,
  isCharacterClaimable,
} from "../core/characters";
import {
  BIOMES,
  type BiomeId,
  isBiomeUnlocked,
  isBiomeClaimable,
} from "../core/biomes";
import { enableDragScroll } from "../utils/dom";
import { InstallManager } from "./installManager";
import { getNextGoal } from "../core/goals";

function showDeductionFlyout(targetEl: HTMLElement, cost: number): void {
  const rect = targetEl.getBoundingClientRect();
  const flyout = document.createElement("div");
  flyout.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    transform: translate(-50%, 0);
    color: #ffd700;
    font-size: 16px;
    font-weight: 900;
    text-shadow: 0 0 14px rgba(255, 215, 0, 0.95), 0 2px 6px rgba(0,0,0,0.9);
    pointer-events: none;
    z-index: 10000;
    transition: transform 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.75s ease;
    opacity: 1;
    letter-spacing: 0.5px;
  `;
  flyout.textContent = `-${cost} 🪙`;
  document.body.appendChild(flyout);

  requestAnimationFrame(() => {
    flyout.style.transform = "translate(-50%, -46px) scale(1.2)";
    flyout.style.opacity = "0";
  });

  setTimeout(() => {
    flyout.remove();
  }, 800);
}

export interface MenuCallbacks {
  onStart: () => void;
  onCharacterChange: (charId: CharacterId) => void;
  onSkinChange: (skinId: string) => void;
  onBiomeChange: (biomeId: BiomeId | "auto") => void;
  onMuteToggle: (muted: boolean) => void;
  onMissionClaim?: () => void;
  onClaimUnlock?: (category: "hero" | "scene" | "skin", id: string) => void;
  onToast?: (msg: string) => void;
}

export class MenuView {
  private el: HTMLElement;
  private streakEl: HTMLElement;
  private feathersEl: HTMLElement;
  private tokensEl: HTMLElement;
  private drawerTokensEl: HTMLElement;
  private playTimeEl: HTMLElement;
  private bestEl: HTMLElement;
  private muteBtn: HTMLElement;
  private tabContentEl: HTMLElement;
  private goalPillEl: HTMLElement;
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
      <!-- Top Zone: Header Bar + Title + Best/Goal Row -->
      <div id="menu-top-section" style="width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
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
            <button id="menu-install-btn" class="btn interactive" style="display: none; background: linear-gradient(135deg, #00ffc3, #00b4d8); color: #002233; font-weight: 800; font-size: 10px; border: none; border-radius: 14px; padding: 5px 10px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,255,195,0.4); touch-action: manipulation;">
              📲 INSTALL
            </button>
            <div id="menu-tokens" style="display: flex; align-items: center; gap: 4px; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 10px; border-radius: 18px; border: 1px solid rgba(255, 215, 0, 0.4); font-weight: 800; font-size: 11px; color: #ffd700; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
              🪙 <span id="menu-token-count">0</span>
            </div>
            <div id="menu-feathers" style="display: flex; align-items: center; gap: 4px; background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 10px; border-radius: 18px; border: 1px solid rgba(0, 229, 255, 0.35); font-weight: 800; font-size: 11px; color: #00e5ff; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
              🪶 <span id="menu-feather-count">0</span>
            </div>
            <button id="menu-mute-btn" class="btn interactive" style="background: rgba(13, 17, 30, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.16); color: #fff; font-size: 14px; width: 34px; height: 34px; min-width: 34px; min-height: 34px; border-radius: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3); touch-action: manipulation;">
              🔊
            </button>
          </div>
        </div>

        <!-- Title & Sub-goals (Positioned directly above the 3D hero stage) -->
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: clamp(24px, 7vh, 52px); animation: titleFloat 2.5s ease-in-out infinite alternate;">
          <h1 style="font-size: clamp(28px, 8vw, 42px); font-weight: 900; margin: 0 0 6px 0; background: linear-gradient(180deg, #ffffff 15%, #bae6fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 20px rgba(0, 229, 255, 0.45)); letter-spacing: -0.02em; text-align: center; line-height: 1.1;">
            FLOPY.SPACE
          </h1>
          
          <!-- Distinct Two-Row Stats Area: Celebratory Record on Line 1, Milestone Goal on Line 2 -->
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; width: 100%; margin-top: 2px;">
            
            <!-- Line 1: Celebratory High Score Badge with Trophy & Ambient Glow -->
            <div id="menu-best-label" style="display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(255, 215, 0, 0.24), rgba(255, 158, 0, 0.18)); border: 1.5px solid #ffd700; padding: 4px 16px; border-radius: 20px; box-shadow: 0 4px 18px rgba(255, 215, 0, 0.35), inset 0 0 12px rgba(255,215,0,0.18); animation: softGlowPulse 1.4s infinite alternate; letter-spacing: 0.5px;">
              <span style="font-size: 15px; filter: drop-shadow(0 0 8px rgba(255,215,0,0.8));">👑</span>
              <span style="font-size: 11px; font-weight: 900; color: #ffd700; text-transform: uppercase;">RECORD</span>
              <span id="menu-best-val" style="font-size: 18px; font-weight: 900; color: #fff; text-shadow: 0 0 14px rgba(255, 215, 0, 0.9); font-variant-numeric: tabular-nums; line-height: 1;">0</span>
            </div>

            <!-- Line 2: Distinct Next Milestone Target Pill -->
            <div id="menu-goal-pill" style="font-size: 11px; font-weight: 800; color: #00f5d4; background: rgba(13, 17, 30, 0.75); border: 1px solid rgba(0, 245, 212, 0.4); padding: 4px 14px; border-radius: 16px; backdrop-filter: blur(12px); box-shadow: 0 2px 12px rgba(0,245,212,0.2); display: flex; align-items: center; gap: 5px;">
              🎯 Next: 🐱 Neko (0/15)
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Zone: Action CTA Prompt + Bottom Drawer / Tabs Panel -->
      <div id="menu-bottom-section" style="width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        
        <!-- Action Pulse Prompt (Anchored right above drawer, clear of hero bird) -->
        <div style="font-size: clamp(11px, 3.2vw, 13px); font-weight: 800; color: #fff; background: rgba(13, 17, 30, 0.75); border: 1.5px solid rgba(0, 229, 255, 0.55); padding: 6px 18px; border-radius: 20px; letter-spacing: 0.5px; animation: softGlowPulse 1.8s infinite alternate; text-shadow: 0 0 10px rgba(0,229,255,0.7); backdrop-filter: blur(12px); margin-bottom: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
          ⚡ SPACE OR TAP TO FLY
        </div>

        <!-- Bottom Drawer / Tabs Panel -->
        <div id="menu-drawer" class="interactive" style="width: 100%; max-width: min(380px, 94vw); display: flex; flex-direction: column; align-items: center; background: rgba(12, 16, 28, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 20px; padding: 8px 10px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
          
          <!-- Drawer Header Bar with Available Tokens Pill -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 6px; padding: 0 2px;">
            <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase;">
              <span>🎁 UNLOCK ROSTER</span>
            </div>
            <div id="drawer-tokens-badge" style="display: flex; align-items: center; gap: 4px; background: rgba(255, 215, 0, 0.16); border: 1px solid rgba(255, 215, 0, 0.45); padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: 900; color: #ffd700; box-shadow: 0 2px 8px rgba(255,215,0,0.2);">
              <span>🪙</span> <span id="drawer-token-count">0</span> <span style="font-size: 9px; color: #bae6fd; font-weight: 700;">available</span>
            </div>
          </div>

          <!-- Tab navigation bar -->
          <div id="menu-tabs" style="display: flex; width: 100%; gap: 6px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
            <button data-tab="heroes" class="btn interactive tab-btn" style="position: relative; flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
              <span>🐱 HEROES</span>
              <span class="tab-badge" style="display: none; position: absolute; top: -5px; right: 2px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #002233; font-size: 9px; font-weight: 900; min-width: 15px; height: 15px; border-radius: 8px; padding: 0 3px; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255,215,0,0.9); animation: softGlowPulse 1.1s infinite alternate; border: 1.5px solid #0c101c; pointer-events: none;">0</span>
            </button>
            <button data-tab="scenes" class="btn interactive tab-btn" style="position: relative; flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
              <span>🌄 SCENES</span>
              <span class="tab-badge" style="display: none; position: absolute; top: -5px; right: 2px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #002233; font-size: 9px; font-weight: 900; min-width: 15px; height: 15px; border-radius: 8px; padding: 0 3px; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255,215,0,0.9); animation: softGlowPulse 1.1s infinite alternate; border: 1.5px solid #0c101c; pointer-events: none;">0</span>
            </button>
            <button data-tab="quests" class="btn interactive tab-btn" style="position: relative; flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
              <span>🎯 QUESTS</span>
              <span class="tab-badge" style="display: none; position: absolute; top: -5px; right: 2px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #002233; font-size: 9px; font-weight: 900; min-width: 15px; height: 15px; border-radius: 8px; padding: 0 3px; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255,215,0,0.9); animation: softGlowPulse 1.1s infinite alternate; border: 1.5px solid #0c101c; pointer-events: none;">0</span>
            </button>
            <button data-tab="skins" class="btn interactive tab-btn" style="position: relative; flex: 1; padding: 8px 2px; min-height: 36px; border: none; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; touch-action: manipulation;">
              <span>🎨 SKINS</span>
              <span class="tab-badge" style="display: none; position: absolute; top: -5px; right: 2px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #002233; font-size: 9px; font-weight: 900; min-width: 15px; height: 15px; border-radius: 8px; padding: 0 3px; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255,215,0,0.9); animation: softGlowPulse 1.1s infinite alternate; border: 1.5px solid #0c101c; pointer-events: none;">0</span>
            </button>
          </div>

          <!-- Tab content area -->
          <div id="menu-tab-content" style="width: 100%; min-height: 115px; max-height: 145px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            <!-- Dynamically populated tab items -->
          </div>
        </div>
      </div>
    `;

    container.appendChild(this.el);

    this.streakEl = this.el.querySelector("#menu-streak-count")!;
    this.playTimeEl = this.el.querySelector("#menu-playtime-count")!;
    this.feathersEl = this.el.querySelector("#menu-feather-count")!;
    this.tokensEl = this.el.querySelector("#menu-token-count")!;
    this.drawerTokensEl = this.el.querySelector("#drawer-token-count")!;
    this.bestEl = this.el.querySelector("#menu-best-val")!;
    this.muteBtn = this.el.querySelector("#menu-mute-btn")!;
    this.tabContentEl = this.el.querySelector("#menu-tab-content")!;
    this.goalPillEl = this.el.querySelector("#menu-goal-pill")!;

    // Install App CTA
    const installBtn = this.el.querySelector("#menu-install-btn") as HTMLElement;
    const installMgr = new InstallManager((canInstall) => {
      if (installBtn) {
        installBtn.style.display = canInstall ? "block" : "none";
      }
    });
    if (installBtn) {
      installBtn.style.display = installMgr.canInstall() ? "block" : "none";
      installBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        installMgr.promptInstall();
      });
    }

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
    if (this.tokensEl) this.tokensEl.textContent = data.tokens.toString();
    if (this.drawerTokensEl) this.drawerTokensEl.textContent = data.tokens.toString();
    this.bestEl.textContent = data.best.toString();
    this.muteBtn.textContent = data.muted ? "🔇" : "🔊";

    const goal = getNextGoal(data.tokens, data);
    if (this.goalPillEl) {
      this.goalPillEl.innerHTML = `🎯 Next: <strong style="color: #fff;">${goal.emoji} ${goal.name}</strong> (${data.tokens}/${goal.targetScore} 🪙)`;
    }

    this.renderTabContent();
  }

  private updateTabBadges(): void {
    const data = loadAll();
    const counts = {
      heroes: 0,
      scenes: 0,
      quests: 0,
      skins: 0,
    };

    // 1. Heroes
    Object.values(CHARACTERS).forEach((char) => {
      if (!data.unlockedChars.includes(char.id) && char.unlockValue > 0 && data.tokens >= char.unlockValue) {
        counts.heroes++;
      }
    });

    // 2. Scenes
    Object.values(BIOMES).forEach((biome) => {
      if (!data.unlockedBiomes.includes(biome.id) && biome.unlockScore > 0 && data.tokens >= biome.unlockScore) {
        counts.scenes++;
      }
    });

    // 3. Quests
    const missions = getStoredMissions();
    missions.forEach((m) => {
      if (m.completed && !m.claimed) {
        counts.quests++;
      }
    });

    // 4. Skins
    Object.values(SKINS).forEach((skin) => {
      if (!data.unlocked.includes(skin.id) && skin.unlockScore > 0 && data.tokens >= skin.unlockScore) {
        counts.skins++;
      }
    });

    const tabButtons = this.el.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      const tab = (btn as HTMLElement).dataset.tab as keyof typeof counts;
      const badge = btn.querySelector(".tab-badge") as HTMLElement;
      if (badge && tab) {
        const count = counts[tab] || 0;
        if (count > 0) {
          badge.textContent = count > 9 ? "9+" : count.toString();
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    });
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

    this.updateTabBadges();

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
  private renderHeroesTab(data: ReturnType<typeof loadAll>, _streak: number): void {
    const heroesContainer = document.createElement("div");
    heroesContainer.style.cssText = "display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 8px 2px; width: 100%; box-sizing: border-box;";

    Object.values(CHARACTERS).forEach((char) => {
      const isUnlocked = isCharacterUnlocked(char.id, data.unlockedChars);
      const isClaimable = isCharacterClaimable(char.id, data.tokens, data.unlockedChars);
      const isSelected = data.character === char.id;
      const progressPct = Math.min(100, Math.round((data.tokens / (char.unlockValue || 1)) * 100));

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 102px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : isClaimable ? "rgba(255, 215, 0, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: ${isUnlocked || isClaimable ? "pointer" : "default"};
        opacity: ${isUnlocked || isClaimable ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : isClaimable ? "0 0 18px rgba(255, 215, 0, 0.45)" : "none"};
        animation: ${isClaimable ? "softGlowPulse 1.2s infinite alternate" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      card.innerHTML = `
        <div style="font-size: 26px; margin-bottom: 2px;">${char.emoji}</div>
        <div style="font-size: 11px; font-weight: 800; color: #fff; letter-spacing: -0.01em;">${char.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isClaimable ? `🎁 CLAIM ${char.unlockValue}🪙` : isUnlocked ? "SELECT" : `🔒 ${char.unlockValue} 🪙`}
        </div>
        ${!isUnlocked && !isClaimable ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ffd700;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isClaimable) {
          if (spendTokens(char.unlockValue)) {
            showDeductionFlyout(card, char.unlockValue);
            claimCharacter(char.id);
            setCharacter(char.id);
            this.callbacks.onClaimUnlock?.("hero", char.id);
            this.callbacks.onCharacterChange(char.id);
            this.refresh();
          }
        } else if (isUnlocked) {
          setCharacter(char.id);
          this.callbacks.onCharacterChange(char.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Requires ${char.unlockValue} 🪙 to unlock ${char.name}!`);
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
      const isUnlocked = isBiomeUnlocked(b.id, data.unlockedBiomes);
      const isClaimable = isBiomeClaimable(b.id, data.tokens, data.unlockedBiomes);
      const progressPct = Math.min(100, Math.round((data.tokens / (b.unlockScore || 1)) * 100));

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 96px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : isClaimable ? "rgba(255, 215, 0, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: ${isUnlocked || isClaimable ? "pointer" : "default"};
        opacity: ${isUnlocked || isClaimable ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : isClaimable ? "0 0 18px rgba(255, 215, 0, 0.45)" : "none"};
        animation: ${isClaimable ? "softGlowPulse 1.2s infinite alternate" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;
      card.innerHTML = `
        <div style="font-size: 22px;">${b.emoji}</div>
        <div style="font-size: 10px; font-weight: 800; color: #fff;">${b.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 4px;">
          ${isSelected ? "✓ ACTIVE" : isClaimable ? `🎁 CLAIM ${b.unlockScore}🪙` : isUnlocked ? "SELECT" : `🔒 ${b.unlockScore} 🪙`}
        </div>
        ${!isUnlocked && !isClaimable ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ffd700;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isClaimable) {
          if (spendTokens(b.unlockScore)) {
            showDeductionFlyout(card, b.unlockScore);
            claimBiome(b.id);
            setBiome(b.id);
            this.callbacks.onClaimUnlock?.("scene", b.id);
            this.callbacks.onBiomeChange(b.id);
            this.refresh();
          }
        } else if (isUnlocked) {
          setBiome(b.id);
          this.callbacks.onBiomeChange(b.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Requires ${b.unlockScore} 🪙 to unlock ${b.name}!`);
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
          addFeathers(m.rewardFeathers);
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
      const isUnlocked = isSkinUnlocked(skin.id, data.unlocked);
      const isClaimable = isSkinClaimable(skin.id, data.tokens, data.unlocked);
      const isSelected = data.skin === skin.id;
      const bodyHex = skin.bodyColor.toString(16).padStart(6, "0");
      const bellyHex = skin.bellyColor.toString(16).padStart(6, "0");
      const progressPct = Math.min(100, Math.round((data.tokens / (skin.unlockScore || 1)) * 100));

      const card = document.createElement("div");
      card.className = "btn interactive";
      card.style.cssText = `
        flex: 0 0 102px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.18)" : isClaimable ? "rgba(255, 215, 0, 0.18)" : "rgba(255, 255, 255, 0.05)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"};
        border-radius: 16px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: ${isUnlocked || isClaimable ? "pointer" : "default"};
        opacity: ${isUnlocked || isClaimable ? "1" : "0.55"};
        box-shadow: ${isSelected ? "0 0 16px rgba(0, 229, 255, 0.3)" : isClaimable ? "0 0 18px rgba(255, 215, 0, 0.45)" : "none"};
        animation: ${isClaimable ? "softGlowPulse 1.2s infinite alternate" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      card.innerHTML = `
        <div style="width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #${bodyHex}, #${bellyHex}); border: 2px solid rgba(255,255,255,0.4); box-shadow: 0 4px 12px #${bodyHex}66, inset 0 2px 4px rgba(255,255,255,0.7); margin-bottom: 3px;"></div>
        <div style="font-size: 10px; font-weight: 800; color: #fff; letter-spacing: -0.01em; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${skin.name}</div>
        <div style="font-size: 9px; font-weight: 700; color: ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "#38bdf8" : "#ff9e00"}; margin-top: 3px;">
          ${isSelected ? "✓ ACTIVE" : isClaimable ? `🎁 CLAIM ${skin.unlockScore}🪙` : isUnlocked ? "SELECT" : `🔒 ${skin.unlockScore} 🪙`}
        </div>
        ${!isUnlocked && !isClaimable ? `
          <div style="width: 80%; height: 3px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="width: ${progressPct}%; height: 100%; background: #ffd700;"></div>
          </div>
        ` : ""}
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        if (isClaimable) {
          if (spendTokens(skin.unlockScore)) {
            showDeductionFlyout(card, skin.unlockScore);
            claimSkin(skin.id);
            setSkin(skin.id);
            this.callbacks.onClaimUnlock?.("skin", skin.id);
            this.callbacks.onSkinChange(skin.id);
            this.refresh();
          }
        } else if (isUnlocked) {
          setSkin(skin.id);
          this.callbacks.onSkinChange(skin.id);
          this.refresh();
        } else {
          this.callbacks.onToast?.(`🔒 Locked: Requires ${skin.unlockScore} 🪙 to unlock ${skin.name}!`);
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
