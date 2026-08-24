interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export class InstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private onStateChange?: (canInstall: boolean) => void;

  constructor(onStateChange?: (canInstall: boolean) => void) {
    this.onStateChange = onStateChange;

    const isStandalone =
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      this.isInstalled = true;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.onStateChange?.(true);
    });

    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.onStateChange?.(false);
    });
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.onStateChange?.(false);
    return choice.outcome === "accepted";
  }
}
