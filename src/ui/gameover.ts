import { CHARACTERS, type CharacterId, isCharacterUnlocked } from "../core/characters";
import { BIOMES, type BiomeId } from "../core/biomes";
import {
  loadAll,
  setCharacter,
  setBiome,
  getStoredMissions,
  saveStoredMissions,
  addFeathers,
} from "../core/storage";
import { enableDragScroll } from "../utils/dom";
import { formatDuration } from "../utils/time";

export interface GameOverCallbacks {
  onRetry: () => void;
  onMenu?: () => void;
  onCharacterChange?: (charId: CharacterId) => void;
  onBiomeChange?: (biomeId: BiomeId | "auto") => void;
  onClaimQuest?: (rewardFeathers: number) => void;
}

export class GameOverView {
  private overlay: HTMLElement;
  private scoreEl: HTMLElement;
  private pipesEl: HTMLElement;
  private bonusEl: HTMLElement;
  private bestEl: HTMLElement;
  private badgeEl: HTMLElement;
  private timeEl: HTMLElement;
  private unlockBannerEl: HTMLElement;
  private questClaimContainer: HTMLElement;
  private nextUnlockContainer: HTMLElement;
  private quickSwapContainer: HTMLElement;
  private callbacks?: GameOverCallbacks;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement("div");
    this.overlay.id = "gameover-overlay";
    this.overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      background: linear-gradient(180deg, transparent 35%, rgba(8, 12, 24, 0.82) 100%);
      z-index: 50;
      color: #fff;
      padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      box-sizing: border-box;
      pointer-events: auto;
    `;

    this.overlay.innerHTML = `
      <div style="text-align: center; max-width: 340px; width: 92%; animation: popIn 0.28s cubic-bezier(0.2, 0.8, 0.4, 1); display: flex; flex-direction: column; align-items: center; gap: 8px;">
        
        <div id="go-badge" style="display:none; background: linear-gradient(135deg, #ffd700, #ff9e00); color: #0f172a; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 14px rgba(255,215,0,0.5);">
          ★ NEW BEST RECORD ★
        </div>

        <div id="go-unlock-banner" style="display:none; background: linear-gradient(135deg, #00f5d4, #00b4d8); color: #002233; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 14px rgba(0,245,212,0.5);">
          🎉 NEW UNLOCK AVAILABLE!
        </div>

        <!-- In-Situ Quest Claim Dopamine Banner -->
        <div id="go-quest-claim-box" style="display: none; width: 100%;"></div>

        <!-- High-Glance Score & Stat Capsule -->
        <div style="background: rgba(10, 16, 32, 0.90); border: 1.5px solid rgba(0, 229, 255, 0.4); border-radius: 20px; padding: 12px 16px; width: 100%; box-sizing: border-box; box-shadow: 0 12px 32px rgba(0,0,0,0.6), inset 0 0 16px rgba(0, 229, 255, 0.1); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Total Score</span>
              <div id="go-score" style="font-size: 44px; font-weight: 900; line-height: 1; color: #fff; text-shadow: 0 0 20px rgba(0, 229, 255, 0.6); font-variant-numeric: tabular-nums;">0</div>
              <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-top: 2px;">
                <span id="go-pipes">0</span> pipes • <span id="go-bonus" style="color: #ffd700;">+0 bonus</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end;">
              <div style="background: rgba(255, 215, 0, 0.14); border: 1px solid rgba(255, 215, 0, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">BEST</span>
                <span id="go-best" style="font-size: 15px; font-weight: 900; color: #ffd700; font-variant-numeric: tabular-nums;">0</span>
              </div>
              <div style="background: rgba(0, 229, 255, 0.14); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 12px;">⏱️</span>
                <span id="go-time" style="font-size: 14px; font-weight: 900; color: #00e5ff; font-variant-numeric: tabular-nums;">00:00s</span>
              </div>
            </div>
          </div>

