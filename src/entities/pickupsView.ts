import * as THREE from "three";
import type { World } from "../core/types";

interface PooledPickup {
  group: THREE.Group;
  clockGroup: THREE.Group;
  rainbowGroup: THREE.Group;
  shieldGroup: THREE.Group;
  magnetGroup: THREE.Group;
  starGroup: THREE.Group;
  hazardMineGroup: THREE.Group;
  heavyGravityGroup: THREE.Group;
  speedSurgeGroup: THREE.Group;

  // Specific meshes for animation
  clockRing: THREE.Mesh;
  clockHour: THREE.Mesh;
  clockMinute: THREE.Mesh;
  rainbowPrism: THREE.Mesh;
  rainbowPrismMat: THREE.MeshStandardMaterial;
  shieldStar: THREE.Mesh;
  magnetRing: THREE.Mesh;
  starMesh: THREE.Mesh;

  // Hazard meshes
  hazardMineCore: THREE.Mesh;
  hazardMineSpikes: THREE.Group;
  heavyGravityCube: THREE.Mesh;
  heavyGravityRing: THREE.Mesh;
  speedSurgePrism: THREE.Mesh;
  speedSurgeFins: THREE.Mesh;

  orbId: number;
}

interface PooledToken {
  group: THREE.Group;
  mesh: THREE.Mesh;
  rim: THREE.Mesh;
  tokenId: number;
}

export class PickupsView {
  private pool: PooledPickup[] = [];
  private tokenPool: PooledToken[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, poolSize = 10) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Shared geometries for high-performance memory pooling
    const clockSphereGeo = new THREE.SphereGeometry(0.32, 16, 12);
    const clockRingGeo = new THREE.TorusGeometry(0.48, 0.04, 8, 24);
    const clockHandGeo = new THREE.BoxGeometry(0.04, 0.22, 0.02);
    clockHandGeo.translate(0, 0.11, 0);

    const prismGeo = new THREE.OctahedronGeometry(0.42, 0);
    const starGeo = new THREE.DodecahedronGeometry(0.38, 0);
    const magnetTorusGeo = new THREE.TorusGeometry(0.44, 0.08, 8, 20);
    const bubbleGeo = new THREE.SphereGeometry(0.48, 16, 12);

    // Hazard geometries
    const hazardCoreGeo = new THREE.IcosahedronGeometry(0.28, 0);
    const hazardSpikeGeo = new THREE.ConeGeometry(0.07, 0.32, 5);
    hazardSpikeGeo.translate(0, 0.16, 0);

    const heavyCubeGeo = new THREE.BoxGeometry(0.46, 0.46, 0.46);
    const heavyRingGeo = new THREE.TorusGeometry(0.52, 0.035, 6, 20);
    const speedTetraGeo = new THREE.TetrahedronGeometry(0.42, 0);
    const speedFinGeo = new THREE.TorusGeometry(0.48, 0.04, 4, 16);

