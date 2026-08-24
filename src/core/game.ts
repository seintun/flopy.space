import {
  INVULN_TICKS,
  REWINDS_MAX_PER_RUN,
  SLOWMO_HOLD_S,
  MILESTONE_EVERY,
} from "./constants";
import { createWorld, type World, type HitType } from "./types";
import { flap, stepBird } from "./physics";
import { scrollForScore } from "./difficulty";
import { advance } from "./spawner";
import { checkCollisions } from "./collision";
import { processPasses, type PassEvent } from "./scoring";
import { TimeSystem } from "./time";
import { SnapshotBuffer } from "./snapshots";
import { makeAccumulator } from "./loop";
import { dayNight } from "./palette";
import { type SceneCtx } from "../render/scene";
import { type CameraRig } from "../render/camera";
import { SkyDome } from "../render/sky";
import { CharacterView } from "../entities/characterView";
import { TrailView } from "../entities/trailView";
import { PipesView } from "../entities/pipesView";
import { PickupsView } from "../entities/pickupsView";
import { Juice } from "../systems/juice";
import { FeverSystem } from "./fever";
import { getBiomeForScore, BIOMES, type BiomeDef, type BiomeId } from "./biomes";
import { CHARACTERS, type CharacterId, type SoundType } from "./characters";
import type { MissionEventType } from "./missions";
import { loadAll } from "./storage";
import type { PowerUpType } from "./powerups";

export type GameState =
  | "menu"
  | "countdown"
  | "playing"
  | "hitstop"
  | "rewindReplay"
  | "rewindChoice"
  | "gameOver";

export interface GameHooks {
  onStateChange?: (state: GameState) => void;
  onScoreChange?: (
    score: number,
    combo: number,
    feathers: number,
    timeSec?: number,
    pipesPassed?: number,
    bonusScore?: number,
  ) => void;
  onCountdown?: (step: number | string) => void;
  onSlowmoMeter?: (frac: number) => void;
  onFeverChange?: (active: boolean, frac: number) => void;
  onPowerUpsChange?: (rainbowLeft: number, hasShield: boolean, magnetLeft: number) => void;
  onBiomeChange?: (biome: BiomeDef) => void;
  onMissionProgress?: (event: MissionEventType, value?: number) => void;
  onPass?: (event: PassEvent) => void;
  onOrbCollect?: (type: PowerUpType) => void;
  onShieldBreak?: () => void;
  onHit?: (type: HitType) => void;
  onFlap?: (soundType: SoundType) => void;
  onRewindStart?: () => void;
  onRewindChoice?: (feathers: number, pipesPassed?: number, bonusScore?: number) => void;
  onRewindComplete?: () => void;
  onMilestone?: (score: number) => void;
  onGameOver?: (
    score: number,
    timeSec: number,
    pipesPassed?: number,
    bonusScore?: number,
  ) => void;
}

export class Game {
  state: GameState = "menu";
  world: World;
  time = new TimeSystem();
  buf = new SnapshotBuffer();
  fever = new FeverSystem();
  private accumulator = makeAccumulator();

  sky: SkyDome;
  characterView: CharacterView;
  trailView: TrailView;
  pipesView: PipesView;
  pickupsView: PickupsView;
  juice: Juice;

  currentBiome: BiomeDef = BIOMES.meadow;
  biomeOverride: BiomeId | "auto" = "auto";
  selectedCharacterId: CharacterId = "bird";

  private totalTime = 0;
  private lastTime = 0;
  private lastMilestoneCrossed = 0;
  private replaySnapshots: World[] = [];
  private replayIndex = 0;
  private replayTimer = 0;

  // Countdown timer
  private countdownTimer = 0;
  private lastCountdownVal: string | number = "";

  hooks: GameHooks = {};

