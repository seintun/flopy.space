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
import { PipesView } from "../entities/pipesView";
import { PickupsView } from "../entities/pickupsView";
import { Juice } from "../systems/juice";
import { FeverSystem } from "./fever";
import { getBiomeForScore, BIOMES, type BiomeDef, type BiomeId } from "./biomes";
import { CHARACTERS, type CharacterId, type SoundType } from "./characters";
import type { MissionEventType } from "./missions";
import { loadAll } from "./storage";

export type GameState =
  | "menu"
  | "playing"
  | "hitstop"
  | "rewindReplay"
  | "rewindChoice"
  | "gameOver";

export interface GameHooks {
  onStateChange?: (state: GameState) => void;
  onScoreChange?: (score: number, combo: number, feathers: number) => void;
  onSlowmoMeter?: (frac: number) => void;
  onFeverChange?: (active: boolean, frac: number) => void;
  onBiomeChange?: (biome: BiomeDef) => void;
  onMissionProgress?: (event: MissionEventType, value?: number) => void;
  onPass?: (event: PassEvent) => void;
  onOrbCollect?: () => void;
  onHit?: (type: HitType) => void;
  onFlap?: (soundType: SoundType) => void;
  onRewindStart?: () => void;
  onRewindChoice?: (feathers: number) => void;
  onRewindComplete?: () => void;
  onMilestone?: (score: number) => void;
  onGameOver?: (score: number) => void;
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
  pipesView: PipesView;
  pickupsView: PickupsView;
  juice: Juice;

  currentBiome: BiomeDef = BIOMES.meadow;
  biomeOverride: BiomeId | "auto" = "auto";
  selectedCharacterId: CharacterId = "neko";

  private totalTime = 0;
  private lastTime = 0;
  private lastMilestoneCrossed = 0;
  private replaySnapshots: World[] = [];
  private replayIndex = 0;
  private replayTimer = 0;

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

