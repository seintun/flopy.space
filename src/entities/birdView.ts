import * as THREE from "three";
import { BIRD_VISUAL_RADIUS, BIRD_X } from "../core/constants";
import type { World } from "../core/types";

export class BirdView {
  group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private bodyMat: THREE.MeshStandardMaterial;
  private bellyMesh: THREE.Mesh;
  private bellyMat: THREE.MeshStandardMaterial;
  private leftEarGroup: THREE.Group;
  private rightEarGroup: THREE.Group;
  private earMat: THREE.MeshStandardMaterial;
  private innerEarMat: THREE.MeshStandardMaterial;
  private leftWingPivot: THREE.Group;
  private rightWingPivot: THREE.Group;
  private wingMat: THREE.MeshStandardMaterial;
  private tailPivot: THREE.Group;
  private wingT = 0;
  private animTime = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Chubby Cat Body
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 14, 10);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff9f1c, // Orange Tabby
      roughness: 0.5,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.bodyMesh.scale.set(1.08, 0.98, 0.95);
    this.group.add(this.bodyMesh);

    // 2. Fluffy White Belly
    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.72, 10, 8);
    this.bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfff8f0,
      roughness: 0.6,
      flatShading: true,
      transparent: true,
    });
    this.bellyMesh = new THREE.Mesh(bellyGeo, this.bellyMat);
    this.bellyMesh.position.set(0.08, -0.12, 0);
    this.bellyMesh.scale.set(0.85, 0.7, 0.75);
    this.group.add(this.bellyMesh);

    // 3. Cute Pointed Cat Ears (Left & Right)
    const earGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
    earGeo.rotateY(Math.PI / 4);
    const innerEarGeo = new THREE.ConeGeometry(0.09, 0.24, 4);
    innerEarGeo.rotateY(Math.PI / 4);

    this.earMat = new THREE.MeshStandardMaterial({
      color: 0xff9f1c,
      roughness: 0.5,
      flatShading: true,
      transparent: true,
    });
    this.innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xff94b8, // cute soft pink inner ear
      roughness: 0.4,
      flatShading: true,
    });

    // Left Ear
    this.leftEarGroup = new THREE.Group();
    this.leftEarGroup.position.set(0.06, 0.36, 0.22);
    this.leftEarGroup.rotation.set(-0.25, 0.15, -0.1);
    const leftOuterEar = new THREE.Mesh(earGeo, this.earMat);
    const leftInnerEar = new THREE.Mesh(innerEarGeo, this.innerEarMat);
    leftInnerEar.position.set(0.02, -0.02, 0);
    this.leftEarGroup.add(leftOuterEar);
    this.leftEarGroup.add(leftInnerEar);
    this.group.add(this.leftEarGroup);

    // Right Ear
    this.rightEarGroup = new THREE.Group();
    this.rightEarGroup.position.set(0.06, 0.36, -0.22);
    this.rightEarGroup.rotation.set(0.25, -0.15, -0.1);
    const rightOuterEar = new THREE.Mesh(earGeo, this.earMat);
    const rightInnerEar = new THREE.Mesh(innerEarGeo, this.innerEarMat);
    rightInnerEar.position.set(0.02, -0.02, 0);
    this.rightEarGroup.add(rightOuterEar);
    this.rightEarGroup.add(rightInnerEar);
    this.group.add(this.rightEarGroup);

    // 4. Cheeks & Pink Nose
    const cheekGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      flatShading: true,
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(0.36, -0.04, 0.1);
    this.group.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.36, -0.04, -0.1);
    this.group.add(rightCheek);

    const noseGeo = new THREE.ConeGeometry(0.06, 0.08, 3);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xff6b8b,
      roughness: 0.3,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(0.44, 0.02, 0);
    this.group.add(nose);

    // Whiskers (thin white cylinders)
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const whiskerGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.32, 4);

    // Left whiskers
    const wL1 = new THREE.Mesh(whiskerGeo, whiskerMat);
    wL1.position.set(0.34, 0.02, 0.28);
    wL1.rotation.set(Math.PI / 2, 0.15, 0.3);
    this.group.add(wL1);

    const wL2 = new THREE.Mesh(whiskerGeo, whiskerMat);
    wL2.position.set(0.34, -0.06, 0.28);
    wL2.rotation.set(Math.PI / 2, -0.15, 0.3);
    this.group.add(wL2);

    // Right whiskers
    const wR1 = new THREE.Mesh(whiskerGeo, whiskerMat);
    wR1.position.set(0.34, 0.02, -0.28);
    wR1.rotation.set(Math.PI / 2, -0.15, -0.3);
    this.group.add(wR1);

    const wR2 = new THREE.Mesh(whiskerGeo, whiskerMat);
    wR2.position.set(0.34, -0.06, -0.28);
    wR2.rotation.set(Math.PI / 2, 0.15, -0.3);
    this.group.add(wR2);

    // 5. Big Cute Anime Cat Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const shineGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(0.26, 0.14, 0.24);
    leftEyeWhite.scale.set(0.8, 1, 1);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0.33, 0.14, 0.27);
    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(0.39, 0.18, 0.28);
    this.group.add(leftEyeWhite);
    this.group.add(leftPupil);
    this.group.add(leftShine);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.26, 0.14, -0.24);
    rightEyeWhite.scale.set(0.8, 1, 1);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.33, 0.14, -0.27);
    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.39, 0.18, -0.26);
    this.group.add(rightEyeWhite);
    this.group.add(rightPupil);
    this.group.add(rightShine);

    // 6. Cute Little Wings (Angel/Flying Neko Wings)
    const wingGeo = new THREE.BoxGeometry(0.38, 0.06, 0.22);
    wingGeo.translate(0, 0, 0.11);
    this.wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });

    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(-0.1, 0.12, 0.32);
    const leftWing = new THREE.Mesh(wingGeo, this.wingMat);
    this.leftWingPivot.add(leftWing);
    this.group.add(this.leftWingPivot);

    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(-0.1, 0.12, -0.32);
    const rightWing = new THREE.Mesh(wingGeo, this.wingMat);
    rightWing.rotation.x = Math.PI;
    this.rightWingPivot.add(rightWing);
    this.group.add(this.rightWingPivot);

    // 7. Cute Paws
    const pawGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const pawMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

    const frontLeftPaw = new THREE.Mesh(pawGeo, pawMat);
    frontLeftPaw.position.set(0.16, -0.32, 0.16);
    this.group.add(frontLeftPaw);

    const frontRightPaw = new THREE.Mesh(pawGeo, pawMat);
    frontRightPaw.position.set(0.16, -0.32, -0.16);
    this.group.add(frontRightPaw);

    const backLeftPaw = new THREE.Mesh(pawGeo, pawMat);
    backLeftPaw.position.set(-0.16, -0.3, 0.18);
    this.group.add(backLeftPaw);

    const backRightPaw = new THREE.Mesh(pawGeo, pawMat);
    backRightPaw.position.set(-0.16, -0.3, -0.18);
    this.group.add(backRightPaw);

    // 8. Fluffy Tail
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(-0.4, -0.05, 0);
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.45, 8);
    tailGeo.translate(0, 0.2, 0);
    const tailMesh = new THREE.Mesh(tailGeo, this.bodyMat);
    tailMesh.rotation.z = -0.6;
    this.tailPivot.add(tailMesh);
    this.group.add(this.tailPivot);

    this.group.position.x = BIRD_X;
    this.group.position.y = 1.5;
  }

  onFlap(): void {
    this.wingT = 1;
  }

  setSkin(bodyHex: number, bellyHex = 0xfff8f0): void {
    this.bodyMat.color.setHex(bodyHex);
    this.earMat.color.setHex(bodyHex);
    this.bellyMat.color.setHex(bellyHex);
  }

  syncFrom(w: World, alpha: number, dt: number): void {
    void alpha;
    this.animTime += dt;
    this.group.position.x = BIRD_X;
    this.group.position.y = w.bird.y;

    // Pitch in degrees -> radians
    this.group.rotation.z = (w.bird.pitch * Math.PI) / 180;

    // Wing flap & ear twitch animation
    if (this.wingT > 0.001) {
      this.wingT *= Math.exp(-8 * dt);
    } else {
      this.wingT = 0;
    }
    const wingAngle = Math.sin(this.wingT * Math.PI) * 1.3;
    this.leftWingPivot.rotation.x = wingAngle;
    this.rightWingPivot.rotation.x = -wingAngle;

    // Ear wiggles on flap
    const earWiggle = Math.sin(this.wingT * Math.PI * 2) * 0.15;
    this.leftEarGroup.rotation.z = -0.1 + earWiggle;
    this.rightEarGroup.rotation.z = -0.1 + earWiggle;

    // Tail sway
    this.tailPivot.rotation.y = Math.sin(this.animTime * 5) * 0.35;
    this.tailPivot.rotation.x = Math.cos(this.animTime * 4) * 0.15;

    // Invulnerability shimmer (post-rewind)
    if (w.bird.invulnUntilTick > w.tick) {
      const shimmer = Math.sin(w.tick * 0.4) > 0 ? 0.4 : 0.95;
      this.bodyMat.opacity = shimmer;
      this.bellyMat.opacity = shimmer;
      this.wingMat.opacity = shimmer;
    } else {
      this.bodyMat.opacity = 1;
      this.bellyMat.opacity = 1;
      this.wingMat.opacity = 0.9;
    }
  }
}
