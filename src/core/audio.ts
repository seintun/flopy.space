export class AudioSys {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private flapNoiseBuf: AudioBuffer | null = null;
  private rewindNoiseBuf: AudioBuffer | null = null;
  private muted = false;
  private lastTokenAudioTime = 0;
  private visibilityHooked = false;

  constructor() {
    // Automatically hook user gesture listeners on window if in browser environment
    if (typeof window !== "undefined") {
      const autoUnlock = () => {
        this.unlock();
      };
      window.addEventListener("pointerdown", autoUnlock, { capture: true, passive: true });
      window.addEventListener("touchstart", autoUnlock, { capture: true, passive: true });
      window.addEventListener("keydown", autoUnlock, { capture: true, passive: true });
    }
  }

  unlock(): void {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime);

        // Master Dynamics Compressor: Warm brickwall limiting to prevent harshness and clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.flapNoiseBuf = this.createNoiseBuffer(0.08);
        this.rewindNoiseBuf = this.createNoiseBuffer(0.7);

        if (!this.visibilityHooked && typeof document !== "undefined") {
          this.visibilityHooked = true;
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && this.ctx && this.ctx.state === "suspended") {
              this.ctx.resume().catch(() => {});
            }
          });
        }
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  private ensureReady(): boolean {
    if (this.muted) return false;
    if (!this.ctx || this.ctx.state === "suspended") {
      this.unlock();
    }
    return !!(this.ctx && this.masterGain && this.ctx.state === "running");
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.45, this.ctx.currentTime);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private registerCleanup(
    source: AudioScheduledSourceNode,
    ...nodes: (AudioNode | null | undefined)[]
  ): void {
    source.onended = () => {
      try {
        source.disconnect();
        for (const n of nodes) {
          n?.disconnect();
        }
      } catch {
        // already disconnected
      }
    };
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    // Smooth pink/brown-ish noise for softer organic acoustic whoosh
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const val = (lastOut + 0.02 * white) / 1.02;
      lastOut = val;
      output[i] = val * 3.5;
    }
    return buffer;
  }

  /**
   * Organic, soft, melodic Flap sound with zero auditory fatigue.
   * Gentle low-pass air flutter + subtle musical character timbre.
   */
  flap(soundType: "cat" | "dog" | "dragon" | "hamster" | "bird" = "cat"): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Soft acoustic wing flutter (Low-pass filtered pink noise)
    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.flapNoiseBuf || this.createNoiseBuffer(0.08);
    if (noiseBuf) {
      noise.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(soundType === "dragon" ? 280 : 420, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.07);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(soundType === "dragon" ? 0.22 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      this.registerCleanup(noise, filter, gain);
      noise.start(now);
      noise.stop(now + 0.07);
    }

    // 2. Character melodic body note (Warm sine/triangle marimba timbre)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    switch (soundType) {
      case "cat":
        // Soft kalimba-like chime (Neko)
        osc.type = "sine";
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        break;
      case "dog":
        // Warm wooden marimba tap (Shiba Doge)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.07);
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        break;
      case "dragon":
        // Deep soothing velvet ember resonance (Chibi Dragon)
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
        oscGain.gain.setValueAtTime(0.18, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        break;
      case "hamster":
        // Delicate crystal droplet (Astro Hammy)
        osc.type = "sine";
        osc.frequency.setValueAtTime(960, now);
        osc.frequency.exponentialRampToValueAtTime(1240, now + 0.05);
        oscGain.gain.setValueAtTime(0.08, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        break;
      case "bird":
        // Acoustic bamboo flute flutter (Retro Bird)
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.06);
        oscGain.gain.setValueAtTime(0.11, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        break;
    }

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    this.registerCleanup(osc, oscGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Soothing aerodynamic wind-graze chime for near misses (exhilarating yet non-alarming)
   */
  nearMiss(soundType: "cat" | "dog" | "dragon" | "hamster" | "bird" = "cat"): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Aerodynamic wind-shear whisper
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.08);

    // 2. Sweet harmonic micro-chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = "sine";

    const freqs: Record<string, number> = {
      cat: 1174.66, // D6
      dog: 659.25, // E5
      dragon: 440.0, // A4
      hamster: 1567.98, // G6
      bird: 1046.5, // C6
    };

    const baseFreq = freqs[soundType] || 1046.5;
    chime.frequency.setValueAtTime(baseFreq, now + 0.02);
    chime.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.1);

    chimeGain.gain.setValueAtTime(0.12, now + 0.02);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    this.registerCleanup(chime, chimeGain);
    chime.start(now + 0.02);
    chime.stop(now + 0.11);
  }

  /**
   * Gentle, comical bubble poof on death/crash to minimize player frustration
   */
  die(soundType: "cat" | "dog" | "dragon" | "hamster" | "bird" = "cat"): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (soundType) {
      case "cat":
        // Gentle comical descending purr-slide
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        break;
      case "dog":
        // Soft cartoon puppy whine
        osc.type = "sine";
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.26);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        break;
      case "dragon":
        // Warm sub-bass ember puff
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.32);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        break;
      case "hamster":
        // Soft squeak bubble pop
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.24);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        break;
      case "bird":
        // Soothing retro slide
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.26);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        break;
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Harmonious 2-octave pentatonic music-box chimes on token streaks
   */
  tokenChime(streak = 0): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const audioTime = Math.max(now, this.lastTokenAudioTime + 0.05);
    this.lastTokenAudioTime = audioTime;

    // Soothing Japanese wind-chime pentatonic scale: C5, D5, E5, G5, A5, C6, D6, E6, G6, A6
    const PENTATONIC = [
      523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
    ];
    const freq = PENTATONIC[streak % PENTATONIC.length]!;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, audioTime + 0.1);

    gain.gain.setValueAtTime(0.18, audioTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);

    osc.start(audioTime);
    osc.stop(audioTime + 0.14);
  }

  /**
   * Clean, harmonious chime on normal pipe clearance with subtle combo escalation
   */
  score(combo: number): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale note progression based on combo
    const PENTATONIC_BASE = [440, 493.88, 554.37, 659.25, 739.99, 880];
    const base = PENTATONIC_BASE[combo % PENTATONIC_BASE.length]!;

    osc.type = "sine";
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.05, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Sparkling music-box chime for Chibi Nano Orb
   */
  chibiPickup(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.035;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  /**
   * Warm marimba bounce for Chubby Chonker Orb
   */
  chubbyPickup(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.2);

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(80, now + 0.08);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.26);
    subGain.gain.setValueAtTime(0.28, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    this.registerCleanup(subOsc, subGain);
    subOsc.start(now + 0.08);
    subOsc.stop(now + 0.26);
  }

  voidMineHit(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  gravitySinkHit(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  shieldActive(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  shieldBreak(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  magnetActive(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  starGem(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880.0, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.04;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  collect(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880.0];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  }

  rainbowTrail(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.04;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  feverStart(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  biomeWarp(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.35);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  missionComplete(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.07;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  countdownTick(num: number): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = num === 1 ? 987.77 : 783.99;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  countdownGo(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [1046.5, 1318.51].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  rewind(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.rewindNoiseBuf || this.createNoiseBuffer(0.7);
    if (!noiseBuf) return;
    noise.buffer = noiseBuf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.6);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(noise, filter, gain);

    noise.start(now);
    noise.stop(now + 0.6);
  }

  rewindResume(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    this.registerCleanup(osc, gain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  milestone(): void {
    if (!this.ensureReady() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      this.registerCleanup(osc, gain);
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }
}
