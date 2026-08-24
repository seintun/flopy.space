export class FeverSystem {
  meter = 0; // 0 to 1
  isActive = false;
  durationLeft = 0;
  readonly maxDuration = 5.0; // 5 seconds of fever frenzy
  readonly magnetRadius = 4.5;

  addEnergy(amount: number): boolean {
    if (this.isActive) return false;
    this.meter = Math.min(1, this.meter + amount);
    if (this.meter >= 1) {
      this.trigger();
      return true;
    }
    return false;
  }

  trigger(): void {
    this.isActive = true;
    this.meter = 1;
    this.durationLeft = this.maxDuration;
  }

  update(dt: number): { ended: boolean } {
    let ended = false;
    if (this.isActive) {
      this.durationLeft = Math.max(0, this.durationLeft - dt);
      this.meter = this.durationLeft / this.maxDuration;
      if (this.durationLeft <= 0) {
        this.isActive = false;
        this.meter = 0;
        ended = true;
      }
    }
    return { ended };
  }

  reset(): void {
    this.meter = 0;
    this.isActive = false;
    this.durationLeft = 0;
  }

  get scoreMultiplier(): number {
    return this.isActive ? 2 : 1;
  }
}
