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

interface PooledPopupEl {
  el: HTMLElement;
  timer1: ReturnType<typeof setTimeout> | null;
  timer2: ReturnType<typeof setTimeout> | null;
}

export type BorderFxType = "fever" | "rainbow" | "shield" | "magnet" | "slowmo" | "none";

const _worldPopupVec = new THREE.Vector3();

export class Juice {
  trauma = 0;
  private time = 0;
  private shakeOffset = { ox: 0, oy: 0, rot: 0 };
  private particleGroup: THREE.Group;
  private pool: Particle[] = [];
  private particleGeo: THREE.PlaneGeometry;
  private popupContainer: HTMLElement;
  private popupPool: PooledPopupEl[] = [];
  private popupPoolIndex = 0;
  private borderFxEl: HTMLElement;
  private currentBorderFx: BorderFxType = "none";
  private borderFlashTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(scene?: THREE.Scene, container?: HTMLElement) {
    this.particleGroup = new THREE.Group();
    if (scene) scene.add(this.particleGroup);

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
    if (typeof document !== "undefined" && container) {
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

      // Pre-allocate 12 pooled popup DOM elements to completely eliminate runtime GC
      for (let i = 0; i < 12; i++) {
        const el = document.createElement("div");
        el.style.cssText = `
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, 0) scale(0.8);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.01em;
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          display: none;
          transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.45s ease-out;
        `;
        this.popupContainer.appendChild(el);
        this.popupPool.push({ el, timer1: null, timer2: null });
      }
    } else {
      this.borderFxEl = {} as HTMLElement;
      this.popupContainer = {} as HTMLElement;
    }
  }

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  setBorderFx(type: BorderFxType): void {
    if (this.currentBorderFx === type || !this.borderFxEl.style) return;
    this.currentBorderFx = type;

    switch (type) {
      case "fever":
        this.borderFxEl.style.boxShadow = "inset 0 0 45px rgba(255, 0, 127, 0.65), inset 0 0 15px #ffd166";
        this.borderFxEl.style.border = "3px solid #ff007f";
        this.borderFxEl.style.opacity = "1";
        break;
      case "rainbow":
        this.borderFxEl.style.boxShadow = "inset 0 0 35px rgba(255, 0, 127, 0.4), inset 0 0 20px rgba(0, 245, 212, 0.4)";
        this.borderFxEl.style.border = "2px solid rgba(255, 0, 127, 0.7)";
        this.borderFxEl.style.opacity = "1";
        break;
      case "shield":
        this.borderFxEl.style.boxShadow = "inset 0 0 30px rgba(255, 215, 0, 0.45)";
        this.borderFxEl.style.border = "2px solid #ffd700";
        this.borderFxEl.style.opacity = "1";
        break;
      case "magnet":
        this.borderFxEl.style.boxShadow = "inset 0 0 30px rgba(0, 245, 212, 0.45)";
        this.borderFxEl.style.border = "2px solid #00f5d4";
        this.borderFxEl.style.opacity = "1";
        break;
      case "slowmo":
        this.borderFxEl.style.boxShadow = "inset 0 0 40px rgba(0, 229, 255, 0.5)";
        this.borderFxEl.style.border = "2px solid #00e5ff";
        this.borderFxEl.style.opacity = "1";
        break;
      case "none":
        this.borderFxEl.style.boxShadow = "none";
        this.borderFxEl.style.border = "none";
        this.borderFxEl.style.opacity = "0";
        break;
    }
  }

  flashBorder(colorHex = "#ff007f", durationMs = 150): void {
    if (!this.borderFxEl.style) return;
    if (this.borderFlashTimeout) {
      clearTimeout(this.borderFlashTimeout);
      this.borderFlashTimeout = null;
    }

    const prevBox = this.borderFxEl.style.boxShadow;
    const prevBorder = this.borderFxEl.style.border;
    const prevOpacity = this.borderFxEl.style.opacity;

    this.borderFxEl.style.transition = "none";
    this.borderFxEl.style.boxShadow = `inset 0 0 50px ${colorHex}99`;
    this.borderFxEl.style.border = `3px solid ${colorHex}`;
    this.borderFxEl.style.opacity = "1";

    this.borderFlashTimeout = setTimeout(() => {
      if (this.borderFxEl.style) {
        this.borderFxEl.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease";
        this.borderFxEl.style.boxShadow = prevBox;
        this.borderFxEl.style.border = prevBorder;
        this.borderFxEl.style.opacity = prevOpacity;
      }
      this.borderFlashTimeout = null;
    }, durationMs);
  }

