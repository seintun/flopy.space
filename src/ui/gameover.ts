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
      background: rgba(8, 12, 28, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 50;
      color: #fff;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      box-sizing: border-box;
    `;

    this.overlay.innerHTML = `
      <div style="text-align:center; max-width: 320px; width: 85%; animation: popIn 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);">
        <h2 style="font-size: 34px; margin: 0 0 16px 0; font-weight: 900; letter-spacing: 1px; color: #ff5252; text-shadow: 0 2px 12px rgba(255,82,82,0.4);">
          GAME OVER
        </h2>

        <div id="go-badge" style="display:none; margin: 0 auto 12px auto; background: #ffd700; color: #111; font-weight: 900; font-size: 13px; padding: 4px 12px; border-radius: 20px; width: fit-content; text-transform: uppercase; letter-spacing: 1px;">
          ★ New Best! ★
        </div>

        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
          <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 4px;">Score</div>
          <div id="go-score" style="font-size: 48px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 16px; color: #fff;">0</div>
          
          <div style="display: flex; justify-content: space-around; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
            <div>
              <div style="font-size: 11px; opacity: 0.7; text-transform: uppercase;">Best</div>
              <div id="go-best" style="font-size: 22px; font-weight: 800; color: #ffd700;">0</div>
            </div>
            <div>
              <div style="font-size: 11px; opacity: 0.7; text-transform: uppercase;">Feathers</div>
              <div id="go-feathers" style="font-size: 22px; font-weight: 800; color: #00e5ff;">🪶 0</div>
            </div>
          </div>
        </div>

        <button id="go-retry-btn" class="btn interactive" style="width: 100%; height: 60px; font-size: 20px; font-weight: 900; background: linear-gradient(135deg, #00e5ff, #0099cc); border: none; border-radius: 30px; color: #002233; cursor: pointer; box-shadow: 0 6px 20px rgba(0,229,255,0.4); margin-bottom: 12px; transition: transform 0.1s;">
          PLAY AGAIN
        </button>
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
