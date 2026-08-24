export interface GameOverCallbacks {
  onRetry: () => void;
  onMenu?: () => void;
}

export class GameOverView {
  private overlay: HTMLElement;
  private scoreEl: HTMLElement;
  private bestEl: HTMLElement;
  private badgeEl: HTMLElement;
  private featherEl: HTMLElement;
  private callbacks?: GameOverCallbacks;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement("div");
    this.overlay.id = "gameover-overlay";
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(8, 12, 24, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 50;
      color: #fff;
      padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      box-sizing: border-box;
    `;

    this.overlay.innerHTML = `
      <div style="text-align:center; max-width: 340px; width: 88%; animation: popIn 0.35s cubic-bezier(0.2, 0.8, 0.4, 1);">
        <h2 style="font-size: 32px; margin: 0 0 12px 0; font-weight: 900; letter-spacing: -0.02em; color: #ff4d6d; text-shadow: 0 4px 20px rgba(255, 77, 109, 0.4);">
          GAME OVER
        </h2>

        <div id="go-badge" style="display:none; margin: 0 auto 14px auto; background: linear-gradient(135deg, #ffd700, #ff9e00); color: #0f172a; font-weight: 900; font-size: 12px; padding: 4px 14px; border-radius: 20px; width: fit-content; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 12px rgba(255,215,0,0.4);">
          ★ NEW BEST RECORD ★
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; padding: 22px 20px; margin-bottom: 20px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Score</div>
          <div id="go-score" style="font-size: 56px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 18px; color: #fff; letter-spacing: -0.02em;">0</div>
          
          <div style="display: flex; justify-content: space-around; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            <div>
              <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Best</div>
              <div id="go-best" style="font-size: 22px; font-weight: 800; color: #ffd700;">0</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Feathers</div>
              <div id="go-feathers" style="font-size: 22px; font-weight: 800; color: #00e5ff;">🪶 0</div>
            </div>
          </div>
        </div>

        <button id="go-retry-btn" class="btn interactive" style="width: 100%; height: 56px; font-size: 17px; font-weight: 800; background: linear-gradient(135deg, #00e5ff, #0099cc); border: none; border-radius: 28px; color: #002233; cursor: pointer; box-shadow: 0 6px 24px rgba(0, 229, 255, 0.4); margin-bottom: 8px; letter-spacing: 0.5px;">
          PLAY AGAIN
        </button>
        <div style="font-size: 11px; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">
          PRESS SPACEBAR OR CLICK TO RETRY
        </div>
      </div>
    `;

    container.appendChild(this.overlay);

    this.scoreEl = this.overlay.querySelector("#go-score")!;
    this.bestEl = this.overlay.querySelector("#go-best")!;
    this.badgeEl = this.overlay.querySelector("#go-badge")!;
    this.featherEl = this.overlay.querySelector("#go-feathers")!;

    const retryBtn = this.overlay.querySelector("#go-retry-btn") as HTMLButtonElement;
    retryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hide();
      this.callbacks?.onRetry();
    });
  }

  show(score: number, best: number, isNewBest: boolean, feathers: number, callbacks: GameOverCallbacks): void {
    this.callbacks = callbacks;
    this.scoreEl.textContent = score.toString();
    this.bestEl.textContent = best.toString();
    this.featherEl.textContent = `🪶 ${feathers}`;
    this.badgeEl.style.display = isNewBest ? "block" : "none";
    this.overlay.style.display = "flex";
  }

  hide(): void {
    this.overlay.style.display = "none";
  }
}
