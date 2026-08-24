import "./style.css";
import { createCameraRig } from "./render/camera";
import { createScene } from "./render/scene";
import { Game } from "./core/game";
import { initInput } from "./core/input";
import { AudioSys } from "./core/audio";
import { initHud } from "./ui/hud";
import { MenuView } from "./ui/menu";
import { GameOverView } from "./ui/gameover";
import { loadAll, saveBest, bankFeathers, touchStreak, SKINS } from "./core/storage";
import { multiplier } from "./core/scoring";

const app = document.getElementById("app")!;
const audio = new AudioSys();
const rig = createCameraRig(() => window.innerWidth / window.innerHeight);
const ctx = createScene(app, rig.camera);
const game = new Game(ctx, rig, app);

const hud = initHud(app);
const gameoverView = new GameOverView(app);

// Load initial save data
const saved = loadAll();
audio.setMuted(saved.muted);
const activeSkin = SKINS[saved.skin] || SKINS.classic!;
game.birdView.setSkin(activeSkin.bodyColor, activeSkin.bellyColor);

const menuView = new MenuView(app, {
  onStart: () => {
    audio.unlock();
    game.start();
  },
  onSkinChange: (skinId) => {
    const s = SKINS[skinId];
    if (s) game.birdView.setSkin(s.bodyColor, s.bellyColor);
  },
  onMuteToggle: (muted) => {
    audio.setMuted(muted);
  },
});

game.hooks = {
  onStateChange: (state) => {
    if (state === "menu") {
      menuView.show();
      hud.showMenu();
      gameoverView.hide();
      hud.hideRewindPrompt();
    } else if (state === "playing") {
      menuView.hide();
      hud.hideMenu();
      gameoverView.hide();
      hud.hideRewindPrompt();
    } else if (state === "rewindChoice") {
      hud.showRewindPrompt(
        game.world.feathersRun,
        () => game.chooseRewind(),
        () => game.acceptDeath(),
      );
    } else if (state === "gameOver") {
      hud.hideRewindPrompt();
      const currentFeathers = bankFeathers(game.world.feathersRun, game.world.rewindsUsedRun);
      const { best, isNewBest } = saveBest(game.world.score);
      touchStreak();
      gameoverView.show(
        game.world.score,
        best,
        isNewBest,
        currentFeathers,
        {
          onRetry: () => {
            game.start();
          },
        },
      );
    }
  },

  onScoreChange: (score, combo, feathers) => {
    hud.setScore(score);
    hud.setCombo(combo, multiplier(combo));
    hud.setFeathers(feathers);
  },

  onSlowmoMeter: (frac) => {
    hud.setSlowmoMeter(frac);
  },

  onFlap: () => {
    audio.flap();
  },

  onPass: (event) => {
    if (event.nearMiss) {
      audio.nearMiss();
    } else {
      audio.score(game.world.combo);
    }
  },

  onOrbCollect: () => {
    audio.collect();
  },

  onHit: () => {
    audio.die();
  },

  onRewindStart: () => {
    audio.rewind();
  },

  onRewindComplete: () => {
    hud.hideRewindPrompt();
  },

  onMilestone: () => {
    audio.milestone();
  },

  onGameOver: () => {
    // handled in onStateChange
  },
};

initInput(
  () => game.doFlap(),
  () => {
    audio.unlock();
  },
);

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.setSize(w, h);
  rig.onResize(w / h);
});

function animate(time: number) {
  game.frame(time);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Prevent right-click / context menu on mobile
window.addEventListener("contextmenu", (e) => e.preventDefault());
