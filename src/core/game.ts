import { INVULN_TICKS, REWINDS_MAX_PER_RUN } from "./constants";
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
  onPass?: (event: PassEvent) => void;
  onOrbCollect?: () => void;
  onHit?: (type: HitType) => void;
  onFlap?: () => void;
  onRewindStart?: () => void;
  onRewindComplete?: () => void;
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

  private totalTime = 0;
  private lastTime = 0;
  private replaySnapshots: World[] = [];
  private replayIndex = 0;
  private replayTimer = 0;

  hooks: GameHooks = {};

  constructor(
    public ctx: SceneCtx,
    public rig: CameraRig,
  ) {
    this.world = createWorld(Date.now());

    this.sky = new SkyDome();
    ctx.scene.add(this.sky.group);

    this.birdView = new BirdView();
    ctx.scene.add(this.birdView.group);

    this.pipesView = new PipesView(ctx.scene);
    this.pickupsView = new PickupsView(ctx.scene);
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
    this.setState("playing");
    this.doFlap();
    this.hooks.onScoreChange?.(0, 0, 0);
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

    let alpha = 1;

    switch (this.state) {
      case "menu": {
        // Idle gentle bird hover
        this.world.bird.y = 1.5 + Math.sin(this.totalTime * 2.5) * 0.25;
        this.world.bird.pitch = Math.cos(this.totalTime * 2.5) * 8;
        break;
      }

      case "playing": {
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
                this.hooks.onOrbCollect?.();
              }
            }
          }

          // Collisions
          const hit = checkCollisions(w);
          if (hit) {
            w.bird.alive = false;
            this.time.hitstop(60);
            this.setState("hitstop");
            this.hooks.onHit?.(hit);
            return;
          }

          // Passes & Scoring
          const passes = processPasses(w);
          for (const p of passes) {
            this.pipesView.flash(p.pipeId);
            this.hooks.onPass?.(p);
          }
          if (passes.length > 0) {
            this.hooks.onScoreChange?.(w.score, w.combo, w.feathersRun);
          }

          w.tick++;
        });
        break;
      }

      case "hitstop": {
        if (!this.time.frozen) {
          // Check if rewind is eligible
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
        // Play back snapshots in reverse over ~0.8s
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
        }
        break;
      }

      case "rewindChoice":
      case "gameOver": {
        // Bird continues falling to ground if not there
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
    const pal = dayNight(this.world.score);
    this.sky.update(pal, this.ctx.dirLight, this.ctx.fog);

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }
}
