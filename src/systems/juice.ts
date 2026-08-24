import * as THREE from "three";

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export type BorderFxType = "fever" | "rainbow" | "shield" | "magnet" | "slowmo" | "none";

const _worldPopupVec = new THREE.Vector3();

export class Juice {
  trauma = 0;
  private time = 0;
  private shakeOffset = { ox: 0, oy: 0 };
  private particleGroup: THREE.Group;
  private pool: Particle[] = [];
  private particleGeo: THREE.PlaneGeometry;
  private popupContainer: HTMLElement;
  private borderFxEl: HTMLElement;
  private currentBorderFx: BorderFxType = "none";

  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.particleGroup = new THREE.Group();
    scene.add(this.particleGroup);

    this.particleGeo = new THREE.PlaneGeometry(0.18, 0.18);

    // Particle pool (up to 120 particles)
    for (let i = 0; i < 120; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);

      this.pool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        life: 0,
        maxLife: 0.6,
        active: false,
      });
    }

    // Border FX Overlay
    this.borderFxEl = document.createElement("div");
    this.borderFxEl.id = "screen-border-fx";
    this.borderFxEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 15;
      box-sizing: border-box;
      transition: box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    `;
    container.appendChild(this.borderFxEl);

    // Popup container
    this.popupContainer = document.createElement("div");
    this.popupContainer.id = "juice-popups";
    this.popupContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 25;
    `;
    container.appendChild(this.popupContainer);
  }

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  setBorderFx(type: BorderFxType): void {
    if (this.currentBorderFx === type) return;
    this.currentBorderFx = type;

    switch (type) {
      case "fever":
        this.borderFxEl.style.boxShadow = "inset 0 0 45px rgba(255, 0, 127, 0.75), inset 0 0 90px rgba(255, 110, 0, 0.4)";
        this.borderFxEl.style.border = "3px solid rgba(255, 0, 127, 0.85)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "rainbow":
        this.borderFxEl.style.boxShadow = "inset 0 0 45px rgba(0, 229, 255, 0.6), inset 0 0 90px rgba(255, 0, 127, 0.4)";
        this.borderFxEl.style.border = "3px solid rgba(0, 229, 255, 0.85)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "shield":
        this.borderFxEl.style.boxShadow = "inset 0 0 40px rgba(255, 215, 0, 0.55), inset 0 0 80px rgba(255, 170, 0, 0.25)";
        this.borderFxEl.style.border = "3px solid rgba(255, 215, 0, 0.8)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "magnet":
        this.borderFxEl.style.boxShadow = "inset 0 0 35px rgba(0, 245, 212, 0.55), inset 0 0 70px rgba(0, 187, 249, 0.3)";
        this.borderFxEl.style.border = "2.5px solid rgba(0, 245, 212, 0.8)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "slowmo":
        this.borderFxEl.style.boxShadow = "inset 0 0 50px rgba(0, 229, 255, 0.65), inset 0 0 100px rgba(0, 136, 204, 0.4)";
        this.borderFxEl.style.border = "3px solid rgba(0, 229, 255, 0.9)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "none":
      default:
        this.borderFxEl.style.opacity = "0";
        break;
    }
  }

  flashBorder(colorHex: string, durationMs = 150): void {
    this.borderFxEl.style.boxShadow = `inset 0 0 40px ${colorHex}aa`;
    this.borderFxEl.style.border = `2px solid ${colorHex}`;
    this.borderFxEl.style.opacity = "1";
    setTimeout(() => {
      if (this.currentBorderFx === "none") {
        this.borderFxEl.style.opacity = "0";
      } else {
        this.setBorderFx(this.currentBorderFx);
      }
    }, durationMs);
  }

  burst(x: number, y: number, z = 0, count = 20, colorHex = 0xf4c430): void {
    let spawned = 0;
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;

        const speed = 3 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + 2;
        p.vz = (Math.random() - 0.5) * speed;

        p.rotX = (Math.random() - 0.5) * 10;
        p.rotY = (Math.random() - 0.5) * 10;
        p.rotZ = (Math.random() - 0.5) * 10;

        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.3;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  confetti(x: number, y: number, z = 0, count = 36): void {
    const colors = [0xff2a6d, 0x05d9e8, 0x01ffc3, 0xf4c430, 0xffffff, 0x9b5de5];
    let spawned = 0;
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        const col = colors[Math.floor(Math.random() * colors.length)]!;
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(col);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;

        const speed = 4 + Math.random() * 6;
        const angle = Math.random() * Math.PI * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + 3;
        p.vz = (Math.random() - 0.5) * speed;

        p.rotX = (Math.random() - 0.5) * 12;
        p.rotY = (Math.random() - 0.5) * 12;
        p.rotZ = (Math.random() - 0.5) * 12;

        p.life = 0;
        p.maxLife = 0.7 + Math.random() * 0.4;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  // Popup positioned at screen percentage
  popup(text: string, color = "#ffeb3b", screenXPercent = 50, screenYPercent = 16): void {
    const el = document.createElement("div");
    el.innerHTML = text;
    el.style.cssText = `
      position: absolute;
      left: ${screenXPercent}%;
      top: ${screenYPercent}%;
      transform: translate(-50%, 0) scale(0.8);
      color: ${color};
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 10px rgba(0,0,0,0.85), 0 0 16px ${color}88;
      transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.45s ease-out;
      opacity: 1;
      pointer-events: none;
      white-space: nowrap;
    `;
    this.popupContainer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(-50%, -20px) scale(1.1)`;
    });

    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 450);
    }, 380);
  }

  // Popup positioned directly above/below bird or object in 3D world space
  popupAtWorld(text: string, wx: number, wy: number, wz: number, camera: THREE.Camera, color = "#ffd700", offsetY = 0.85): void {
    _worldPopupVec.set(wx, wy + offsetY, wz);
    _worldPopupVec.project(camera);

    const sx = (_worldPopupVec.x * 0.5 + 0.5) * 100;
    const sy = (-_worldPopupVec.y * 0.5 + 0.5) * 100;

    if (_worldPopupVec.z < 1) {
      this.popup(text, color, Math.max(6, Math.min(94, sx)), Math.max(8, Math.min(88, sy)));
    }
  }

  update(dt: number): { ox: number; oy: number } {
    this.time += dt;

    // Decay trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.2 * dt);
    }

    const shakeMag = this.trauma * this.trauma * 0.45;
    this.shakeOffset.ox = Math.sin(this.time * 38) * shakeMag;
    this.shakeOffset.oy = Math.cos(this.time * 44) * shakeMag;

    // Update active particles
    for (const p of this.pool) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.vy -= 16 * dt; // gravity on particles
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;

          p.mesh.rotation.x += p.rotX * dt;
          p.mesh.rotation.y += p.rotY * dt;
          p.mesh.rotation.z += p.rotZ * dt;

          const progress = p.life / p.maxLife;
          const scale = (1 - progress) * 1.2;
          p.mesh.scale.set(scale, scale, scale);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress * progress;
        }
      }
    }

    return this.shakeOffset;
  }
}
