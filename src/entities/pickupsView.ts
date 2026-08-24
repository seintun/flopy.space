import * as THREE from "three";
import type { World } from "../core/types";

interface PooledPickup {
  group: THREE.Group;
  clockGroup: THREE.Group;
  rainbowGroup: THREE.Group;
  shieldGroup: THREE.Group;
  magnetGroup: THREE.Group;
  starGroup: THREE.Group;

  // Specific meshes for animation
  clockRing: THREE.Mesh;
  clockHour: THREE.Mesh;
  clockMinute: THREE.Mesh;
  rainbowPrism: THREE.Mesh;
  rainbowPrismMat: THREE.MeshStandardMaterial;
  shieldStar: THREE.Mesh;
  magnetRing: THREE.Mesh;
  starMesh: THREE.Mesh;

  orbId: number;
}

export class PickupsView {
  private pool: PooledPickup[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, poolSize = 8) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Shared geometries
    const clockSphereGeo = new THREE.SphereGeometry(0.32, 16, 12);
    const clockRingGeo = new THREE.TorusGeometry(0.48, 0.04, 8, 24);
    const clockHandGeo = new THREE.BoxGeometry(0.04, 0.22, 0.02);
    clockHandGeo.translate(0, 0.11, 0);

    const prismGeo = new THREE.OctahedronGeometry(0.42, 0);
    const starGeo = new THREE.DodecahedronGeometry(0.38, 0);
    const magnetTorusGeo = new THREE.TorusGeometry(0.44, 0.08, 8, 20);
    const bubbleGeo = new THREE.SphereGeometry(0.48, 16, 12);

    for (let i = 0; i < poolSize; i++) {
      const pGroup = new THREE.Group();

      // 1. CLOCK (Slow-Mo)
      const clockGroup = new THREE.Group();
      const clockCore = new THREE.Mesh(
        clockSphereGeo,
        new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x0088bb,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: 0.9,
        }),
      );
      const clockRing = new THREE.Mesh(
        clockRingGeo,
        new THREE.MeshBasicMaterial({ color: 0x80ffff, transparent: true, opacity: 0.85 }),
      );
      const clockHour = new THREE.Mesh(clockHandGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      clockHour.scale.set(1, 0.7, 1);
      clockHour.position.z = 0.34;
      const clockMinute = new THREE.Mesh(clockHandGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      clockMinute.position.z = 0.34;

      clockGroup.add(clockCore, clockRing, clockHour, clockMinute);
      pGroup.add(clockGroup);

      // 2. RAINBOW PRISM
      const rainbowGroup = new THREE.Group();
      const rainbowPrismMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff00aa,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.4,
      });
      const rainbowPrism = new THREE.Mesh(prismGeo, rainbowPrismMat);
      const rainbowHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.03, 6, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.8 }),
      );
      rainbowHalo.rotation.x = Math.PI / 3;
      rainbowGroup.add(rainbowPrism, rainbowHalo);
      pGroup.add(rainbowGroup);

      // 3. SHIELD BUBBLE
      const shieldGroup = new THREE.Group();
      const shieldBubble = new THREE.Mesh(
        bubbleGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          transmission: 0.8,
        }),
      );
      const shieldStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffaa00,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        }),
      );
      shieldGroup.add(shieldBubble, shieldStar);
      pGroup.add(shieldGroup);

      // 4. MAGNET
      const magnetGroup = new THREE.Group();
      const magnetRing = new THREE.Mesh(
        magnetTorusGeo,
        new THREE.MeshStandardMaterial({
          color: 0x00f5d4,
          emissive: 0x00bbf9,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        }),
      );
      const magnetCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      magnetGroup.add(magnetRing, magnetCore);
      pGroup.add(magnetGroup);

      // 5. STAR GEM
      const starGroup = new THREE.Group();
      const starMesh = new THREE.Mesh(
        starGeo,
        new THREE.MeshStandardMaterial({
          color: 0xffbe0b,
          emissive: 0xff9f1c,
          emissiveIntensity: 0.9,
          roughness: 0.15,
          metalness: 0.5,
        }),
      );
      starGroup.add(starMesh);
      pGroup.add(starGroup);

      pGroup.visible = false;
      this.group.add(pGroup);

      this.pool.push({
        group: pGroup,
        clockGroup,
        rainbowGroup,
        shieldGroup,
        magnetGroup,
        starGroup,
        clockRing,
        clockHour,
        clockMinute,
        rainbowPrism,
        rainbowPrismMat,
        shieldStar,
        magnetRing,
        starMesh,
        orbId: -1,
      });
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

        const bob = Math.sin(timeSec * 3.5 + o.id * 1.5) * 0.18;
        item.group.position.set(o.x, o.y + bob, 0);

        // Hide all variants first
        item.clockGroup.visible = false;
        item.rainbowGroup.visible = false;
        item.shieldGroup.visible = false;
        item.magnetGroup.visible = false;
        item.starGroup.visible = false;

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
        }

        activeIdx++;
      }
    }

    for (let i = activeIdx; i < this.pool.length; i++) {
      const item = this.pool[i]!;
      item.group.visible = false;
      item.orbId = -1;
    }
  }
}