          <!-- Goal-Gradient Unlock Progress Bar -->
          <div id="go-next-unlock" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); text-align: left;">
          </div>
        </div>

        <!-- In-Situ Quick-Swap Character & Scene Carousel for Next Run -->
        <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">✨ Select Hero for Next Run</span>
            <span id="go-equip-toast" style="font-size: 10px; font-weight: 800; color: #00f5d4; display: none;">Equipped for Next Run! ✨</span>
          </div>
          <div id="go-quick-swap" class="drag-scroll" style="display: flex; gap: 6px; overflow-x: auto; padding: 2px 2px 4px 2px; width: 100%; box-sizing: border-box;"></div>
        </div>

        <!-- Dual CTA Buttons: Instant Fly Again + Home / Roster -->
        <div style="display: flex; width: 100%; gap: 8px;">
          <button id="go-menu-btn" class="btn interactive" style="flex: 0 0 48px; height: 48px; font-size: 18px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 24px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; touch-action: manipulation;" title="Home / Full Roster">
            🏠
          </button>
          <button id="go-retry-btn" class="btn interactive" style="flex: 1; height: 48px; font-size: 15px; font-weight: 900; background: linear-gradient(135deg, #00e5ff, #00f5d4); border: none; border-radius: 24px; color: #002233; cursor: pointer; box-shadow: 0 0 24px rgba(0, 229, 255, 0.6); letter-spacing: 0.5px; animation: softGlowPulse 1.2s infinite alternate; touch-action: manipulation;">
            ⚡ FLY AGAIN
          </button>
        </div>
      </div>
    `;

    container.appendChild(this.overlay);

    this.scoreEl = this.overlay.querySelector("#go-score")!;
    this.pipesEl = this.overlay.querySelector("#go-pipes")!;
    this.bonusEl = this.overlay.querySelector("#go-bonus")!;
    this.bestEl = this.overlay.querySelector("#go-best")!;
    this.badgeEl = this.overlay.querySelector("#go-badge")!;
    this.timeEl = this.overlay.querySelector("#go-time")!;
    this.unlockBannerEl = this.overlay.querySelector("#go-unlock-banner")!;
    this.questClaimContainer = this.overlay.querySelector("#go-quest-claim-box")!;
    this.nextUnlockContainer = this.overlay.querySelector("#go-next-unlock")!;
    this.quickSwapContainer = this.overlay.querySelector("#go-quick-swap")!;

    enableDragScroll(this.quickSwapContainer);

    const retryBtn = this.overlay.querySelector("#go-retry-btn") as HTMLButtonElement;
    retryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hide();
      this.callbacks?.onRetry();
    });

    const menuBtn = this.overlay.querySelector("#go-menu-btn") as HTMLButtonElement;
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hide();
      this.callbacks?.onMenu?.();
    });
  }

  show(
    score: number,
    best: number,
    isNewBest: boolean,
    _feathers: number,
    timeSec = 0,
    hasNewUnlock = false,
    pipesPassed = score,
    bonusScore = 0,
    callbacks?: GameOverCallbacks,
  ): void {
    if (callbacks) this.callbacks = callbacks;
    const data = loadAll();
    const effectiveBest = Math.max(score, best, data.best);

    this.scoreEl.textContent = score.toString();
    if (this.pipesEl) this.pipesEl.textContent = pipesPassed.toString();
    if (this.bonusEl) this.bonusEl.textContent = `+${bonusScore} bonus`;
    this.bestEl.textContent = effectiveBest.toString();
    if (this.timeEl) this.timeEl.textContent = formatDuration(timeSec);
    this.badgeEl.style.display = isNewBest ? "block" : "none";
    this.unlockBannerEl.style.display = hasNewUnlock ? "block" : "none";

    this.renderNextUnlockProgress(effectiveBest);
    this.renderQuestClaimBanner();
    this.renderQuickSwap(data, effectiveBest);

    this.overlay.style.display = "flex";
  }

  private renderNextUnlockProgress(best: number): void {
    // Find next locked character
    const lockedChars = Object.values(CHARACTERS).filter((c) => c.unlockType === "score" && c.unlockValue > best);
    lockedChars.sort((a, b) => a.unlockValue - b.unlockValue);

    if (lockedChars.length > 0) {
      const nextChar = lockedChars[0]!;
      const needed = nextChar.unlockValue - best;
      const pct = Math.min(100, Math.max(8, Math.round((best / nextChar.unlockValue) * 100)));

      this.nextUnlockContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 4px;">
          <span style="color: #94a3b8;">🎯 Next: <strong style="color: #fff;">${nextChar.emoji} ${nextChar.name}</strong></span>
          <span style="color: #00f5d4;">${needed} pts away (${pct}%)</span>
        </div>
        <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #00e5ff, #00f5d4); border-radius: 3px; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.4, 1);"></div>
        </div>
      `;
      this.nextUnlockContainer.style.display = "block";
    } else {
      this.nextUnlockContainer.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; color: #ffd700; text-align: center;">
          👑 MASTER FLYER • ALL CHARACTERS UNLOCKED!
        </div>
      `;
      this.nextUnlockContainer.style.display = "block";
    }
  }

  private renderQuestClaimBanner(): void {
    const missions = getStoredMissions();
    const readyMission = missions.find((m) => m.completed && !m.claimed);

    if (readyMission) {
      this.questClaimContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 255, 195, 0.22), rgba(0, 180, 216, 0.22)); border: 1.5px solid #00ffc3; border-radius: 16px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 16px rgba(0, 255, 195, 0.35); animation: softGlowPulse 1.4s infinite alternate;">
          <div style="display: flex; align-items: center; gap: 6px; text-align: left;">
            <span style="font-size: 18px;">🎁</span>
            <div>
              <div style="font-size: 11px; font-weight: 900; color: #fff;">QUEST COMPLETE!</div>
              <div style="font-size: 9px; font-weight: 700; color: #bae6fd;">${readyMission.title}</div>
            </div>
          </div>
          <button id="go-claim-btn" class="btn interactive" style="background: linear-gradient(135deg, #00ffc3, #00b4d8); color: #002233; font-weight: 900; font-size: 11px; border: none; border-radius: 12px; padding: 6px 12px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,255,195,0.5);">
            CLAIM +${readyMission.rewardFeathers}🪶
          </button>
        </div>
      `;
      this.questClaimContainer.style.display = "block";

      const claimBtn = this.questClaimContainer.querySelector("#go-claim-btn") as HTMLButtonElement;
      claimBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        readyMission.claimed = true;
        saveStoredMissions(missions);
        addFeathers(readyMission.rewardFeathers);
        this.callbacks?.onClaimQuest?.(readyMission.rewardFeathers);
        this.questClaimContainer.style.display = "none";
      });
    } else {
      this.questClaimContainer.style.display = "none";
    }
  }

  private renderQuickSwap(data: ReturnType<typeof loadAll>, bestScore: number): void {
    this.quickSwapContainer.innerHTML = "";

    // Render characters
    Object.values(CHARACTERS).forEach((char) => {
      const isUnlocked = isCharacterUnlocked(char.id, bestScore, 1, data.unlockedChars, data.totalPlayTimeSec);
      const isSelected = data.character === char.id;

      const chip = document.createElement("button");
      chip.className = "btn interactive";
      chip.style.cssText = `
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 5px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.22)" : "rgba(255, 255, 255, 0.06)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.05)"};
        border-radius: 18px;
        padding: 5px 10px;
        color: ${isSelected ? "#00e5ff" : isUnlocked ? "#fff" : "#64748b"};
        font-size: 11px;
        font-weight: 800;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.5"};
        box-shadow: ${isSelected ? "0 0 12px rgba(0, 229, 255, 0.4)" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      chip.innerHTML = `
        <span style="font-size: 16px;">${char.emoji}</span>
        <span>${char.name}</span>
        ${isSelected ? '<span style="font-size: 10px; color: #00f5d4;">✓</span>' : !isUnlocked ? `<span style="font-size: 9px; color: #ff9e00;">🔒${char.unlockValue}</span>` : ""}
      `;

      chip.onclick = (e) => {
        e.stopPropagation();
        if (isUnlocked) {
          setCharacter(char.id);
          this.callbacks?.onCharacterChange?.(char.id);
          this.flashEquipToast(`${char.emoji} ${char.name} Ready for Next Run!`);
          this.renderQuickSwap(loadAll(), bestScore);
        }
      };

      this.quickSwapContainer.appendChild(chip);
    });

    // Render biomes
    Object.values(BIOMES).forEach((b) => {
      const isSelected = data.biome === b.id;
      const isUnlocked = bestScore >= b.unlockScore;

      const chip = document.createElement("button");
      chip.className = "btn interactive";
      chip.style.cssText = `
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 5px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.22)" : "rgba(255, 255, 255, 0.06)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.05)"};
        border-radius: 18px;
        padding: 5px 10px;
        color: ${isSelected ? "#00e5ff" : isUnlocked ? "#fff" : "#64748b"};
        font-size: 11px;
        font-weight: 800;
        cursor: ${isUnlocked ? "pointer" : "default"};
        opacity: ${isUnlocked ? "1" : "0.5"};
        box-shadow: ${isSelected ? "0 0 12px rgba(0, 229, 255, 0.4)" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      chip.innerHTML = `
        <span style="font-size: 15px;">${b.emoji}</span>
        <span>${b.name}</span>
        ${isSelected ? '<span style="font-size: 10px; color: #00f5d4;">✓</span>' : !isUnlocked ? `<span style="font-size: 9px; color: #ff9e00;">🔒${b.unlockScore}</span>` : ""}
      `;

      chip.onclick = (e) => {
        e.stopPropagation();
        if (isUnlocked) {
          setBiome(b.id);
          this.callbacks?.onBiomeChange?.(b.id);
          this.flashEquipToast(`${b.emoji} ${b.name} Active!`);
          this.renderQuickSwap(loadAll(), bestScore);
        }
      };

      this.quickSwapContainer.appendChild(chip);
    });
  }

  private flashEquipToast(msg: string): void {
    const toast = this.overlay.querySelector("#go-equip-toast") as HTMLElement;
    if (toast) {
      toast.textContent = msg;
      toast.style.display = "inline";
      setTimeout(() => {
        toast.style.display = "none";
      }, 1500);
    }
  }

  hide(): void {
    this.overlay.style.display = "none";
  }
}