  constructor(
    public ctx: SceneCtx,
    public rig: CameraRig,
    container: HTMLElement,
  ) {
    this.world = createWorld(Date.now());

    this.sky = new SkyDome();
    ctx.scene.add(this.sky.group);

    this.characterView = new CharacterView();
    ctx.scene.add(this.characterView.group);

    this.trailView = new TrailView(ctx.scene);
    this.pipesView = new PipesView(ctx.scene);
    this.pickupsView = new PickupsView(ctx.scene);
    this.juice = new Juice(ctx.scene, container);

    this.applyBiome(this.currentBiome);
  }

  setCharacter(charId: CharacterId, skinId?: string): void {
    this.selectedCharacterId = charId;
    this.characterView.setCharacter(charId, skinId);
  }

  setBiomeOverride(biomeId: BiomeId | "auto"): void {
    this.biomeOverride = biomeId;
    this.applyBiome(getBiomeForScore(this.world.score, this.biomeOverride));
  }

  private applyBiome(biome: BiomeDef): void {
    this.currentBiome = biome;
    this.pipesView.setBiomeTheme(biome.pipeColor, biome.pipeLipColor, biome.pipeEmissive);
    this.ctx.setBiomeGround(biome.groundColor, biome.gridColor);
    this.ctx.biomeVfx.setBiome(biome.id);
    this.hooks.onBiomeChange?.(biome);
  }

  setState(next: GameState): void {
    if (this.state === next) return;
    this.state = next;
    this.hooks.onStateChange?.(next);
  }

  start(seed = Date.now(), initialFeathers?: number): void {
    const startFeathers =
      initialFeathers !== undefined ? initialFeathers : loadAll().feathers;
    this.world = createWorld(seed);
    this.world.feathersRun = Math.min(9, Math.max(0, startFeathers));
    this.time = new TimeSystem();
    this.buf = new SnapshotBuffer();
    this.fever.reset();
    this.accumulator.reset();
    this.lastMilestoneCrossed = 0;

    this.applyBiome(getBiomeForScore(0, this.biomeOverride));

    // Initiate 3-2-1 countdown
    this.countdownTimer = 1.35;
    this.lastCountdownVal = 3;
    this.setState("countdown");
    this.hooks.onCountdown?.(3);

    this.hooks.onScoreChange?.(0, 0, this.world.feathersRun, 0);
    this.hooks.onSlowmoMeter?.(0);
    this.hooks.onFeverChange?.(false, 0);
    this.hooks.onPowerUpsChange?.(0, false, 0);
  }

  doFlap(): void {
    if (this.state === "menu") {
      this.start();
      return;
    }
    if (this.state === "countdown") {
      // Allow early tap during countdown to hover
      flap(this.world);
      this.characterView.onFlap();
      const sound = CHARACTERS[this.selectedCharacterId]?.soundType || "bird";
      this.hooks.onFlap?.(sound);
      return;
    }
    if (this.state === "rewindChoice") {
      if (this.world.feathersRun > 0 && this.buf.canRewind()) {
        this.chooseRewind();
      } else {
        this.acceptDeath();
      }
      return;
    }
    if (this.state === "gameOver") {
      this.start();
      return;
    }
    if (this.state === "playing" && this.world.bird.alive) {
      flap(this.world);
      this.characterView.onFlap();
      const sound = CHARACTERS[this.selectedCharacterId]?.soundType || "bird";
      this.hooks.onFlap?.(sound);
    }
  }

  chooseRewind(): boolean {
    if (this.state !== "rewindChoice") return false;
    if (this.world.feathersRun <= 0 || !this.buf.canRewind()) {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score, this.world.runDurationSec);
      return false;
    }

