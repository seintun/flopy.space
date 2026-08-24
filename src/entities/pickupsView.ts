import * as THREE from "three";
import type { World } from "../core/types";

interface PooledOrb {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
  coreMat: THREE.MeshStandardMaterial;
  orbId: number;
}

export class PickupsView {
  private pool: PooledOrb[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, poolSize = 6) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 12);
    const ringGeo = new THREE.TorusGeometry(0.52, 0.04, 8, 24);
    const handGeo = new THREE.BoxGeometry(0.04, 0.24, 0.02);
    handGeo.translate(0, 0.12, 0);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x80ffff,
      transparent: true,
      opacity: 0.85,
    });
    const handMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < poolSize; i++) {
      const oGroup = new THREE.Group();

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x0099cc,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.3,
        transparent: true,
        opacity: 0.9,
      });

      const coreMesh = new THREE.Mesh(sphereGeo, coreMat);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      const hourHand = new THREE.Mesh(handGeo, handMat);
      hourHand.scale.set(1, 0.7, 1);
      hourHand.position.z = 0.36;

      const minuteHand = new THREE.Mesh(handGeo, handMat);
      minuteHand.position.z = 0.36;

      oGroup.add(coreMesh);
      oGroup.add(ringMesh);
      oGroup.add(hourHand);
      oGroup.add(minuteHand);

      oGroup.visible = false;
      this.group.add(oGroup);

      this.pool.push({
        group: oGroup,
        coreMesh,
        ringMesh,
        hourHand,
        minuteHand,
        coreMat,
        orbId: -1,
      });
    }
  }

  syncFrom(w: World, timeSec: number): void {
    let activeIdx = 0;
    for (let j = 0; j < w.orbs.length; j++) {
      const o = w.orbs[j]!;
      if (o.taken) continue;
      if (activeIdx < this.pool.length) {
        const item = this.pool[activeIdx]!;
        item.group.visible = true;
        item.orbId = o.id;

        const bob = Math.sin(timeSec * 3 + o.id * 1.5) * 0.18;
        item.group.position.set(o.x, o.y + bob, 0);

        // Clock animation
        item.ringMesh.rotation.y = timeSec * 1.5;
        item.ringMesh.rotation.x = Math.sin(timeSec * 2) * 0.3;

        item.hourHand.rotation.z = -timeSec * 2;
        item.minuteHand.rotation.z = -timeSec * 6;
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
