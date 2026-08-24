import * as THREE from "three";
import type { BiomeId } from "../core/biomes";
import { GROUND_Y } from "../core/constants";

export class BiomeVfx {
  group: THREE.Group;
  private currentBiome: BiomeId = "meadow";
  private time = 0;

  // 1. Meadow VFX: Floating pollen & fireflies + distant fluffy clouds
  private meadowGroup: THREE.Group;
  private pollenPoints: THREE.Points;
  private pollenPositions: Float32Array;
  private cloudMeshes: THREE.Group[] = [];

  // 2. Cyber VFX: Sweeping Laser Pillars & Digital Rain Motes
  private cyberGroup: THREE.Group;
  private laserBeams: THREE.Mesh[] = [];
  private digitalRainPoints: THREE.Points;
  private digitalRainPositions: Float32Array;

  // 3. Candy VFX: Tumbling Pastel Star Sprinkles
  private candyGroup: THREE.Group;
  private sprinklePoints: THREE.Points;
  private sprinklePositions: Float32Array;

  // 4. Magma VFX: Rising Ash Embers & Volcanic Eruption Geysers
  private magmaGroup: THREE.Group;
  private emberPoints: THREE.Points;
  private emberPositions: Float32Array;
  private eruptionTimer = 0;
  private eruptionParticles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number; active: boolean }[] = [];

  constructor() {
    this.group = new THREE.Group();

    this.meadowGroup = new THREE.Group();
    this.cyberGroup = new THREE.Group();
    this.candyGroup = new THREE.Group();
    this.magmaGroup = new THREE.Group();

    this.group.add(this.meadowGroup);
    this.group.add(this.cyberGroup);
    this.group.add(this.candyGroup);
    this.group.add(this.magmaGroup);

    // Initialize all sub-systems
    this.pollenPositions = new Float32Array(50 * 3);
    this.pollenPoints = this.initMeadow();

    this.digitalRainPositions = new Float32Array(60 * 3);
    this.digitalRainPoints = this.initCyber();

    this.sprinklePositions = new Float32Array(50 * 3);
    this.sprinklePoints = this.initCandy();

    this.emberPositions = new Float32Array(70 * 3);
    this.emberPoints = this.initMagma();

    this.setBiome("meadow");
  }

  setBiome(biomeId: BiomeId): void {
    this.currentBiome = biomeId;
    this.meadowGroup.visible = biomeId === "meadow";
    this.cyberGroup.visible = biomeId === "cyber";
    this.candyGroup.visible = biomeId === "candy";
    this.magmaGroup.visible = biomeId === "magma";
  }

  // --- 1. MEADOW INITIALIZATION ---
  private initMeadow(): THREE.Points {
    const count = 50;
    for (let i = 0; i < count; i++) {
      this.pollenPositions[i * 3] = (Math.random() - 0.5) * 30;
      this.pollenPositions[i * 3 + 1] = GROUND_Y + 0.5 + Math.random() * 8;
      this.pollenPositions[i * 3 + 2] = -4 - Math.random() * 8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pollenPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfff080,
      size: 0.65,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.meadowGroup.add(points);

    // Distant Fluffy Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
    });

    for (let c = 0; c < 4; c++) {
      const cloud = new THREE.Group();
      for (let p = 0; p < 5; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 6, 5), cloudMat);
        puff.position.set((p - 2) * 1.4, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8);
        cloud.add(puff);
      }
      cloud.position.set((c - 1.5) * 16, 7 + Math.random() * 3, -16 - Math.random() * 4);
      this.cloudMeshes.push(cloud);
      this.meadowGroup.add(cloud);
    }

    return points;
  }

  // --- 2. CYBER INITIALIZATION (Laser Beams & Data Rain) ---
  private initCyber(): THREE.Points {
    // 3 Sweeping Towering Laser Searchlights
    const laserColors = [0x00f5d4, 0xf72585, 0x4cc9f0];
    const laserOffsets = [-10, 0, 10];

    laserColors.forEach((col, idx) => {
      const laserGeo = new THREE.CylinderGeometry(0.12, 0.45, 55, 8);
      laserGeo.translate(0, 27.5, 0);
      const laserMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(laserGeo, laserMat);
      beam.position.set(laserOffsets[idx]!, GROUND_Y, -8 - idx * 2);
      this.laserBeams.push(beam);
      this.cyberGroup.add(beam);
    });

    // Digital Data Rain Motes
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.digitalRainPositions[i * 3] = (Math.random() - 0.5) * 26;
      this.digitalRainPositions[i * 3 + 1] = GROUND_Y + Math.random() * 12;
      this.digitalRainPositions[i * 3 + 2] = -4 - Math.random() * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.digitalRainPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f5d4,
      size: 0.5,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.cyberGroup.add(points);

    return points;
  }

  // --- 3. CANDY INITIALIZATION (Pastel Sprinkles) ---
  private initCandy(): THREE.Points {
    const count = 50;
    for (let i = 0; i < count; i++) {
      this.sprinklePositions[i * 3] = (Math.random() - 0.5) * 26;
      this.sprinklePositions[i * 3 + 1] = GROUND_Y + Math.random() * 10;
      this.sprinklePositions[i * 3 + 2] = -4 - Math.random() * 8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.sprinklePositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff99c8,
      size: 0.7,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.candyGroup.add(points);

    return points;
  }

  // --- 4. MAGMA INITIALIZATION (Rising Embers & Eruption Geysers) ---
  private initMagma(): THREE.Points {
    const count = 70;
    for (let i = 0; i < count; i++) {
      this.emberPositions[i * 3] = (Math.random() - 0.5) * 28;
      this.emberPositions[i * 3 + 1] = GROUND_Y + Math.random() * 9;
      this.emberPositions[i * 3 + 2] = -4 - Math.random() * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.emberPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff5400,
      size: 0.7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.magmaGroup.add(points);

    // Eruption Particle Pool (20 active magma spark meshes)
    const sparkGeo = new THREE.DodecahedronGeometry(0.16, 0);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      mesh.visible = false;
      this.magmaGroup.add(mesh);
      this.eruptionParticles.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        active: false,
      });
    }

    return points;
  }

  update(dt: number, scrollSpeed: number): void {
    this.time += dt;

    switch (this.currentBiome) {
      case "meadow": {
        // Drift pollen
        const pAttr = this.pollenPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
        const pos = this.pollenPositions;
        for (let i = 0; i < 50; i++) {
          const idx = i * 3;
          const px = (pos[idx] ?? 0) - (scrollSpeed * 0.4) * dt;
          const py = (pos[idx + 1] ?? 0) + Math.sin(this.time * 2 + i) * 0.2 * dt;
          pos[idx] = px < -16 ? 16 : px;
          pos[idx + 1] = py;
        }
        pAttr.needsUpdate = true;

        // Drift clouds slowly
        this.cloudMeshes.forEach((cloud, i) => {
          cloud.position.x -= (scrollSpeed * 0.15 + i * 0.05) * dt;
          if (cloud.position.x < -30) cloud.position.x = 30;
        });
        break;
      }

      case "cyber": {
        // Sweep laser searchlights in rhythmic oscillations
        this.laserBeams.forEach((beam, idx) => {
          const freq = 0.8 + idx * 0.3;
          const sweep = Math.sin(this.time * freq + idx * 1.5) * 0.28;
          beam.rotation.z = sweep;
          beam.rotation.x = Math.cos(this.time * freq * 0.7 + idx) * 0.15;
          const mat = beam.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.25 + Math.sin(this.time * 4 + idx) * 0.15;
        });

        // Fall digital rain
        const dAttr = this.digitalRainPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
        const pos = this.digitalRainPositions;
        for (let i = 0; i < 60; i++) {
          const idx = i * 3;
          let py = (pos[idx + 1] ?? 0) - (6 + (i % 5)) * dt;
          let px = (pos[idx] ?? 0) - (scrollSpeed * 0.3) * dt;
          if (py < GROUND_Y) {
            py = GROUND_Y + 12;
            px = (Math.random() - 0.5) * 26;
          }
          pos[idx] = px;
          pos[idx + 1] = py;
        }
        dAttr.needsUpdate = true;
        break;
      }

      case "candy": {
        // Tumbling floating sugar sprinkles
        const sAttr = this.sprinklePoints.geometry.getAttribute("position") as THREE.BufferAttribute;
        const pos = this.sprinklePositions;
        for (let i = 0; i < 50; i++) {
          const idx = i * 3;
          let px = (pos[idx] ?? 0) - (scrollSpeed * 0.35) * dt;
          let py = (pos[idx + 1] ?? 0) + (0.4 + Math.sin(this.time * 3 + i) * 0.3) * dt;
          if (px < -16) px = 16;
          if (py > 10) py = GROUND_Y;
          pos[idx] = px;
          pos[idx + 1] = py;
        }
        sAttr.needsUpdate = true;
        break;
      }

      case "magma": {
        // Rising glowing embers
        const eAttr = this.emberPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
        const pos = this.emberPositions;
        for (let i = 0; i < 70; i++) {
          const idx = i * 3;
          let px = (pos[idx] ?? 0) - (scrollSpeed * 0.4) * dt;
          let py = (pos[idx + 1] ?? 0) + (1.8 + (i % 3) * 0.8) * dt;
          if (px < -16) px = 16;
          if (py > 10) {
            py = GROUND_Y;
            px = (Math.random() - 0.5) * 28;
          }
          pos[idx] = px;
          pos[idx + 1] = py;
        }
        eAttr.needsUpdate = true;

        // Periodic Volcanic Eruption Geysers (every ~2.2s)
        this.eruptionTimer += dt;
        if (this.eruptionTimer > 2.2) {
          this.eruptionTimer = 0;
          const eruptX = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 5);
          const eruptZ = -10 - Math.random() * 4;
          let launched = 0;
          for (const p of this.eruptionParticles) {
            if (!p.active) {
              p.active = true;
              p.mesh.visible = true;
              p.mesh.position.set(eruptX, GROUND_Y, eruptZ);
              p.vx = (Math.random() - 0.5) * 4;
              p.vy = 10 + Math.random() * 6;
              p.vz = (Math.random() - 0.5) * 3;
              p.life = 0;
              p.maxLife = 1.0 + Math.random() * 0.5;
              launched++;
              if (launched >= 8) break;
            }
          }
        }

        // Update active eruption particles
        for (const p of this.eruptionParticles) {
          if (p.active) {
            p.life += dt;
            if (p.life >= p.maxLife) {
              p.active = false;
              p.mesh.visible = false;
            } else {
              p.vy -= 18 * dt; // gravity
              p.mesh.position.x += p.vx * dt;
              p.mesh.position.y += p.vy * dt;
              p.mesh.position.z += p.vz * dt;
              const prog = p.life / p.maxLife;
              (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - prog;
            }
          }
        }
        break;
      }
    }
  }
}
