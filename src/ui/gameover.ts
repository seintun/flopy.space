import {
  CHARACTERS,
  type CharacterId,
  isCharacterUnlocked,
  isCharacterClaimable,
} from "../core/characters";
import { type BiomeId } from "../core/biomes";
import {
  loadAll,
  setCharacter,
  setSkin,
  setBiome,
  claimCharacter,
  claimSkin,
  claimBiome,
  getPendingUnlocks,
  getStoredMissions,
  saveStoredMissions,
  addFeathers,
  spendTokens,
} from "../core/storage";
import { enableDragScroll } from "../utils/dom";
import { formatDuration } from "../utils/time";
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
    flyout.style.transform = "translate(-50%, -42px) scale(1.2)";
    flyout.style.opacity = "0";
  });

  setTimeout(() => {
    flyout.remove();
  }, 800);
}

export interface GameOverCallbacks {
  onRetry: () => void;
  onMenu?: () => void;
  onCharacterChange?: (charId: CharacterId) => void;
  onClaimQuest?: (rewardFeathers: number) => void;
  onClaimUnlock?: (category: "hero" | "scene" | "skin", id: string) => void;
  onRewind?: () => void;
}

export class GameOverView {
  private overlay: HTMLElement;
  private scoreEl: HTMLElement;
  private pipesEl: HTMLElement;
  private bonusEl: HTMLElement;
  private bestEl: HTMLElement;
  private tokensEl: HTMLElement;
  private badgeEl: HTMLElement;
  private timeEl: HTMLElement;
  private unlockBannerEl: HTMLElement;
  private unlockClaimContainer: HTMLElement;
  private questClaimContainer: HTMLElement;
  private nextUnlockContainer: HTMLElement;
  private quickSwapContainer: HTMLElement;
  private rewindContainer: HTMLElement;
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

        <!-- High-Impact Rewind Resume CTA (Positioned above Scoreboard) -->
        <div id="go-rewind-container" style="display: none; width: 100%; margin-bottom: 4px;">
          <button id="go-claim-rewind-btn" class="btn interactive" style="width: 100%; height: 50px; background: linear-gradient(135deg, #00e5ff, #00f5d4); color: #002233; font-weight: 900; font-size: 14px; border: none; border-radius: 25px; box-shadow: 0 0 24px rgba(0, 229, 255, 0.7); letter-spacing: 0.5px; animation: softGlowPulse 1.2s infinite alternate; cursor: pointer; touch-action: manipulation;">
            ⚡ REWIND & RESUME RUN (−1 🪶)
          </button>
        </div>

        <div id="go-unlock-banner" style="display:none; background: linear-gradient(135deg, #00f5d4, #00b4d8); color: #002233; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 14px rgba(0,245,212,0.5);">
          🎉 NEW UNLOCK AVAILABLE!
        </div>

        <!-- In-Situ Unlock Claim Dopamine Banner -->
        <div id="go-unlock-claim-box" style="display: none; width: 100%;"></div>

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
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
              <div style="background: rgba(255, 215, 0, 0.16); border: 1px solid rgba(255, 215, 0, 0.45); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 13px;">🪙</span>
                <span id="go-tokens" style="font-size: 14px; font-weight: 900; color: #ffd700; font-variant-numeric: tabular-nums;">0</span>
              </div>
              <div style="background: rgba(0, 229, 255, 0.14); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 2px 8px; display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 9px; font-weight: 800; color: #94a3b8;">BEST</span>
                <span id="go-best" style="font-size: 13px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums;">0</span>
              </div>
            </div>
          </div>

