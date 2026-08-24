import "./style.css";
import { createCameraRig } from "./render/camera";
import { createScene } from "./render/scene";
import { Game } from "./core/game";
import { initInput } from "./core/input";

const app = document.getElementById("app")!;
const rig = createCameraRig(() => window.innerWidth / window.innerHeight);
const ctx = createScene(app, rig.camera);
const game = new Game(ctx, rig);

initInput(
  () => game.doFlap(),
  () => {
    // First gesture hook
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