    this.setState("playing");
    this.doFlap();
    this.hooks.onScoreChange?.(0, 0, this.world.feathersRun);
    this.hooks.onSlowmoMeter?.(0);
    this.hooks.onFeverChange?.(false, 0);
  }

  doFlap(): void {
    if (this.state === "menu") {
      this.start();
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
      const sound = CHARACTERS[this.selectedCharacterId]?.soundType || "cat";
      this.hooks.onFlap?.(sound);
    }
  }

  chooseRewind(): boolean {
    if (this.state !== "rewindChoice") return false;
    if (this.world.feathersRun <= 0 || !this.buf.canRewind()) {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score);
      return false;
    }

    const feathersBefore = this.world.feathersRun;
    const rewindsBefore = this.world.rewindsUsedRun;
    const success = this.buf.rewindInto(this.world);
    if (!success) {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score);
      return false;
    }

    this.world.bird.alive = true;
    this.world.bird.invulnUntilTick = this.world.tick + INVULN_TICKS;
    this.world.feathersRun = Math.max(0, feathersBefore - 1);
    this.world.rewindsUsedRun = rewindsBefore + 1;
    this.time = new TimeSystem();
    this.fever.reset();
    this.accumulator.reset();
    this.juice.popup("REWOUND!", "#00e5ff");
    this.setState("playing");
    this.hooks.onRewindComplete?.();
    this.hooks.onScoreChange?.(this.world.score, this.world.combo, this.world.feathersRun);
    return true;
  }

  acceptDeath(): void {
    if (this.state === "rewindChoice" || this.state === "hitstop") {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score);
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
        // Idle gentle hover
        this.world.bird.y = 1.5 + Math.sin(this.totalTime * 2.5) * 0.25;
        this.world.bird.pitch = Math.cos(this.totalTime * 2.5) * 8;
        break;
      }

      case "playing": {
        // Update slowmo meter
        const slowmoRemaining = this.time.slowmoRemaining();
        this.hooks.onSlowmoMeter?.(slowmoRemaining / SLOWMO_HOLD_S);

        // Fever mode visual trail
        if (this.fever.isActive) {
          const colors = [0xff007f, 0x00f5d4, 0xffd166, 0x7209b7, 0xffffff];
          const col = colors[Math.floor(Math.random() * colors.length)]!;
          this.juice.burst(-0.4, this.world.bird.y, 0, 2, col);
        }

        alpha = this.accumulator.step(realDt * this.time.scale, this.time.frozen, (dt) => {
          const w = this.world;
          w.scrollSpeed = scrollForScore(w.score);
          advance(w, dt);
          stepBird(w, dt);
          this.buf.record(w);

          // Check dynamic biome transition
          const targetBiome = getBiomeForScore(w.score, this.biomeOverride);
          if (targetBiome.id !== this.currentBiome.id) {
            this.applyBiome(targetBiome);
            this.juice.confetti(0, w.bird.y, 0, 30);
            this.juice.popup(`${targetBiome.emoji} ${targetBiome.name.toUpperCase()}`, "#00f5d4");
          }

          // Orb pickup & Magnet check
          for (const orb of w.orbs) {
            if (!orb.taken) {
              const dx = orb.x - 0;
              const dy = orb.y - w.bird.y;
              const distSq = dx * dx + dy * dy;

              // Fever magnet attraction
              if (this.fever.isActive && distSq < this.fever.magnetRadius * this.fever.magnetRadius) {
                orb.x += (0 - orb.x) * 6 * dt;
                orb.y += (w.bird.y - orb.y) * 6 * dt;
              }

              if (distSq < 0.81) {
                orb.taken = true;
                this.time.triggerSlowmo();
                const feverTriggered = this.fever.addEnergy(0.4);
                this.juice.popup("SLOW-MO", "#00e5ff");
                this.hooks.onOrbCollect?.();
                this.hooks.onMissionProgress?.("slowmo");

                if (feverTriggered) {
                  this.juice.popup("🔥 FEVER RUSH!", "#ff007f");
                  this.rig.kick(4);
                  this.hooks.onFeverChange?.(true, 1);
                  this.hooks.onMissionProgress?.("fever");
                } else if (!this.fever.isActive) {
                  this.hooks.onFeverChange?.(false, this.fever.meter);
                }
              }
            }
          }

          // Collisions
          const hit = checkCollisions(w);
          if (hit) {
            w.bird.alive = false;
            this.time.hitstop(60);
            this.fever.reset();
            this.hooks.onFeverChange?.(false, 0);
            this.juice.addTrauma(0.85);
            this.juice.burst(0, w.bird.y, 0, 24, 0xff5252);
            this.setState("hitstop");
            this.hooks.onHit?.(hit);
            return;
          }

          // Passes & Scoring
          const passes = processPasses(w);
          for (const p of passes) {
            this.pipesView.flash(p.pipeId);

            // Bonus points during Fever mode
            const bonusMult = this.fever.scoreMultiplier;
            if (bonusMult > 1) {
              p.points *= bonusMult;
              w.score += p.points - (p.points / bonusMult);
            }

            if (p.nearMiss) {
              this.juice.popup("CLOSE!", "#ff2a6d");
              this.time.triggerMicroFlash();
              this.hooks.onMissionProgress?.("nearMiss");
            } else {
              this.juice.popup(`+${p.points}`, p.points > 1 ? "#ffd700" : "#ffffff");
            }

            // Add Fever energy on pass
            const feverTriggered = this.fever.addEnergy(p.nearMiss ? 0.25 : 0.12);
            if (feverTriggered) {
              this.juice.popup("🔥 FEVER RUSH!", "#ff007f");
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
            this.hooks.onScoreChange?.(w.score, w.combo, w.feathersRun);
            this.hooks.onMissionProgress?.("scoreMilestone", w.score);

            // Milestone check
            const currentMilestone = Math.floor(w.score / MILESTONE_EVERY);
            if (currentMilestone > this.lastMilestoneCrossed) {
              this.lastMilestoneCrossed = currentMilestone;
              this.rig.kick(3);
              this.juice.confetti(0, w.bird.y, 0, 40);
              this.juice.popup("MILESTONE!", "#ffd700");
              this.hooks.onMilestone?.(w.score);
            }
          }

          w.tick++;
        });
        break;
      }

      case "hitstop": {
        if (!this.time.frozen) {
          const canRewind =
            this.world.feathersRun > 0 &&
            this.world.rewindsUsedRun < REWINDS_MAX_PER_RUN &&
            this.buf.canRewind();

          if (canRewind) {
            this.replaySnapshots = this.buf.getSnapshotsReverse();
            this.replayIndex = 0;
            this.replayTimer = 0;
            this.setState("rewindReplay");
            this.hooks.onRewindStart?.();
          } else {
            this.setState("gameOver");
            this.hooks.onGameOver?.(this.world.score);
          }
        }
        break;
      }

      case "rewindReplay": {
        this.replayTimer += realDt;
        const targetIdx = Math.floor(
          (this.replayTimer / 0.8) * this.replaySnapshots.length,
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
          this.setState("rewindChoice");
          this.hooks.onRewindChoice?.(this.world.feathersRun);
        }
        break;
      }

      case "rewindChoice": {
        break;
      }

      case "gameOver": {
        if (this.world.bird.y > -5.5) {
          stepBird(this.world, realDt);
        }
        break;
      }
    }

    if (this.state === "rewindReplay" || this.state === "rewindChoice") {
      const snap =
        this.state === "rewindChoice"
          ? this.replaySnapshots[this.replaySnapshots.length - 1]
          : this.replaySnapshots[this.replayIndex];
      if (snap) {
        this.characterView.syncFrom(snap, 1, realDt);
        this.pipesView.syncFrom(snap, 1, realDt);
        this.pickupsView.syncFrom(snap, this.totalTime);
      }
    } else {
      this.characterView.syncFrom(this.world, alpha, realDt);
      this.pipesView.syncFrom(this.world, alpha, realDt);
      this.pickupsView.syncFrom(this.world, this.totalTime);
    }

    this.rig.update(realDt, this.world.bird.y);

    // Apply shake offset to camera
    this.ctx.camera.position.x += shake.ox;
    this.ctx.camera.position.y += shake.oy;

    const pal = dayNight(this.world.score);
    this.sky.update(pal, this.ctx.dirLight, this.ctx.fog);

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }
}
