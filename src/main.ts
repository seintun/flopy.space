import "./style.css";
import { createCameraRig } from "./render/camera";
import { createScene } from "./render/scene";
import { Game } from "./core/game";
import { initInput } from "./core/input";
import { AudioSys } from "./core/audio";
import { initHud } from "./ui/hud";
import { MenuView } from "./ui/menu";
import { GameOverView } from "./ui/gameover";
import {
  loadAll,
  saveBest,
  bankFeathers,
  touchStreak,
  SKINS,
  getStoredMissions,
  saveStoredMissions,
} from "./core/storage";
import { multiplier } from "./core/scoring";
import { recordMissionEvent } from "./core/missions";

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

// Initialize selected character & biome
game.setCharacter(saved.character, saved.skin);
game.setBiomeOverride(saved.biome);

const menuView = new MenuView(app, {
  onStart: () => {
    audio.unlock();
    game.start(Date.now(), loadAll().feathers);
  },
  onCharacterChange: (charId) => {
    game.setCharacter(charId, loadAll().skin);
  },
  onSkinChange: (skinId) => {
    const s = SKINS[skinId];
    if (s) {
      game.characterView.setSkin(s.bodyColor, s.bellyColor);
    }
  },
  onBiomeChange: (biomeId) => {
    game.setBiomeOverride(biomeId);
  },
  onMuteToggle: (muted) => {
    audio.setMuted(muted);
  },
  onMissionClaim: () => {
    audio.missionComplete();
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
      const currentFeathers = bankFeathers(game.world.feathersRun);
      const { best, isNewBest } = saveBest(game.world.score);
      touchStreak();
      gameoverView.show(
        game.world.score,
        best,
        isNewBest,
        currentFeathers,
        {
          onRetry: () => {
            game.start(Date.now(), loadAll().feathers);
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

  onFeverChange: (active, frac) => {
    hud.setFeverMeter(active, frac);
  },

  onPowerUpsChange: (rainbowLeft, hasShield, magnetLeft) => {
    hud.setPowerUps(rainbowLeft, hasShield, magnetLeft);
  },

  onBiomeChange: (biome) => {
    hud.setBiomeBadge(biome.name, biome.emoji);
    audio.biomeWarp();
  },

  onMissionProgress: (event, value = 1) => {
    const missions = getStoredMissions();
    const { newlyCompleted } = recordMissionEvent(missions, event, value);
    if (newlyCompleted.length > 0) {
      saveStoredMissions(missions);
      game.juice.popup("QUEST DONE! 🎯", "#00ffc3");
      audio.missionComplete();
    } else {
      saveStoredMissions(missions);
    }
  },

  onFlap: (soundType) => {
    audio.flap(soundType);
  },

  onPass: (event) => {
    if (event.nearMiss) {
      audio.nearMiss();
    } else {
      audio.score(game.world.combo);
    }
  },

  onOrbCollect: (type) => {
    switch (type) {
      case "slowmo":
        audio.collect();
        break;
      case "rainbow_trail":
        audio.rainbowTrail();
        break;
      case "shield":
        audio.shieldActive();
        break;
      case "magnet":
        audio.magnetActive();
        break;
      case "star_gem":
        audio.starGem();
        break;
      default:
        audio.collect();
    }
  },

  onShieldBreak: () => {
    audio.shieldBreak();
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