          <!-- Goal-Gradient Unlock Progress Bar -->
          <div id="go-next-unlock" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); text-align: left;">
          </div>
        </div>

        <!-- In-Situ Quick-Swap Character Carousel for Next Run -->
        <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: flex-start; align-items: center; padding: 0 4px;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">✨ Select Hero for Next Run</span>
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
    this.tokensEl = this.overlay.querySelector("#go-tokens")!;
    this.badgeEl = this.overlay.querySelector("#go-badge")!;
    this.timeEl = this.overlay.querySelector("#go-time")!;
    this.unlockBannerEl = this.overlay.querySelector("#go-unlock-banner")!;
    this.unlockClaimContainer = this.overlay.querySelector("#go-unlock-claim-box")!;
    this.questClaimContainer = this.overlay.querySelector("#go-quest-claim-box")!;
    this.nextUnlockContainer = this.overlay.querySelector("#go-next-unlock")!;
    this.quickSwapContainer = this.overlay.querySelector("#go-quick-swap")!;
    this.rewindContainer = this.overlay.querySelector("#go-rewind-container")!;

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
    _hasNewUnlock = false,
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
    if (this.tokensEl) this.tokensEl.textContent = data.tokens.toString();
    if (this.timeEl) this.timeEl.textContent = formatDuration(timeSec);
    this.badgeEl.style.display = isNewBest ? "block" : "none";
    this.unlockBannerEl.style.display = "none"; // Replaced by interactive claim banner

    this.renderNextUnlockProgress(data.tokens);
    this.renderUnlockClaimBanner();
    this.renderQuestClaimBanner();
    this.renderQuickSwap(data, data.tokens);
    this.hideRewindOption();

    this.overlay.style.display = "flex";
  }

  private renderUnlockClaimBanner(): void {
    const data = loadAll();
    const pending = getPendingUnlocks(data);
    const first = pending[0];

    if (first) {
      const typeLabel = first.category === "hero" ? "HERO" : first.category === "scene" ? "WORLD" : "SKIN";
      this.unlockClaimContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.22), rgba(255, 158, 0, 0.22)); border: 1.5px solid #ffd700; border-radius: 16px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); animation: softGlowPulse 1.3s infinite alternate;">
          <div style="display: flex; align-items: center; gap: 6px; text-align: left;">
            <span style="font-size: 22px;">${first.emoji}</span>
            <div>
              <div style="font-size: 10px; font-weight: 900; color: #ffd700; text-transform: uppercase;">🎉 NEW ${typeLabel} UNLOCKED!</div>
              <div style="font-size: 12px; font-weight: 900; color: #fff;">${first.name}</div>
            </div>
          </div>
          <button id="go-claim-unlock-btn" class="btn interactive" style="background: linear-gradient(135deg, #ffd700, #ff9e00); color: #0f172a; font-weight: 900; font-size: 11px; border: none; border-radius: 12px; padding: 7px 14px; cursor: pointer; box-shadow: 0 2px 12px rgba(255,215,0,0.6); letter-spacing: 0.5px;">
            CLAIM ${first.unlockValue}🪙 🎁
          </button>
        </div>
      `;
      this.unlockClaimContainer.style.display = "block";

      const btn = this.unlockClaimContainer.querySelector("#go-claim-unlock-btn") as HTMLButtonElement;
      btn?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (spendTokens(first.unlockValue)) {
          showDeductionFlyout(btn, first.unlockValue);
          if (first.category === "hero") {
            claimCharacter(first.id as CharacterId);
            setCharacter(first.id as CharacterId);
          } else if (first.category === "scene") {
            claimBiome(first.id as BiomeId);
            setBiome(first.id as BiomeId);
          } else if (first.category === "skin") {
            claimSkin(first.id);
            setSkin(first.id);
          }
          this.callbacks?.onClaimUnlock?.(first.category, first.id);
          const fresh = loadAll();
          if (this.tokensEl) this.tokensEl.textContent = fresh.tokens.toString();
          this.renderNextUnlockProgress(fresh.tokens);
          this.renderUnlockClaimBanner();
          this.renderQuickSwap(fresh, fresh.tokens);
        }
      });
    } else {
      this.unlockClaimContainer.style.display = "none";
    }
  }

  private renderNextUnlockProgress(tokens: number): void {
    const data = loadAll();
    const goal = getNextGoal(tokens, data);

    this.nextUnlockContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; margin-bottom: 5px;">
        <span style="color: #94a3b8; display: flex; align-items: center; gap: 4px;">
          🎯 Next: <strong style="color: #fff;">${goal.emoji} ${goal.name}</strong> <span style="font-size: 9px; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 1px 6px; border-radius: 6px;">${goal.category}</span>
        </span>
        <span style="color: #ffd700; font-weight: 900; text-shadow: 0 0 8px rgba(255,215,0,0.4);">${goal.needed} 🪙 away (${goal.progressPct}%)</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.6); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
        <div style="width: ${goal.progressPct}%; height: 100%; background: linear-gradient(90deg, #ffd700 0%, #00f5d4 100%); border-radius: 4px; box-shadow: 0 0 10px rgba(255, 215, 0, 0.7); transition: width 0.8s cubic-bezier(0.2, 0.8, 0.4, 1);"></div>
      </div>
    `;
    this.nextUnlockContainer.style.display = "block";
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

  private renderQuickSwap(data: ReturnType<typeof loadAll>, tokens: number): void {
    this.quickSwapContainer.innerHTML = "";

    // Render characters
    Object.values(CHARACTERS).forEach((char) => {
      const isUnlocked = isCharacterUnlocked(char.id, data.unlockedChars);
      const isClaimable = isCharacterClaimable(char.id, tokens, data.unlockedChars);
      const isSelected = data.character === char.id;

      const chip = document.createElement("button");
      chip.className = "btn interactive";
      chip.style.cssText = `
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 5px;
        background: ${isSelected ? "rgba(0, 229, 255, 0.22)" : isClaimable ? "rgba(255, 215, 0, 0.18)" : "rgba(255, 255, 255, 0.06)"};
        border: 1.5px solid ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.05)"};
        border-radius: 18px;
        padding: 5px 10px;
        color: ${isSelected ? "#00e5ff" : isClaimable ? "#ffd700" : isUnlocked ? "#fff" : "#64748b"};
        font-size: 11px;
        font-weight: 800;
        cursor: ${isUnlocked || isClaimable ? "pointer" : "default"};
        opacity: ${isUnlocked || isClaimable ? "1" : "0.5"};
        box-shadow: ${isSelected ? "0 0 12px rgba(0, 229, 255, 0.4)" : isClaimable ? "0 0 16px rgba(255, 215, 0, 0.45)" : "none"};
        animation: ${isClaimable ? "softGlowPulse 1.2s infinite alternate" : "none"};
        touch-action: pan-x;
        user-select: none;
      `;

      chip.innerHTML = `
        <span style="font-size: 16px;">${char.emoji}</span>
        <span>${char.name}</span>
        ${isSelected ? '<span style="font-size: 10px; color: #00f5d4;">✓</span>' : isClaimable ? `<span style="font-size: 9px; font-weight: 900; color: #ffd700; background: rgba(255, 215, 0, 0.2); padding: 1px 5px; border-radius: 6px;">CLAIM ${char.unlockValue}🪙 🎁</span>` : !isUnlocked ? `<span style="font-size: 9px; color: #ff9e00;">🔒${char.unlockValue}🪙</span>` : ""}
      `;

      chip.onclick = (e) => {
        e.stopPropagation();
        if (isClaimable) {
          if (spendTokens(char.unlockValue)) {
            showDeductionFlyout(chip, char.unlockValue);
            claimCharacter(char.id);
            setCharacter(char.id);
            this.callbacks?.onClaimUnlock?.("hero", char.id);
            this.callbacks?.onCharacterChange?.(char.id);
            const fresh = loadAll();
            if (this.tokensEl) this.tokensEl.textContent = fresh.tokens.toString();
            this.renderNextUnlockProgress(fresh.tokens);
            this.renderUnlockClaimBanner();
            this.renderQuickSwap(fresh, fresh.tokens);
          }
        } else if (isUnlocked) {
          setCharacter(char.id);
          this.callbacks?.onCharacterChange?.(char.id);
          this.renderQuickSwap(loadAll(), loadAll().tokens);
        }
      };

      this.quickSwapContainer.appendChild(chip);
    });
  }

  showRewindOption(onRewind: () => void): void {
    if (this.rewindContainer) {
      this.rewindContainer.style.display = "block";
      const btn = this.rewindContainer.querySelector("#go-claim-rewind-btn") as HTMLButtonElement;
      if (btn) {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.hide();
          onRewind();
        };
      }
    }
  }

  hideRewindOption(): void {
    if (this.rewindContainer) {
      this.rewindContainer.style.display = "none";
    }
  }

  hide(): void {
    this.overlay.style.display = "none";
    if (this.rewindContainer) {
      this.rewindContainer.style.display = "none";
    }
  }
}