  burst(x: number, y: number, z: number, count = 16, colorHex = 0xffd700): void {
    let spawned = 0;
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
        p.mesh.position.set(x, y, z);
        p.mesh.scale.set(1, 1, 1);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 5.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + 1.5;
        p.vz = (Math.random() - 0.5) * 3;

        p.rotX = (Math.random() - 0.5) * 12;
        p.rotY = (Math.random() - 0.5) * 12;
        p.rotZ = (Math.random() - 0.5) * 12;

        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.3;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  confetti(x: number, y: number, z: number, count = 24): void {
    const colors = [0xff007f, 0x00f5d4, 0xffd166, 0xff5400, 0x7209b7, 0x4cc9f0];
    let spawned = 0;
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        const col = colors[Math.floor(Math.random() * colors.length)]!;
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(col);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
        p.mesh.position.set(x, y, z);
        p.mesh.scale.set(1.2, 1.2, 1.2);

        const angle = Math.random() * Math.PI * 2;
        const speed = 3.5 + Math.random() * 6.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + 3.0;
        p.vz = (Math.random() - 0.5) * 4;

        p.rotX = (Math.random() - 0.5) * 15;
        p.rotY = (Math.random() - 0.5) * 15;
        p.rotZ = (Math.random() - 0.5) * 15;

        p.life = 0;
        p.maxLife = 0.7 + Math.random() * 0.4;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  // Pre-allocated Zero-GC DOM popup recycling
  popup(text: string, color = "#ffeb3b", screenXPercent = 50, screenYPercent = 16): void {
    if (this.popupPool.length === 0) return;

    const item = this.popupPool[this.popupPoolIndex]!;
    this.popupPoolIndex = (this.popupPoolIndex + 1) % this.popupPool.length;

    if (item.timer1) clearTimeout(item.timer1);
    if (item.timer2) clearTimeout(item.timer2);

    const el = item.el;
    el.innerHTML = text;
    el.style.color = color;
    el.style.textShadow = `0 2px 10px rgba(0,0,0,0.85), 0 0 16px ${color}88`;
    el.style.left = `${screenXPercent}%`;
    el.style.top = `${screenYPercent}%`;
    el.style.transform = `translate(-50%, 0) scale(0.8)`;
    el.style.opacity = "1";
    el.style.display = "block";

    item.timer1 = setTimeout(() => {
      el.style.transform = `translate(-50%, -22px) scale(1.1)`;
    }, 16);

    item.timer2 = setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.style.display = "none";
      }, 450);
    }, 380);
  }

  popupAtWorld(
    text: string,
    wx: number,
    wy: number,
    wz: number,
    camera: THREE.Camera,
    color = "#ffd700",
    offsetY = 0.85,
  ): void {
    _worldPopupVec.set(wx, wy + offsetY, wz);
    _worldPopupVec.project(camera);

    const sx = (_worldPopupVec.x * 0.5 + 0.5) * 100;
    const sy = (-_worldPopupVec.y * 0.5 + 0.5) * 100;

    if (_worldPopupVec.z < 1) {
      this.popup(text, color, Math.max(6, Math.min(94, sx)), Math.max(8, Math.min(88, sy)));
    }
  }

  update(dt: number): { ox: number; oy: number; rot: number } {
    this.time += dt;

    // Decay trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.2 * dt);
    }

    const shakeMag = this.trauma * this.trauma * 0.45;
    this.shakeOffset.ox = Math.sin(this.time * 38) * shakeMag;
    this.shakeOffset.oy = Math.cos(this.time * 44) * shakeMag;
    this.shakeOffset.rot =
      (Math.sin(this.time * 32) * 0.5 + Math.cos(this.time * 24) * 0.5) * (this.trauma * this.trauma * 0.06);

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
