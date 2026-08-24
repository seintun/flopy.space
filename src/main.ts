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
  recordPlaySession,
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
  onToast: (msg) => {
    hud.showPowerUpToast("🔒", "GOAL LOCKED", msg, "#ff9e00");
  },
});

game.hooks = {
  onStateChange: (state) => {
    if (state === "menu") {
      menuView.show();
      hud.showMenu();
      gameoverView.hide();
      hud.hideRewindPrompt();
      hud.hideCountdown();
    } else if (state === "countdown") {
      menuView.hide();
      hud.hideMenu();
      gameoverView.hide();
      hud.hideRewindPrompt();
    } else if (state === "playing") {
      menuView.hide();
      hud.hideMenu();
      gameoverView.hide();
      hud.hideRewindPrompt();
      hud.hideCountdown();
    } else if (state === "rewindChoice") {
      const savedData = loadAll();
      hud.showRewindPrompt(
        game.world.score,
        savedData.best,
        game.world.combo,
        multiplier(game.world.combo),
        game.world.feathersRun,
        game.world.runDurationSec,
        () => game.chooseRewind(),
        () => game.acceptDeath(),
      );
    } else if (state === "gameOver") {
      hud.hideRewindPrompt();
      hud.hideCountdown();
      const currentFeathers = bankFeathers(game.world.feathersRun);
      const scoreBefore = loadAll().best;
      const { best, isNewBest } = saveBest(game.world.score);
      const timeSec = game.world.runDurationSec;
      recordPlaySession(timeSec, game.world.score);
      touchStreak();

      const hasNewUnlock = isNewBest && (
        (scoreBefore < 15 && best >= 15) ||
        (scoreBefore < 25 && best >= 25) ||
        (scoreBefore < 35 && best >= 35) ||
        (scoreBefore < 50 && best >= 50) ||
        (scoreBefore < 60 && best >= 60) ||
        (scoreBefore < 75 && best >= 75) ||
        (scoreBefore < 100 && best >= 100)
      );

      gameoverView.show(
        game.world.score,
        best,
        isNewBest,
        currentFeathers,
        timeSec,
        hasNewUnlock,
        {
          onRetry: () => {
            game.start(Date.now(), loadAll().feathers);
          },
        },
      );
    }
  },

  onCountdown: (step) => {
    hud.showCountdown(step.toString());
    if (typeof step === "number") {
      audio.countdownTick(step);
    } else {
      audio.countdownGo();
    }
  },

  onScoreChange: (score, combo, feathers, timeSec) => {
    hud.setScore(score);
    hud.setCombo(combo, multiplier(combo));
    hud.setFeathers(feathers);
    if (timeSec !== undefined) {
      hud.setTimeSurvived(timeSec);
    }
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
        hud.showPowerUpToast("⏱️", "CHRONO SLOW-MO", "Time dilated to 0.35× speed", "#00e5ff");
        break;
      case "rainbow_trail":
        audio.rainbowTrail();
        hud.showPowerUpToast("🌈", "RAINBOW TRAIL", "Trajectory guide + 3× multiplier", "#ff007f");
        break;
      case "shield":
        audio.shieldActive();
        hud.showPowerUpToast("🛡️", "STAR SHIELD", "Blocks 1 fatal crash safely", "#ffd700");
        break;
      case "magnet":
        audio.magnetActive();
        hud.showPowerUpToast("🧲", "SUPER MAGNET", "Vacuum pulls all items & orbs", "#00f5d4");
        break;
      case "star_gem":
        audio.starGem();
        hud.showPowerUpToast("⭐", "STAR GEM", "+500 Bonus score + combo up", "#ffbe0b");
        break;
      default:
        audio.collect();
    }
  },

  onShieldBreak: () => {
    audio.shieldBreak();
    hud.showPowerUpToast("💥", "SHIELD BROKE", "Saved you from fatal crash!", "#ffd700");
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

function handleResize() {
  const w = window.visualViewport?.width || window.innerWidth;
  const h = window.visualViewport?.height || window.innerHeight;
  ctx.setSize(w, h);
  rig.onResize(w / h);
}

window.addEventListener("resize", handleResize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
}
window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 100);
});

// Initial sizing trigger
handleResize();

function animate(time: number) {
  game.frame(time);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Prevent right-click / context menu on mobile
window.addEventListener("contextmenu", (e) => e.preventDefault());
