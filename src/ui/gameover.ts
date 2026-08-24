export interface GameOverCallbacks {
  onRetry: () => void;
  onMenu?: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}s`;
}

export class GameOverView {
  private overlay: HTMLElement;
  private scoreEl: HTMLElement;
  private pipesEl: HTMLElement;
  private bonusEl: HTMLElement;
  private bestEl: HTMLElement;
  private badgeEl: HTMLElement;
  private timeEl: HTMLElement;
  private tagEl: HTMLElement;
  private unlockBannerEl: HTMLElement;
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
      background: linear-gradient(180deg, transparent 40%, rgba(8, 12, 24, 0.75) 100%);
      z-index: 50;
      color: #fff;
      padding: max(16px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
      box-sizing: border-box;
      pointer-events: auto;
    `;

    this.overlay.innerHTML = `
      <div style="text-align: center; max-width: 320px; width: 90%; animation: popIn 0.28s cubic-bezier(0.2, 0.8, 0.4, 1); display: flex; flex-direction: column; align-items: center;">
        
        <div id="go-badge" style="display:none; margin: 0 auto 8px auto; background: linear-gradient(135deg, #ffd700, #ff9e00); color: #0f172a; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 20px; width: fit-content; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 12px rgba(255,215,0,0.4);">
          ★ NEW BEST RECORD ★
        </div>

        <div id="go-unlock-banner" style="display:none; margin: 0 auto 8px auto; background: linear-gradient(135deg, #00f5d4, #00b4d8); color: #002233; font-weight: 900; font-size: 11px; padding: 4px 14px; border-radius: 20px; width: fit-content; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 12px rgba(0,245,212,0.4);">
          🎉 NEW UNLOCK AVAILABLE!
        </div>

        <!-- High-Glance Score & Stat Capsule matching Rewind -->
        <div style="background: rgba(10, 16, 32, 0.88); border: 1.5px solid rgba(255, 77, 109, 0.45); border-radius: 20px; padding: 14px 18px; width: 100%; box-sizing: border-box; margin-bottom: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.6), inset 0 0 16px rgba(255, 77, 109, 0.14); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Final Score</span>
              <div id="go-score" style="font-size: 46px; font-weight: 900; line-height: 1; color: #fff; text-shadow: 0 0 20px rgba(255, 77, 109, 0.6); font-variant-numeric: tabular-nums;">0</div>
              <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-top: 2px;">
                <span id="go-pipes">0</span> pipes • <span id="go-bonus" style="color: #ffd700;">+0 bonus</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
              <div style="background: rgba(255, 215, 0, 0.14); border: 1px solid rgba(255, 215, 0, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">BEST</span>
                <span id="go-best" style="font-size: 16px; font-weight: 900; color: #ffd700; font-variant-numeric: tabular-nums;">0</span>
              </div>
              <div style="background: rgba(0, 229, 255, 0.14); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 3px 10px; display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 13px;">⏱️</span>
                <span id="go-time" style="font-size: 15px; font-weight: 900; color: #00e5ff; font-variant-numeric: tabular-nums;">00:00s</span>
              </div>
            </div>
          </div>
          <div id="go-tag" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-weight: 800; color: #ff4d6d; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
            ★ RUN CONCLUDED
          </div>
        </div>

        <!-- High-Impact Primary CTA -->
        <button id="go-retry-btn" class="btn interactive" style="width: 100%; height: 50px; font-size: 15px; font-weight: 900; background: linear-gradient(135deg, #00e5ff, #00f5d4); border: none; border-radius: 25px; color: #002233; cursor: pointer; box-shadow: 0 0 24px rgba(0, 229, 255, 0.6); letter-spacing: 0.5px; animation: softGlowPulse 1.2s infinite alternate; touch-action: manipulation;">
          PLAY AGAIN
        </button>
      </div>
    `;

    container.appendChild(this.overlay);

    this.scoreEl = this.overlay.querySelector("#go-score")!;
    this.pipesEl = this.overlay.querySelector("#go-pipes")!;
    this.bonusEl = this.overlay.querySelector("#go-bonus")!;
    this.bestEl = this.overlay.querySelector("#go-best")!;
    this.badgeEl = this.overlay.querySelector("#go-badge")!;
    this.timeEl = this.overlay.querySelector("#go-time")!;
    this.tagEl = this.overlay.querySelector("#go-tag")!;
    this.unlockBannerEl = this.overlay.querySelector("#go-unlock-banner")!;

    const retryBtn = this.overlay.querySelector("#go-retry-btn") as HTMLButtonElement;
    retryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hide();
      this.callbacks?.onRetry();
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
    this.scoreEl.textContent = score.toString();
    if (this.pipesEl) this.pipesEl.textContent = pipesPassed.toString();
    if (this.bonusEl) this.bonusEl.textContent = `+${bonusScore} bonus`;
    this.bestEl.textContent = best.toString();
    if (this.timeEl) this.timeEl.textContent = formatDuration(timeSec);
    this.badgeEl.style.display = isNewBest ? "block" : "none";
    this.unlockBannerEl.style.display = hasNewUnlock ? "block" : "none";

    if (isNewBest) {
      this.tagEl.textContent = "★ ALL-TIME HIGH SCORE!";
      this.tagEl.style.color = "#ffd700";
    } else if (best - score <= 10 && best - score > 0) {
      this.tagEl.textContent = `★ SO CLOSE! ${best - score} PTS OFF BEST`;
      this.tagEl.style.color = "#00f5d4";
    } else {
      this.tagEl.textContent = "★ RUN CONCLUDED";
      this.tagEl.style.color = "#ff4d6d";
    }

    this.overlay.style.display = "flex";
  }

  hide(): void {
    this.overlay.style.display = "none";
  }
}
