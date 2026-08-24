import * as THREE from "three";
import { BIRD_VISUAL_RADIUS, BIRD_X } from "../core/constants";
import type { World } from "../core/types";

export class BirdView {
  group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private bodyMat: THREE.MeshStandardMaterial;
  private bellyMesh: THREE.Mesh;
  private bellyMat: THREE.MeshStandardMaterial;
  private beakMesh: THREE.Mesh;
  private leftWingPivot: THREE.Group;
  private rightWingPivot: THREE.Group;
  private wingMat: THREE.MeshStandardMaterial;
  private wingT = 0;

  constructor() {
    this.group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 12, 8);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true,
      transparent: true,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.bodyMesh.scale.set(1.1, 0.95, 0.9);
    this.group.add(this.bodyMesh);

    // Belly patch
    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.75, 10, 6);
    this.bellyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      flatShading: true,
      transparent: true,
    });
    this.bellyMesh = new THREE.Mesh(bellyGeo, this.bellyMat);
    this.bellyMesh.position.set(0.1, -0.12, 0);
    this.bellyMesh.scale.set(0.9, 0.7, 0.8);
    this.group.add(this.bellyMesh);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.14, 0.38, 6);
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.3,
      flatShading: true,
    });
    this.beakMesh = new THREE.Mesh(beakGeo, beakMat);
    this.beakMesh.rotation.z = -Math.PI / 2;
    this.beakMesh.position.set(BIRD_VISUAL_RADIUS + 0.12, -0.02, 0);
    this.group.add(this.beakMesh);

    // Eyes (left and right)
    const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeWhiteGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(0.22, 0.15, 0.3);
    const leftPupil = new THREE.Mesh(eyeGeo, eyeMat);
    leftPupil.position.set(0.28, 0.16, 0.36);
    this.group.add(leftEyeWhite);
    this.group.add(leftPupil);

    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.22, 0.15, -0.3);
    const rightPupil = new THREE.Mesh(eyeGeo, eyeMat);
    rightPupil.position.set(0.28, 0.16, -0.36);
    this.group.add(rightEyeWhite);
    this.group.add(rightPupil);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.4, 0.08, 0.22);
    wingGeo.translate(0, 0, 0.11);
    this.wingMat = new THREE.MeshStandardMaterial({
      color: 0xe5aa20,
      roughness: 0.4,
      flatShading: true,
      transparent: true,
    });

    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(-0.05, 0.02, 0.35);
    const leftWing = new THREE.Mesh(wingGeo, this.wingMat);
    this.leftWingPivot.add(leftWing);
    this.group.add(this.leftWingPivot);

    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(-0.05, 0.02, -0.35);
    const rightWing = new THREE.Mesh(wingGeo, this.wingMat);
    rightWing.rotation.x = Math.PI;
    this.rightWingPivot.add(rightWing);
    this.group.add(this.rightWingPivot);

    this.group.position.x = BIRD_X;
    this.group.position.y = 1.5;
  }

  onFlap(): void {
    this.wingT = 1;
  }

  setSkin(bodyHex: number, bellyHex = 0xffffff): void {
    this.bodyMat.color.setHex(bodyHex);
    this.wingMat.color.setHex(bodyHex);
    this.bellyMat.color.setHex(bellyHex);
  }

  syncFrom(w: World, alpha: number, dt: number): void {
    void alpha;
    this.group.position.x = BIRD_X;
    this.group.position.y = w.bird.y;

    // Pitch in degrees -> radians
    this.group.rotation.z = (w.bird.pitch * Math.PI) / 180;

    // Wing flap animation
    if (this.wingT > 0.001) {
      this.wingT *= Math.exp(-8 * dt);
    } else {
      this.wingT = 0;
    }
    const wingAngle = Math.sin(this.wingT * Math.PI) * 1.1;
    this.leftWingPivot.rotation.x = wingAngle;
    this.rightWingPivot.rotation.x = -wingAngle;

    // Invulnerability shimmer (post-rewind)
    if (w.bird.invulnUntilTick > w.tick) {
      const shimmer = Math.sin(w.tick * 0.4) > 0 ? 0.4 : 0.95;
      this.bodyMat.opacity = shimmer;
      this.bellyMat.opacity = shimmer;
      this.wingMat.opacity = shimmer;
    } else {
      this.bodyMat.opacity = 1;
      this.bellyMat.opacity = 1;
      this.wingMat.opacity = 1;
    }
  }
}
