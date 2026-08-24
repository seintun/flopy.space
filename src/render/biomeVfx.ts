import * as THREE from "three";
import type { BiomeId } from "../core/biomes";
import { GROUND_Y } from "../core/constants";

export class BiomeVfx {
  group: THREE.Group;
  private currentBiome: BiomeId = "meadow";
  private time = 0;

  // 1. Meadow: Distant floating low-poly voxel clouds
  private meadowGroup: THREE.Group;
  private cloudMeshes: THREE.Group[] = [];

  // 2. Cyber: Sweeping distant laser pillars
  private cyberGroup: THREE.Group;
  private laserBeams: THREE.Mesh[] = [];

  // 3. Candy: Pastel cotton candy clouds
  private candyGroup: THREE.Group;
  private candyClouds: THREE.Group[] = [];

  // 4. Magma: Distant volcanic mountain silhouette & soft ember glow
  private magmaGroup: THREE.Group;
  private volcanoMeshes: THREE.Mesh[] = [];

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

    this.initMeadow();
    this.initCyber();
    this.initCandy();
    this.initMagma();

    this.setBiome("meadow");
  }

  setBiome(biomeId: BiomeId): void {
    this.currentBiome = biomeId;
    this.meadowGroup.visible = biomeId === "meadow";
    this.cyberGroup.visible = biomeId === "cyber";
    this.candyGroup.visible = biomeId === "candy";
    this.magmaGroup.visible = biomeId === "magma";
  }

  // --- 1. MEADOW ---
  private initMeadow(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      flatShading: true,
    });

    for (let c = 0; c < 3; c++) {
      const cloud = new THREE.Group();
      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4 + Math.random() * 0.6, 6, 5), cloudMat);
        puff.position.set((p - 1.5) * 1.5, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.6);
        cloud.add(puff);
      }
      cloud.position.set((c - 1) * 22, 6 + Math.random() * 2, -22);
      this.cloudMeshes.push(cloud);
      this.meadowGroup.add(cloud);
    }
  }

  // --- 2. CYBER (Subtle distant laser searchlights in far background) ---
  private initCyber(): void {
    const laserColors = [0x00f5d4, 0xf72585, 0x4cc9f0];
    const laserOffsets = [-12, 0, 12];

    laserColors.forEach((col, idx) => {
      const laserGeo = new THREE.CylinderGeometry(0.08, 0.35, 60, 8);
      laserGeo.translate(0, 30, 0);
      const laserMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.22, // Soft, non-distracting
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(laserGeo, laserMat);
      beam.position.set(laserOffsets[idx]!, GROUND_Y, -20);
      this.laserBeams.push(beam);
      this.cyberGroup.add(beam);
    });
  }

  // --- 3. CANDY (Soft pastel cotton candy clouds) ---
  private initCandy(): void {
    const candyCloudMat = new THREE.MeshStandardMaterial({
      color: 0xffcbf2,
      roughness: 0.95,
      flatShading: true,
    });

    for (let c = 0; c < 3; c++) {
      const cloud = new THREE.Group();
      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random() * 0.7, 6, 5), candyCloudMat);
        puff.position.set((p - 1.5) * 1.6, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6);
        cloud.add(puff);
      }
      cloud.position.set((c - 1) * 20, 6.5 + Math.random() * 2, -22);
      this.candyClouds.push(cloud);
      this.candyGroup.add(cloud);
    }
  }

  // --- 4. MAGMA (Distant volcanic mountain peaks) ---
  private initMagma(): void {
    const volcanoMat = new THREE.MeshStandardMaterial({
      color: 0x1a0604,
      roughness: 0.95,
      flatShading: true,
    });

    const vPositions = [-14, 0, 14];
    vPositions.forEach((xPos) => {
      const coneGeo = new THREE.ConeGeometry(5 + Math.random() * 2, 9, 5);
      const volcano = new THREE.Mesh(coneGeo, volcanoMat);
      volcano.position.set(xPos, GROUND_Y + 4, -24);
      this.volcanoMeshes.push(volcano);
      this.magmaGroup.add(volcano);
    });
  }

  update(dt: number, scrollSpeed: number): void {
    this.time += dt;

    switch (this.currentBiome) {
      case "meadow": {
        this.cloudMeshes.forEach((cloud, i) => {
          cloud.position.x -= (scrollSpeed * 0.08 + i * 0.03) * dt;
          if (cloud.position.x < -32) cloud.position.x = 32;
        });
        break;
      }

      case "cyber": {
        // Slow, gentle sweeping searchlights with low calm oscillation
        this.laserBeams.forEach((beam, idx) => {
          const freq = 0.4 + idx * 0.15;
          const sweep = Math.sin(this.time * freq + idx * 1.5) * 0.18;
          beam.rotation.z = sweep;
        });
        break;
      }

      case "candy": {
        this.candyClouds.forEach((cloud, i) => {
          cloud.position.x -= (scrollSpeed * 0.08 + i * 0.03) * dt;
          if (cloud.position.x < -32) cloud.position.x = 32;
        });
        break;
      }

      case "magma": {
        this.volcanoMeshes.forEach((volcano, i) => {
          volcano.position.x -= (scrollSpeed * 0.04 + i * 0.02) * dt;
          if (volcano.position.x < -32) volcano.position.x = 32;
        });
        break;
      }
    }
  }
}