    for (let i = 0; i < poolSize; i++) {
      const pGroup = new THREE.Group();

      // 1. CLOCK (Slow-Mo) - Cyan #00E5FF (L*=83.5)
      const clockGroup = new THREE.Group();
      const clockCore = new THREE.Mesh(
        clockSphereGeo,
        new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x00a8cc,
          emissiveIntensity: 0.9,
          roughness: 0.15,
          metalness: 0.2,
          transparent: true,
          opacity: 0.92,
        }),
      );
      const clockRing = new THREE.Mesh(
        clockRingGeo,
        new THREE.MeshBasicMaterial({ color: 0xa0ffff, transparent: true, opacity: 0.9 }),
      );
      const clockHour = new THREE.Mesh(clockHandGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      clockHour.scale.set(1, 0.7, 1);
      clockHour.position.z = 0.34;
      const clockMinute = new THREE.Mesh(clockHandGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      clockMinute.position.z = 0.34;
      clockGroup.add(clockCore, clockRing, clockHour, clockMinute);
      pGroup.add(clockGroup);

      // 2. RAINBOW PRISM - Electric Pink #FF007F (L*=62.1)
      const rainbowGroup = new THREE.Group();
      const rainbowPrismMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff00aa,
        emissiveIntensity: 0.95,
        roughness: 0.1,
        metalness: 0.4,
      });
      const rainbowPrism = new THREE.Mesh(prismGeo, rainbowPrismMat);
      const rainbowHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.03, 6, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }),
      );
      rainbowHalo.rotation.x = Math.PI / 3;
      rainbowGroup.add(rainbowPrism, rainbowHalo);
      pGroup.add(rainbowGroup);

      // 3. SHIELD BUBBLE - Radiant Gold #FFD700 (L*=84.2)
      const shieldGroup = new THREE.Group();
      const shieldBubble = new THREE.Mesh(
        bubbleGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.4,
          roughness: 0.1,
          transmission: 0.85,
        }),
      );
      const shieldStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffaa00,
          emissiveIntensity: 0.95,
          roughness: 0.15,
        }),
      );
      shieldGroup.add(shieldBubble, shieldStar);
      pGroup.add(shieldGroup);

      // 4. MAGNET - Neon Mint #00F5D4 (L*=86.4)
      const magnetGroup = new THREE.Group();
      const magnetRing = new THREE.Mesh(
        magnetTorusGeo,
        new THREE.MeshStandardMaterial({
          color: 0x00f5d4,
          emissive: 0x00bbf9,
          emissiveIntensity: 0.85,
          roughness: 0.2,
        }),
      );
      const magnetCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      magnetGroup.add(magnetRing, magnetCore);
      pGroup.add(magnetGroup);

      // 5. STAR GEM - Warm Amber #FFBE0B (L*=81.0)
      const starGroup = new THREE.Group();
      const starMesh = new THREE.Mesh(
        starGeo,
        new THREE.MeshStandardMaterial({
          color: 0xffbe0b,
          emissive: 0xff9f1c,
          emissiveIntensity: 0.95,
          roughness: 0.15,
          metalness: 0.5,
        }),
      );
      starGroup.add(starMesh);
      pGroup.add(starGroup);

      // 6. VOID MINE (Hazard) - Spiked Obsidian Core #1B0A2A + Acute Spikes #FF2A6D
      const hazardMineGroup = new THREE.Group();
      const hazardMineCore = new THREE.Mesh(
        hazardCoreGeo,
        new THREE.MeshStandardMaterial({
          color: 0x180824,
          emissive: 0x330011,
          roughness: 0.5,
          metalness: 0.8,
        }),
      );
      const hazardMineSpikes = new THREE.Group();
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0xff2a6d,
        emissive: 0xff0044,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      });

      // 8 acute radial spikes in orthogonal and diagonal vectors
      const spikeDirs = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0.7, 0.7, 0).normalize(),
        new THREE.Vector3(-0.7, 0.7, 0).normalize(),
        new THREE.Vector3(0.7, -0.7, 0).normalize(),
        new THREE.Vector3(-0.7, -0.7, 0).normalize(),
      ];

      for (const dir of spikeDirs) {
        const spike = new THREE.Mesh(hazardSpikeGeo, spikeMat);
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        spike.position.copy(dir.clone().multiplyScalar(0.22));
        hazardMineSpikes.add(spike);
      }
      hazardMineGroup.add(hazardMineCore, hazardMineSpikes);
      pGroup.add(hazardMineGroup);

      // 7. HEAVY GRAVITY SINK (Hazard) - Electric Violet #9D4EDD + Obsidian
      const heavyGravityGroup = new THREE.Group();
      const heavyGravityCube = new THREE.Mesh(
        heavyCubeGeo,
        new THREE.MeshStandardMaterial({
          color: 0x240046,
          emissive: 0x9d4edd,
          emissiveIntensity: 0.85,
          roughness: 0.3,
          metalness: 0.6,
        }),
      );
      const heavyGravityRing = new THREE.Mesh(
        heavyRingGeo,
        new THREE.MeshBasicMaterial({ color: 0xc77dff, transparent: true, opacity: 0.85 }),
      );
      heavyGravityGroup.add(heavyGravityCube, heavyGravityRing);
      pGroup.add(heavyGravityGroup);

      // 8. SPEED SURGE (Wager) - Warning Amber #FF8800 + Chevrons
      const speedSurgeGroup = new THREE.Group();
      const speedSurgePrism = new THREE.Mesh(
        speedTetraGeo,
        new THREE.MeshStandardMaterial({
          color: 0xff8800,
          emissive: 0xff5500,
          emissiveIntensity: 1.0,
          roughness: 0.2,
          metalness: 0.4,
        }),
      );
      const speedSurgeFins = new THREE.Mesh(
        speedFinGeo,
        new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.9 }),
      );
      speedSurgeGroup.add(speedSurgePrism, speedSurgeFins);
      pGroup.add(speedSurgeGroup);

      pGroup.visible = false;
      this.group.add(pGroup);

      this.pool.push({
        group: pGroup,
        clockGroup,
        rainbowGroup,
        shieldGroup,
        magnetGroup,
        starGroup,
        hazardMineGroup,
        heavyGravityGroup,
        speedSurgeGroup,
        clockRing,
        clockHour,
        clockMinute,
        rainbowPrism,
        rainbowPrismMat,
        shieldStar,
        magnetRing,
        starMesh,
        hazardMineCore,
        hazardMineSpikes,
        heavyGravityCube,
        heavyGravityRing,
        speedSurgePrism,
        speedSurgeFins,
        orbId: -1,
      });
    }

    // Pooled 3D spinning gold coins (16 slots)
    const coinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinRimGeo = new THREE.TorusGeometry(0.24, 0.02, 6, 16);

    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9900,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.18,
    });
    const coinRimMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });

    for (let i = 0; i < 16; i++) {
      const tGroup = new THREE.Group();
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      const rim = new THREE.Mesh(coinRimGeo, coinRimMat);
      tGroup.add(mesh, rim);
      tGroup.visible = false;
      this.group.add(tGroup);
      this.tokenPool.push({ group: tGroup, mesh, rim, tokenId: -1 });
    }
  }

  syncFrom(w: World, timeSec: number): void {
    let activeIdx = 0;
    const rainbowColors = [0xff0055, 0xff9900, 0xffea00, 0x00ff66, 0x00d4ff, 0x7b00ff];

    for (let j = 0; j < w.orbs.length; j++) {
      const o = w.orbs[j]!;
      if (o.taken) continue;
      if (activeIdx < this.pool.length) {
        const item = this.pool[activeIdx]!;
        item.group.visible = true;
        item.orbId = o.id;

        const isHazard = o.type === "hazard_mine" || o.type === "heavy_gravity";
        // Hazards jitter with twitch rhythm; buffs float with harmonic sine
        const bob = isHazard
          ? Math.sin(timeSec * 8 + o.id) * 0.12 + Math.cos(timeSec * 14) * 0.04
          : Math.sin(timeSec * 3.5 + o.id * 1.5) * 0.18;

        item.group.position.set(o.x, o.y + bob, 0);

        // Hide all variants first
        item.clockGroup.visible = false;
        item.rainbowGroup.visible = false;
        item.shieldGroup.visible = false;
        item.magnetGroup.visible = false;
        item.starGroup.visible = false;
        item.hazardMineGroup.visible = false;
        item.heavyGravityGroup.visible = false;
        item.speedSurgeGroup.visible = false;

        const type = o.type || "slowmo";

        switch (type) {
          case "slowmo": {
            item.clockGroup.visible = true;
            item.clockRing.rotation.y = timeSec * 1.5;
            item.clockRing.rotation.x = Math.sin(timeSec * 2) * 0.3;
            item.clockHour.rotation.z = -timeSec * 2;
            item.clockMinute.rotation.z = -timeSec * 6;
            break;
          }
          case "rainbow_trail": {
            item.rainbowGroup.visible = true;
            item.rainbowPrism.rotation.y = timeSec * 3;
            item.rainbowPrism.rotation.x = timeSec * 2;
            const cIdx = Math.floor((timeSec * 4 + o.id) % rainbowColors.length);
            item.rainbowPrismMat.emissive.setHex(rainbowColors[cIdx] || 0xff007f);
            break;
          }
          case "shield": {
            item.shieldGroup.visible = true;
            item.shieldStar.rotation.y = timeSec * 3;
            item.shieldStar.rotation.z = timeSec * 2;
            break;
          }
          case "magnet": {
            item.magnetGroup.visible = true;
            item.magnetRing.rotation.x = timeSec * 2.5;
            item.magnetRing.rotation.y = timeSec * 3;
            break;
          }
          case "star_gem": {
            item.starGroup.visible = true;
            item.starMesh.rotation.y = timeSec * 2.5;
            item.starMesh.rotation.z = Math.sin(timeSec * 3) * 0.4;
            break;
          }
          case "hazard_mine": {
            item.hazardMineGroup.visible = true;
            // High-frequency counter-rotation + jitter
            item.hazardMineGroup.rotation.z = -timeSec * 5.0;
            item.hazardMineGroup.rotation.x = Math.sin(timeSec * 12) * 0.35;
            item.hazardMineSpikes.rotation.y = timeSec * 6.0;
            break;
          }
          case "heavy_gravity": {
            item.heavyGravityGroup.visible = true;
            item.heavyGravityCube.rotation.x = timeSec * 2.0;
            item.heavyGravityCube.rotation.y = timeSec * 2.5;
            item.heavyGravityRing.rotation.x = Math.PI / 2;
            item.heavyGravityRing.scale.setScalar(1.0 + Math.sin(timeSec * 6) * 0.2);
            break;
          }
          case "speed_surge": {
            item.speedSurgeGroup.visible = true;
            item.speedSurgePrism.rotation.y = timeSec * 4.5;
            item.speedSurgePrism.rotation.z = timeSec * 3.0;
            item.speedSurgeFins.rotation.x = timeSec * 4.0;
            break;
          }
        }

        activeIdx++;
      }
    }

    for (let i = activeIdx; i < this.pool.length; i++) {
      const item = this.pool[i]!;
      item.group.visible = false;
      item.orbId = -1;
    }

    // Sync in-flight Mario-style tokens
    let activeTokenIdx = 0;
    for (let j = 0; j < w.tokens.length; j++) {
      const t = w.tokens[j]!;
      if (t.taken) continue;
      if (activeTokenIdx < this.tokenPool.length) {
        const item = this.tokenPool[activeTokenIdx]!;
        item.group.visible = true;
        item.tokenId = t.id;
        const bob = Math.sin(timeSec * 4.5 + t.id * 1.2) * 0.1;
        item.group.position.set(t.x, t.y + bob, 0);
        item.group.rotation.y = timeSec * 4.5 + t.id * 0.8;
        activeTokenIdx++;
      }
    }

    for (let i = activeTokenIdx; i < this.tokenPool.length; i++) {
      const item = this.tokenPool[i]!;
      item.group.visible = false;
      item.tokenId = -1;
    }
  }
}
