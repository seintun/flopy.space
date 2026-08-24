import { SLOWMO_SCALE, SLOWMO_HOLD_S, SLOWMO_EASE_S } from "./constants";

export class TimeSystem {
  scale = 1;
  frozen = false;
  private target = 1;
  private holdLeft = 0;
  private freezeLeft = 0;

  update(realDt: number): void {
    if (this.freezeLeft > 0) {
      this.freezeLeft -= realDt;
      this.frozen = this.freezeLeft > 0;
    }
    if (this.holdLeft > 0) {
      this.holdLeft -= realDt;
      if (this.holdLeft <= 0) {
        this.target = 1;
      }
    } else {
      this.target = 1;
    }
    const k = 1 - Math.exp(-realDt / SLOWMO_EASE_S);
    this.scale += (this.target - this.scale) * k;
  }

  triggerSlowmo(seconds = SLOWMO_HOLD_S, targetScale = SLOWMO_SCALE): void {
    this.holdLeft = seconds;
    this.target = targetScale;
  }

  triggerMicroFlash(): void {
    this.holdLeft = Math.max(this.holdLeft, 0.08);
  }

  slowmoRemaining(): number {
    return Math.max(0, this.holdLeft);
  }

  hitstop(ms: number): void {
    this.freezeLeft = ms / 1000;
    this.frozen = true;
  }
}
