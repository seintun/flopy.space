import { trackEvent } from "../core/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "native" | "ios" | "desktop";

export class InstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installed = false;
  private onStateChange?: (canInstall: boolean) => void;

  constructor(onStateChange?: (canInstall: boolean) => void) {
    this.onStateChange = onStateChange;

    if (typeof window !== "undefined") {
      const isStandalone =
        ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) ||
        window.matchMedia("(display-mode: standalone)").matches;

      if (isStandalone) {
        this.installed = true;
      }

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.onStateChange?.(true);
      });

      window.addEventListener("appinstalled", () => {
        this.installed = true;
        this.deferredPrompt = null;
        this.onStateChange?.(false);
        trackEvent("pwa_install", { outcome: "completed" });
      });
    }
  }

  isStandalone(): boolean {
    return this.installed;
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.installed;
  }

  isIOS(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  getInstallState(): InstallState {
    if (this.installed) return "installed";
    if (this.deferredPrompt) return "native";
    if (this.isIOS()) return "ios";
    return "desktop";
  }

  async promptInstall(): Promise<boolean> {
    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.onStateChange?.(false);
      trackEvent("pwa_install", { outcome: choice.outcome });
      return choice.outcome === "accepted";
    }
    return false;
  }

  showInstallModal(container: HTMLElement): void {
    const existing = document.getElementById("pwa-install-modal");
    if (existing) existing.remove();

    const state = this.getInstallState();
    const modal = document.createElement("div");
    modal.id = "pwa-install-modal";
    modal.className = "interactive";
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 18, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.25s ease-out;
      pointer-events: auto;
    `;

    let contentHtml = "";

    if (state === "ios") {
      contentHtml = `
        <div style="font-size: 32px; margin-bottom: 8px;">📲</div>
        <h3 style="font-size: 18px; font-weight: 900; color: #fff; margin: 0 0 8px 0; letter-spacing: -0.01em;">Install to Home Screen</h3>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 16px 0;">
          Play FLOPY.SPACE full-screen with 0ms latency and 100% offline access!
        </p>
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; text-align: left; margin-bottom: 18px; font-size: 12px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #00e5ff; color: #000; font-weight: 900; width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px;">1</span>
            <span>Tap the <strong>Share</strong> button <span style="display: inline-block; font-size: 15px; vertical-align: middle;">⎋</span> in Safari's toolbar.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #00ffc3; color: #000; font-weight: 900; width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px;">2</span>
            <span>Scroll down and select <strong>Add to Home Screen</strong> <span style="display: inline-block; font-size: 15px; vertical-align: middle;">⊞</span>.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #ffd700; color: #000; font-weight: 900; width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px;">3</span>
            <span>Tap <strong>Add</strong> in top right corner. Enjoy offline arcade!</span>
          </div>
        </div>
      `;
    } else if (state === "installed") {
      contentHtml = `
        <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
        <h3 style="font-size: 18px; font-weight: 900; color: #00ffc3; margin: 0 0 8px 0;">Offline Ready & Installed!</h3>
        <p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin: 0 0 16px 0;">
          FLOPY.SPACE is installed in standalone mode. All audio, 3D assets, and physics run 100% offline without internet connection.
        </p>
      `;
    } else {
      contentHtml = `
        <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
        <h3 style="font-size: 18px; font-weight: 900; color: #fff; margin: 0 0 8px 0;">Install FLOPY.SPACE</h3>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 16px 0;">
          Play directly from your desktop or home screen with 100% offline capability.
        </p>
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; text-align: left; margin-bottom: 18px; font-size: 12px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #00e5ff; color: #000; font-weight: 900; width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px;">⊕</span>
            <span>Click the <strong>Install</strong> icon in the address bar (Chrome/Edge/Brave).</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #ffd700; color: #000; font-weight: 900; width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px;">⋮</span>
            <span>Or open browser menu <strong style="font-size:14px;">⋮</strong> $\\to$ <strong>Save and Share</strong> $\\to$ <strong>Install App</strong>.</span>
          </div>
        </div>
      `;
    }

    const card = document.createElement("div");
    card.style.cssText = `
      background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
      border: 1px solid rgba(0, 229, 255, 0.3);
      border-radius: 20px;
      padding: 22px 20px;
      max-width: 340px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.2);
    `;
    card.innerHTML = contentHtml;

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn interactive";
    closeBtn.textContent = "GOT IT";
    closeBtn.style.cssText = `
      background: linear-gradient(135deg, #00e5ff, #0077ff);
      color: #001122;
      font-weight: 900;
      font-size: 12px;
      border: none;
      border-radius: 12px;
      padding: 10px 24px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
      touch-action: manipulation;
      width: 100%;
    `;
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      modal.remove();
    });

    card.appendChild(closeBtn);
    modal.appendChild(card);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });

    container.appendChild(modal);
  }
}
