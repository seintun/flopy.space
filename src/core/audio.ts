export class AudioSys {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private flapNoiseBuf: AudioBuffer | null = null;
  private rewindNoiseBuf: AudioBuffer | null = null;
  private muted = false;

  unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.flapNoiseBuf = this.createNoiseBuffer(0.1);
        this.rewindNoiseBuf = this.createNoiseBuffer(0.8);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.5, this.ctx.currentTime);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  flap(soundType: "cat" | "dog" | "dragon" | "hamster" | "bird" = "cat"): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Soft base whoosh
    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.flapNoiseBuf || this.createNoiseBuffer(0.1);
    if (noiseBuf) {
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(soundType === "dragon" ? 250 : 450, now);
      filter.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
      filter.Q.setValueAtTime(2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(soundType === "dragon" ? 0.35 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.08);
    }

    // 2. Character-Specific Voice Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    switch (soundType) {
      case "cat":
        osc.type = "sine";
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.06);
        oscGain.gain.setValueAtTime(0.09, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        break;
      case "dog":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        oscGain.gain.setValueAtTime(0.14, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        break;
      case "dragon":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);
        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        break;
      case "hamster":
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
        oscGain.gain.setValueAtTime(0.06, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        break;
      case "bird":
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
        oscGain.gain.setValueAtTime(0.1, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        break;
    }

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  feverStart(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  biomeWarp(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

    missionComplete(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  rainbowTrail(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.04;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  countdownTick(num: number): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = num === 1 ? 1174.66 : 880;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  countdownGo(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [1318.51, 1760].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  shieldActive(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  shieldBreak(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  magnetActive(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  starGem(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  score(combo: number): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const semitones = Math.min(combo, 24);
    const freq = 560 * Math.pow(2, semitones / 24);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  collect(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [660, 880, 1320];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.07);
    });
  }

  nearMiss(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  die(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Sad meow pitch slide down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  rewind(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.rewindNoiseBuf || this.createNoiseBuffer(0.8);
    if (!noiseBuf) return;
    noise.buffer = noiseBuf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.7);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.7);
  }

  rewindResume(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  milestone(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }
}
