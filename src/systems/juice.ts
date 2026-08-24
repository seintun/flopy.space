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

export class Juice {
  trauma = 0;
  private time = 0;
  private shakeOffset = { ox: 0, oy: 0 };
  private particleGroup: THREE.Group;
  private pool: Particle[] = [];
  private particleGeo: THREE.PlaneGeometry;
  private popupContainer: HTMLElement;

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
      z-index: 20;
    `;
    container.appendChild(this.popupContainer);
  }

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
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

  popup(text: string, color = "#ffeb3b", screenXPercent = 50, screenYPercent = 40): void {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText = `
      position: absolute;
      left: ${screenXPercent}%;
      top: ${screenYPercent}%;
      transform: translate(-50%, -50%) scale(0.6);
      color: ${color};
      font-size: 26px;
      font-weight: 900;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 12px ${color};
      transition: transform 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.6s ease-out;
      opacity: 1;
      pointer-events: none;
    `;
    this.popupContainer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(-50%, -120%) scale(1.1)`;
    });

    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 600);
    }, 450);
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
