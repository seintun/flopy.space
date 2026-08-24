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
import { BirdView } from "../entities/birdView";
import { PipesView } from "../entities/pipesView";
import { PickupsView } from "../entities/pickupsView";
import { Juice } from "../systems/juice";

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
  onPass?: (event: PassEvent) => void;
  onOrbCollect?: () => void;
  onHit?: (type: HitType) => void;
  onFlap?: () => void;
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
  private accumulator = makeAccumulator();

  sky: SkyDome;
  birdView: BirdView;
  pipesView: PipesView;
  pickupsView: PickupsView;
  juice: Juice;

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

    this.birdView = new BirdView();
    ctx.scene.add(this.birdView.group);

    this.pipesView = new PipesView(ctx.scene);
    this.pickupsView = new PickupsView(ctx.scene);
    this.juice = new Juice(ctx.scene, container);
  }

  setState(next: GameState): void {
    if (this.state === next) return;
    this.state = next;
    this.hooks.onStateChange?.(next);
  }

  start(seed = Date.now()): void {
    this.world = createWorld(seed);
    this.time = new TimeSystem();
    this.buf = new SnapshotBuffer();
    this.accumulator.reset();
    this.lastMilestoneCrossed = 0;
    this.setState("playing");
    this.doFlap();
    this.hooks.onScoreChange?.(0, 0, 0);
    this.hooks.onSlowmoMeter?.(0);
  }

  doFlap(): void {
    if (this.state === "menu") {
      this.start();
      return;
    }
    if (this.state === "playing" && this.world.bird.alive) {
      flap(this.world);
      this.birdView.onFlap();
      this.hooks.onFlap?.();
    }
  }

  chooseRewind(): boolean {
    if (this.state !== "rewindChoice") return false;
    if (this.world.feathersRun <= 0 || !this.buf.canRewind()) {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score);
      return false;
    }

    const success = this.buf.rewindInto(this.world);
    if (!success) {
      this.setState("gameOver");
      this.hooks.onGameOver?.(this.world.score);
      return false;
    }

    this.world.bird.alive = true;
    this.world.bird.invulnUntilTick = this.world.tick + INVULN_TICKS;
    this.world.feathersRun--;
    this.world.rewindsUsedRun++;
    this.time = new TimeSystem();
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

    const shake = this.juice.update(realDt);

    let alpha = 1;

    switch (this.state) {
      case "menu": {
        // Idle gentle bird hover
        this.world.bird.y = 1.5 + Math.sin(this.totalTime * 2.5) * 0.25;
        this.world.bird.pitch = Math.cos(this.totalTime * 2.5) * 8;
        break;
      }

      case "playing": {
        // Update slowmo meter
        const slowmoRemaining = this.time.slowmoRemaining();
        this.hooks.onSlowmoMeter?.(slowmoRemaining / SLOWMO_HOLD_S);

        alpha = this.accumulator.step(realDt * this.time.scale, this.time.frozen, (dt) => {
          const w = this.world;
          w.scrollSpeed = scrollForScore(w.score);
          advance(w, dt);
          stepBird(w, dt);
          this.buf.record(w);

          // Orb pickup check (distance < 0.9)
          for (const orb of w.orbs) {
            if (!orb.taken) {
              const dx = orb.x - 0; // BIRD_X is 0
              const dy = orb.y - w.bird.y;
              if (dx * dx + dy * dy < 0.81) {
                orb.taken = true;
                this.time.triggerSlowmo();
                this.juice.popup("SLOW-MO", "#00e5ff");
                this.hooks.onOrbCollect?.();
              }
            }
          }

          // Collisions
          const hit = checkCollisions(w);
          if (hit) {
            w.bird.alive = false;
            this.time.hitstop(60);
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
            if (p.nearMiss) {
              this.juice.popup("CLOSE!", "#ff2a6d");
              this.time.triggerMicroFlash();
            } else {
              this.juice.popup(`+${p.points}`, p.points > 1 ? "#ffd700" : "#ffffff");
            }
            this.hooks.onPass?.(p);
          }

          if (passes.length > 0) {
            this.hooks.onScoreChange?.(w.score, w.combo, w.feathersRun);

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
            this.birdView.syncFrom(snap, 1, realDt);
            this.pipesView.syncFrom(snap, 1, realDt);
            this.pickupsView.syncFrom(snap, this.totalTime);
          }
        } else {
          this.setState("rewindChoice");
          this.hooks.onRewindChoice?.(this.world.feathersRun);
        }
        break;
      }

      case "rewindChoice":
      case "gameOver": {
        if (this.world.bird.y > -5.5) {
          stepBird(this.world, realDt);
        }
        break;
      }
    }

    if (this.state !== "rewindReplay") {
      this.birdView.syncFrom(this.world, alpha, realDt);
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