    // Begin dynamic rewind scrub replay now that user has chosen to rewind!
    this.replaySnapshots = this.buf.getSnapshotsReverse();
    this.replayIndex = 0;
    this.replayTimer = 0;
    this.setState("rewindReplay");
    this.hooks.onRewindStart?.();
    return true;
  }

  acceptDeath(): void {
    if (this.state === "rewindChoice" || this.state === "hitstop") {
      this.setState("gameOver");
      this.hooks.onGameOver?.(
        this.world.score,
        this.world.runDurationSec,
        this.world.pipesPassed,
        this.world.bonusScore,
      );
    }
  }

  frame(nowMs: number): void {
    if (!this.lastTime) this.lastTime = nowMs;
    const realDt = Math.min((nowMs - this.lastTime) / 1000, 0.1);
    this.lastTime = nowMs;
    this.totalTime += realDt;

    this.time.update(realDt);

    const feverResult = this.fever.update(realDt);
    if (feverResult.ended) {
      this.hooks.onFeverChange?.(false, 0);
    } else if (this.fever.isActive) {
      this.hooks.onFeverChange?.(true, this.fever.meter);
    }

    const shake = this.juice.update(realDt);

    let alpha = 1;

    switch (this.state) {
      case "menu": {
        this.juice.setBorderFx("none");
        // Idle gentle hover
        this.world.bird.y = 1.5 + Math.sin(this.totalTime * 2.5) * 0.25;
        this.world.bird.pitch = Math.cos(this.totalTime * 2.5) * 8;
        break;
      }

      case "countdown": {
        this.juice.setBorderFx("none");
        this.countdownTimer -= realDt;

        // Hover bird
        this.world.bird.y = 1.5 + Math.sin(this.totalTime * 4) * 0.18;
        this.world.bird.pitch = Math.cos(this.totalTime * 4) * 6;

        let currentVal: string | number = 1;
        if (this.countdownTimer > 0.9) currentVal = 3;
        else if (this.countdownTimer > 0.45) currentVal = 2;
        else if (this.countdownTimer > 0.05) currentVal = 1;
        else currentVal = "FLAP!";

        if (currentVal !== this.lastCountdownVal) {
          this.lastCountdownVal = currentVal;
          this.hooks.onCountdown?.(currentVal);
        }

        if (this.countdownTimer <= 0) {
          this.setState("playing");
          this.doFlap();
        }
        break;
      }

      case "playing": {
        // Track survival duration
        this.world.runDurationSec += realDt;

        // Update slowmo meter
        const slowmoRemaining = this.time.slowmoRemaining();
        this.hooks.onSlowmoMeter?.(slowmoRemaining / SLOWMO_HOLD_S);
        this.hooks.onPowerUpsChange?.(
          this.world.rainbowTrailTimer,
          this.world.hasShield,
          this.world.magnetTimer,
        );
        this.hooks.onScoreChange?.(
          this.world.score,
          this.world.combo,
          this.world.feathersRun,
          this.world.runDurationSec,
          this.world.pipesPassed,
          this.world.bonusScore,
        );

        // Synchronize ambient border FX
        const slowmoActive = this.time.scale < 0.9 && !this.time.frozen;
        const borderType = this.fever.isActive
          ? "fever"
          : this.world.rainbowTrailTimer > 0
            ? "rainbow"
            : this.world.hasShield
              ? "shield"
              : this.world.magnetTimer > 0
                ? "magnet"
                : slowmoActive
                  ? "slowmo"
                  : "none";
        this.juice.setBorderFx(borderType);

        // Fever mode visual trail
        if (this.fever.isActive) {
          const colors = [0xff007f, 0x00f5d4, 0xffd166, 0x7209b7, 0xffffff];
          const col = colors[Math.floor(Math.random() * colors.length)]!;
          this.juice.burst(-0.4, this.world.bird.y, 0, 2, col);
        }

        alpha = this.accumulator.step(realDt * this.time.scale, this.time.frozen, (dt) => {
          const w = this.world;
          w.scrollSpeed = scrollForScore(w.score);

          // Update active power-up timers
          if (w.rainbowTrailTimer > 0) w.rainbowTrailTimer = Math.max(0, w.rainbowTrailTimer - dt);
          if (w.magnetTimer > 0) w.magnetTimer = Math.max(0, w.magnetTimer - dt);

          advance(w, dt);
          stepBird(w, dt);
          this.buf.record(w);

          // Check dynamic biome transition strictly every 15 pipes
          const targetBiome = getBiomeForScore(w.pipesPassed, this.biomeOverride, w.runSeed);
          if (targetBiome.id !== this.currentBiome.id) {
            this.applyBiome(targetBiome);
            this.juice.popupAtWorld(`🌍 ${targetBiome.name.toUpperCase()}`, 0, w.bird.y, 0, this.ctx.camera, "#00f5d4", 1.0);
          }

          // Power-up Pickups & Magnet Vacuum
          const hasMagnet = w.magnetTimer > 0 || this.fever.isActive;
          const magnetRadius = w.magnetTimer > 0 ? 8.0 : this.fever.magnetRadius;

          for (const orb of w.orbs) {
            if (!orb.taken) {
              const dx = orb.x - 0;
              const dy = orb.y - w.bird.y;
              const distSq = dx * dx + dy * dy;

              // Magnet gravitational attraction
              if (hasMagnet && distSq < magnetRadius * magnetRadius) {
                orb.x += (0 - orb.x) * 8 * dt;
                orb.y += (w.bird.y - orb.y) * 8 * dt;
              }

              if (distSq < 0.85) {
                orb.taken = true;
                const pType: PowerUpType = orb.type || "slowmo";

                switch (pType) {
                  case "slowmo": {
                    this.time.triggerSlowmo();
                    w.bonusScore = (w.bonusScore || 0) + 1;
                    w.score = (w.pipesPassed || 0) + w.bonusScore;
                    this.hooks.onOrbCollect?.("slowmo");
                    this.hooks.onMissionProgress?.("slowmo");
                    break;
                  }
                  case "rainbow_trail": {
                    w.rainbowTrailTimer = 7.0;
                    w.bonusScore = (w.bonusScore || 0) + 2;
                    w.score = (w.pipesPassed || 0) + w.bonusScore;
                    this.juice.confetti(0, w.bird.y, 0, 25);
                    this.hooks.onOrbCollect?.("rainbow_trail");
                    break;
                  }
                  case "shield": {
                    w.hasShield = true;
                    w.bonusScore = (w.bonusScore || 0) + 1;
                    w.score = (w.pipesPassed || 0) + w.bonusScore;
                    this.hooks.onOrbCollect?.("shield");
                    break;
                  }
                  case "magnet": {
                    w.magnetTimer = 6.0;
                    w.bonusScore = (w.bonusScore || 0) + 1;
                    w.score = (w.pipesPassed || 0) + w.bonusScore;
                    this.hooks.onOrbCollect?.("magnet");
                    break;
                  }
                  case "star_gem": {
                    w.bonusScore = (w.bonusScore || 0) + 5;
                    w.score = (w.pipesPassed || 0) + w.bonusScore;
                    w.combo += 1;
                    this.juice.popupAtWorld("+5 GEM! ⭐", -0.4, w.bird.y, 0, this.ctx.camera, "#ffbe0b", -1.1);
                    this.juice.confetti(0, w.bird.y, 0, 20);
                    this.hooks.onOrbCollect?.("star_gem");
                    break;
                  }
                }

                const feverTriggered = this.fever.addEnergy(0.35);
                if (feverTriggered) {
                  this.rig.kick(4);
                  this.hooks.onFeverChange?.(true, 1);
                  this.hooks.onMissionProgress?.("fever");
                } else if (!this.fever.isActive) {
                  this.hooks.onFeverChange?.(false, this.fever.meter);
                }
              }
            }
          }

          // Collisions (with Shield Defense)
          const hit = checkCollisions(w);
          if (hit) {
            if (w.hasShield) {
              w.hasShield = false;
              w.bird.invulnUntilTick = w.tick + 90; // 0.75s immunity
              this.time.hitstop(24);
              this.juice.addTrauma(0.55);
              this.juice.burst(0, w.bird.y, 0, 20, 0xffd700);
              this.juice.popupAtWorld("💥 SHIELD SAVED!", -0.4, w.bird.y, 0, this.ctx.camera, "#ffd700", -1.1);
              this.hooks.onShieldBreak?.();
            } else {
              w.bird.alive = false;
              this.fever.reset();
              this.hooks.onFeverChange?.(false, 0);
              this.juice.addTrauma(0.85);
              this.juice.burst(0, w.bird.y, 0, 24, 0xff5252);
              this.juice.setBorderFx("none");
              this.hooks.onHit?.(hit);

              const canRewind =
                this.world.feathersRun > 0 &&
                this.world.rewindsUsedRun < REWINDS_MAX_PER_RUN &&
                this.buf.canRewind();

              if (canRewind) {
                // Freeze the screen on the exact collision frame to show where it went wrong!
                this.setState("rewindChoice");
                this.hooks.onRewindChoice?.(
                  this.world.feathersRun,
                  this.world.pipesPassed,
                  this.world.bonusScore,
                );
              } else {
                this.time.hitstop(45);
                this.setState("hitstop");
              }
              return;
            }
          }

          // Passes & Scoring (Raw Pipes + Spree Bonus, Max Multiplier 3x)
          const passes = processPasses(w);
          for (const p of passes) {
            this.pipesView.flash(p.pipeId);

            // Tiered color feedback: White (+1) -> Teal (+2) -> Gold (+3) -> Coral (CLOSE! +2)
            const popupColor = p.nearMiss
              ? "#ff2a6d"
              : p.points >= 3
                ? "#ffd700"
                : p.points === 2
                  ? "#00f5d4"
                  : "#ffffff";
            const popupText = p.nearMiss ? "CLOSE! +2" : `+${p.points}`;
            this.juice.popupAtWorld(popupText, 0, w.bird.y, 0, this.ctx.camera, popupColor, 0.85);

            if (p.nearMiss) {
              this.juice.flashBorder("#ff2a6d", 120);
              this.time.triggerMicroFlash();
              this.hooks.onMissionProgress?.("nearMiss");
            } else if (p.points >= 3) {
              this.juice.flashBorder("#ffd700", 100);
            } else if (p.points === 2) {
              this.juice.flashBorder("#00f5d4", 80);
            } else {
              this.juice.flashBorder("#ffffff", 60);
            }

            // Add Fever energy on pass
            const feverTriggered = this.fever.addEnergy(p.nearMiss ? 0.25 : 0.12);
            if (feverTriggered) {
              this.rig.kick(4);
              this.hooks.onFeverChange?.(true, 1);
              this.hooks.onMissionProgress?.("fever");
            } else if (!this.fever.isActive) {
              this.hooks.onFeverChange?.(false, this.fever.meter);
            }

            this.hooks.onPass?.(p);
            this.hooks.onMissionProgress?.("pass");
            if (w.combo >= 5) {
              this.hooks.onMissionProgress?.("combo5");
            }
          }

          if (passes.length > 0) {
            this.hooks.onScoreChange?.(
              w.score,
              w.combo,
              w.feathersRun,
              w.runDurationSec,
              w.pipesPassed,
              w.bonusScore,
            );
            this.hooks.onMissionProgress?.("scoreMilestone", w.score);

            // Rare, non-distracting milestone check (25, 50, 100, 150...)
            const currentMilestone = w.score >= 25 ? Math.floor(w.score / MILESTONE_EVERY) + 1 : 0;
            if (currentMilestone > this.lastMilestoneCrossed && w.score >= 25) {
              this.lastMilestoneCrossed = currentMilestone;
              this.juice.confetti(0, w.bird.y, 0, 25);
              this.juice.flashBorder("#ffd700", 200);
              this.hooks.onMilestone?.(w.score);
            }
          }

          w.tick++;
        });
        break;
      }

      case "hitstop": {
        this.juice.setBorderFx("none");
        if (!this.time.frozen) {
          this.setState("gameOver");
          this.hooks.onGameOver?.(
            this.world.score,
            this.world.runDurationSec,
            this.world.pipesPassed,
            this.world.bonusScore,
          );
        }
        break;
      }

      case "rewindReplay": {
        this.juice.setBorderFx("slowmo");
        this.replayTimer += realDt;
        const targetIdx = Math.floor(
          (this.replayTimer / 0.65) * this.replaySnapshots.length,
        );
        if (targetIdx < this.replaySnapshots.length) {
          this.replayIndex = targetIdx;
          const snap = this.replaySnapshots[this.replayIndex];
          if (snap) {
            this.characterView.syncFrom(snap, 1, realDt);
            this.pipesView.syncFrom(snap, 1, realDt);
            this.pickupsView.syncFrom(snap, this.totalTime);
          }
        } else {
          // Rewind replay complete -> Restore snapshot and resume playing seamlessly!
          const feathersBefore = this.world.feathersRun;
          const rewindsBefore = this.world.rewindsUsedRun;
          const success = this.buf.rewindInto(this.world);
          if (!success) {
            this.setState("gameOver");
            this.hooks.onGameOver?.(
              this.world.score,
              this.world.runDurationSec,
              this.world.pipesPassed,
              this.world.bonusScore,
            );
            return;
          }

          this.world.bird.alive = true;
          this.world.bird.invulnUntilTick = this.world.tick + INVULN_TICKS;
          this.world.feathersRun = Math.max(0, feathersBefore - 1);
          this.world.rewindsUsedRun = rewindsBefore + 1;

          // Reset combo spree back to 0 (starts from +1 base on next pass)
          this.world.combo = 0;

          // Clear all active power-ups upon rewind
          this.world.rainbowTrailTimer = 0;
          this.world.hasShield = false;
          this.world.magnetTimer = 0;

          // Bullet-Time Readjustment: Slow pace to 45% speed for 1.8s easing smoothly back to 100%
          this.time = new TimeSystem();
          this.time.scale = 0.45;
          this.time.triggerSlowmo(1.8, 0.45);

          this.fever.reset();
          this.accumulator.reset();
          this.juice.popupAtWorld("⚡ BULLET TIME", 0, this.world.bird.y, 0, this.ctx.camera, "#00e5ff", 0.85);
          this.setState("playing");
          this.hooks.onRewindComplete?.();
          this.hooks.onFeverChange?.(false, 0);
          this.hooks.onPowerUpsChange?.(0, false, 0);
          this.hooks.onScoreChange?.(
            this.world.score,
            0,
            this.world.feathersRun,
            this.world.runDurationSec,
            this.world.pipesPassed,
            this.world.bonusScore,
          );
        }
        break;
      }

      case "rewindChoice": {
        this.juice.setBorderFx("slowmo");
        break;
      }

      case "gameOver": {
        this.juice.setBorderFx("none");
        if (this.world.bird.y > -5.5) {
          stepBird(this.world, realDt);
        }
        break;
      }
    }

    if (this.state === "rewindReplay") {
      const snap = this.replaySnapshots[this.replayIndex];
      if (snap) {
        this.characterView.syncFrom(snap, 1, realDt);
        this.pipesView.syncFrom(snap, 1, realDt);
        this.pickupsView.syncFrom(snap, this.totalTime);
      }
    } else {
      // Synchronize exact collision frame during rewindChoice pause
      this.characterView.syncFrom(this.world, alpha, this.state === "rewindChoice" ? 0 : realDt);
      this.pipesView.syncFrom(this.world, alpha, this.state === "rewindChoice" ? 0 : realDt);
      this.pickupsView.syncFrom(this.world, this.totalTime);
    }

    this.trailView.update(this.world, realDt, this.totalTime);
    this.rig.update(realDt, this.world.bird.y);
    this.ctx.biomeVfx.update(realDt, this.world.scrollSpeed);

    // Apply shake offset to camera
    this.ctx.camera.position.x += shake.ox;
    this.ctx.camera.position.y += shake.oy;

    const pal = dayNight(this.world.score);
    this.sky.update(pal, this.ctx.dirLight, this.ctx.fog);

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }
}
