import "./style.css";
import { createCameraRig } from "./render/camera";
import { createScene } from "./render/scene";

const app = document.getElementById("app")!;
const rig = createCameraRig(() => window.innerWidth / window.innerHeight);
const ctx = createScene(app, rig.camera);

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.setSize(w, h);
  rig.onResize(w / h);
});

let last = performance.now();
function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  rig.update(dt, 1.5);
  ctx.renderer.render(ctx.scene, ctx.camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
