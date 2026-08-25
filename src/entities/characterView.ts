import * as THREE from "three";
import { BIRD_VISUAL_RADIUS, BIRD_X } from "../core/constants";
import type { World } from "../core/types";
import { CHARACTERS, type CharacterId } from "../core/characters";
import { SKINS } from "../core/storage";
import { getEffectiveVisualScale } from "../core/powerups";

export class CharacterView {
  group: THREE.Group;
  private currentId: CharacterId = "neko";

  get characterId(): CharacterId {
    return this.currentId;
  }

  // Reusable sub-groups
  private charGroup: THREE.Group;
  private leftWingPivot: THREE.Group;
  private rightWingPivot: THREE.Group;
  private tailPivot: THREE.Group;
  private leftEarGroup: THREE.Group;
  private rightEarGroup: THREE.Group;
  private thrusterLeft?: THREE.Mesh;
  private thrusterRight?: THREE.Mesh;

  // Materials for skinning & shimmer
  private primaryMat!: THREE.MeshStandardMaterial;
  private bellyMat!: THREE.MeshStandardMaterial;
  private accentMat!: THREE.MeshStandardMaterial;
  private wingMat!: THREE.MeshStandardMaterial;

  private wingT = 0;
  private animTime = 0;

  constructor() {
    this.group = new THREE.Group();
    this.charGroup = new THREE.Group();
    this.leftWingPivot = new THREE.Group();
    this.rightWingPivot = new THREE.Group();
    this.tailPivot = new THREE.Group();
    this.leftEarGroup = new THREE.Group();
    this.rightEarGroup = new THREE.Group();

    this.group.add(this.charGroup);
    this.group.position.x = BIRD_X;
    this.group.position.y = 1.5;

    this.buildCharacter("neko");
  }

  setCharacter(id: CharacterId, skinId?: string): void {
    this.currentId = id;
    this.buildCharacter(id, skinId);
  }

  setSkin(bodyHex: number, bellyHex?: number): void {
    if (this.primaryMat) this.primaryMat.color.setHex(bodyHex);
    if (this.bellyMat && bellyHex) this.bellyMat.color.setHex(bellyHex);
  }

  private clearGroup(): void {
    while (this.charGroup.children.length > 0) {
      const child = this.charGroup.children[0]!;
      this.charGroup.remove(child);
    }
    this.leftWingPivot = new THREE.Group();
    this.rightWingPivot = new THREE.Group();
    this.tailPivot = new THREE.Group();
    this.leftEarGroup = new THREE.Group();
    this.rightEarGroup = new THREE.Group();
    this.thrusterLeft = undefined;
    this.thrusterRight = undefined;
  }

  private buildCharacter(charId: CharacterId, skinId?: string): void {
    this.clearGroup();
    const def = CHARACTERS[charId] || CHARACTERS.neko!;

    let bodyCol = def.primaryColor;
    let bellyCol = def.bellyColor;
    if (skinId && SKINS[skinId] && charId === "neko") {
      bodyCol = SKINS[skinId]!.bodyColor;
      bellyCol = SKINS[skinId]!.bellyColor;
    }

    this.primaryMat = new THREE.MeshStandardMaterial({
      color: bodyCol,
      roughness: 0.45,
      metalness: 0.08,
      flatShading: true,
      transparent: true,
    });

    this.bellyMat = new THREE.MeshStandardMaterial({
      color: bellyCol,
      roughness: 0.55,
      flatShading: true,
      transparent: true,
    });

    this.accentMat = new THREE.MeshStandardMaterial({
      color: def.accentColor,
      roughness: 0.35,
      flatShading: true,
    });

    this.wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });

    switch (charId) {
      case "neko":
        this.buildNeko();
        break;
      case "doge":
        this.buildDoge();
        break;
      case "dragon":
        this.buildDragon();
        break;
      case "hamster":
        this.buildHamster();
        break;
      case "bird":
        this.buildBird();
        break;
    }
  }

  // 1. NEKO CAT
  private buildNeko(): void {
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 14, 10);
    const body = new THREE.Mesh(bodyGeo, this.primaryMat);
    body.scale.set(1.08, 0.98, 0.95);
    this.charGroup.add(body);

    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.72, 10, 8);
    const belly = new THREE.Mesh(bellyGeo, this.bellyMat);
    belly.position.set(0.08, -0.12, 0);
    belly.scale.set(0.85, 0.7, 0.75);
    this.charGroup.add(belly);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
    earGeo.rotateY(Math.PI / 4);
    const innerEarGeo = new THREE.ConeGeometry(0.09, 0.24, 4);
    innerEarGeo.rotateY(Math.PI / 4);
    const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xff94b8, flatShading: true });

    this.leftEarGroup.position.set(0.06, 0.36, 0.22);
    this.leftEarGroup.rotation.set(-0.25, 0.15, -0.1);
    this.leftEarGroup.add(new THREE.Mesh(earGeo, this.primaryMat));
    const inL = new THREE.Mesh(innerEarGeo, innerEarMat);
    inL.position.set(0.02, -0.02, 0);
    this.leftEarGroup.add(inL);
    this.charGroup.add(this.leftEarGroup);

    this.rightEarGroup.position.set(0.06, 0.36, -0.22);
    this.rightEarGroup.rotation.set(0.25, -0.15, -0.1);
    this.rightEarGroup.add(new THREE.Mesh(earGeo, this.primaryMat));
    const inR = new THREE.Mesh(innerEarGeo, innerEarMat);
    inR.position.set(0.02, -0.02, 0);
    this.rightEarGroup.add(inR);
    this.charGroup.add(this.rightEarGroup);

    // Muzzle & Eyes
    this.addEyesAndCheeks();

    // Wings
    this.addAngelWings();

    // Tail
    this.tailPivot.position.set(-0.4, -0.05, 0);
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.45, 8);
    tailGeo.translate(0, 0.2, 0);
    const tail = new THREE.Mesh(tailGeo, this.primaryMat);
    tail.rotation.z = -0.6;
    this.tailPivot.add(tail);
    this.charGroup.add(this.tailPivot);
  }

  // 2. SHIBA DOGE
  private buildDoge(): void {
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 14, 10);
    const body = new THREE.Mesh(bodyGeo, this.primaryMat);
    body.scale.set(1.1, 1, 0.95);
    this.charGroup.add(body);

    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.75, 10, 8);
    const belly = new THREE.Mesh(bellyGeo, this.bellyMat);
    belly.position.set(0.1, -0.1, 0);
    belly.scale.set(0.9, 0.75, 0.8);
    this.charGroup.add(belly);

    // Shiba Snout & Nose
    const snoutGeo = new THREE.ConeGeometry(0.18, 0.28, 6);
    const snout = new THREE.Mesh(snoutGeo, this.bellyMat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.42, -0.04, 0);
    this.charGroup.add(snout);

    const dogNoseGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const dogNose = new THREE.Mesh(dogNoseGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    dogNose.position.set(0.55, -0.02, 0);
    this.charGroup.add(dogNose);

    // Shiba Ears
    const earGeo = new THREE.ConeGeometry(0.16, 0.28, 4);
    earGeo.rotateY(Math.PI / 4);
    this.leftEarGroup.position.set(0.1, 0.38, 0.22);
    this.leftEarGroup.rotation.set(-0.2, 0.1, -0.15);
    this.leftEarGroup.add(new THREE.Mesh(earGeo, this.primaryMat));
    this.charGroup.add(this.leftEarGroup);

    this.rightEarGroup.position.set(0.1, 0.38, -0.22);
    this.rightEarGroup.rotation.set(0.2, -0.1, -0.15);
    this.rightEarGroup.add(new THREE.Mesh(earGeo, this.primaryMat));
    this.charGroup.add(this.rightEarGroup);

    // Eyes
    this.addEyes();

    // Red Hero Cape Wings
    const capeGeo = new THREE.BoxGeometry(0.45, 0.04, 0.25);
    capeGeo.translate(0, 0, 0.12);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 });

    this.leftWingPivot.position.set(-0.15, 0.15, 0.28);
    this.leftWingPivot.add(new THREE.Mesh(capeGeo, capeMat));
    this.charGroup.add(this.leftWingPivot);

    this.rightWingPivot.position.set(-0.15, 0.15, -0.28);
    const rCape = new THREE.Mesh(capeGeo, capeMat);
    rCape.rotation.x = Math.PI;
    this.rightWingPivot.add(rCape);
    this.charGroup.add(this.rightWingPivot);

    // Cinnamon roll curly tail
    this.tailPivot.position.set(-0.42, 0.05, 0);
    const donutGeo = new THREE.TorusGeometry(0.14, 0.06, 8, 16, Math.PI * 1.6);
    const donut = new THREE.Mesh(donutGeo, this.primaryMat);
    donut.rotation.y = Math.PI / 2;
    donut.rotation.x = 0.4;
    this.tailPivot.add(donut);
    this.charGroup.add(this.tailPivot);
  }

  // 3. CHIBI DRAGON
  private buildDragon(): void {
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 14, 10);
    const body = new THREE.Mesh(bodyGeo, this.primaryMat);
    body.scale.set(1.12, 1, 0.95);
    this.charGroup.add(body);

    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.75, 10, 8);
    const belly = new THREE.Mesh(bellyGeo, this.bellyMat);
    belly.position.set(0.1, -0.1, 0);
    belly.scale.set(0.9, 0.75, 0.8);
    this.charGroup.add(belly);

    // Golden Horns
    const hornGeo = new THREE.ConeGeometry(0.08, 0.32, 6);
    const leftHorn = new THREE.Mesh(hornGeo, this.accentMat);
    leftHorn.position.set(0.05, 0.42, 0.18);
    leftHorn.rotation.set(-0.4, 0.2, -0.3);
    this.charGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, this.accentMat);
    rightHorn.position.set(0.05, 0.42, -0.18);
    rightHorn.rotation.set(0.4, -0.2, -0.3);
    this.charGroup.add(rightHorn);

    // Dragon Spikes along spine
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), this.accentMat);
      spike.position.set(-0.1 - i * 0.1, 0.38 - i * 0.08, 0);
      spike.rotation.z = -0.3;
      this.charGroup.add(spike);
    }

    // Snout with cute fangs
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 6), this.primaryMat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.44, -0.02, 0);
    this.charGroup.add(snout);

    this.addEyes();

    // Bat / Dragon Wings
    const batWingGeo = new THREE.ConeGeometry(0.28, 0.5, 3);
    batWingGeo.translate(0, 0.2, 0);
    this.leftWingPivot.position.set(-0.05, 0.16, 0.3);
    const lWing = new THREE.Mesh(batWingGeo, this.accentMat);
    lWing.rotation.set(Math.PI / 2, 0, 0.8);
    this.leftWingPivot.add(lWing);
    this.charGroup.add(this.leftWingPivot);

    this.rightWingPivot.position.set(-0.05, 0.16, -0.3);
    const rWing = new THREE.Mesh(batWingGeo, this.accentMat);
    rWing.rotation.set(-Math.PI / 2, 0, 0.8);
    this.rightWingPivot.add(rWing);
    this.charGroup.add(this.rightWingPivot);

    // Tail with spade tip
    this.tailPivot.position.set(-0.42, -0.05, 0);
    const tailSpade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), this.accentMat);
    tailSpade.rotation.z = Math.PI / 2;
    tailSpade.position.set(-0.25, 0.1, 0);
    this.tailPivot.add(tailSpade);
    this.charGroup.add(this.tailPivot);
  }

  // 4. ASTRO HAMSTER
  private buildHamster(): void {
    // Solid Hamster Body
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 14, 10);
    const body = new THREE.Mesh(bodyGeo, this.primaryMat);
    body.scale.set(1.06, 0.98, 0.95);
    this.charGroup.add(body);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.72, 10, 8),
      this.bellyMat,
    );
    belly.position.set(0.08, -0.1, 0);
    belly.scale.set(0.9, 0.75, 0.8);
    this.charGroup.add(belly);

    // Round Cute Hamster Ears
    const earGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xffa0bc, roughness: 0.5 });
    const lEar = new THREE.Mesh(earGeo, earMat);
    lEar.position.set(0.06, 0.35, 0.22);
    this.leftEarGroup.add(lEar);
    this.charGroup.add(this.leftEarGroup);

    const rEar = new THREE.Mesh(earGeo, earMat);
    rEar.position.set(0.06, 0.35, -0.22);
    this.rightEarGroup.add(rEar);
    this.charGroup.add(this.rightEarGroup);

    // Chubby Cheeks & Cute Pink Nose
    this.addEyesAndCheeks();

    // Cyber Jetpack Ring & Thrusters
    const saucerGeo = new THREE.TorusGeometry(0.46, 0.05, 8, 20);
    const saucerMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x008877,
      roughness: 0.2,
    });
    const saucer = new THREE.Mesh(saucerGeo, saucerMat);
    saucer.rotation.x = Math.PI / 2;
    saucer.position.y = -0.18;
    this.charGroup.add(saucer);

    // Jet Thruster Flames
    const thrusterGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    this.thrusterLeft = new THREE.Mesh(thrusterGeo, thrusterMat);
    this.thrusterLeft.position.set(-0.25, -0.32, 0.26);
    this.thrusterLeft.rotation.z = Math.PI;
    this.charGroup.add(this.thrusterLeft);

    this.thrusterRight = new THREE.Mesh(thrusterGeo, thrusterMat);
    this.thrusterRight.position.set(-0.25, -0.32, -0.26);
    this.thrusterRight.rotation.z = Math.PI;
    this.charGroup.add(this.thrusterRight);

    // Crystal Clear Helmet Bubble (Rendered last with depthWrite: false to eliminate opacity glitches)
    const glassGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 1.16, 16, 12);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xaaffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
      metalness: 0.4,
      depthWrite: false,
    });
    const glassDome = new THREE.Mesh(glassGeo, glassMat);
    glassDome.renderOrder = 10;
    this.charGroup.add(glassDome);
  }

  // 5. CLASSIC BIRD
  private buildBird(): void {
    const bodyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS, 12, 8);
    const body = new THREE.Mesh(bodyGeo, this.primaryMat);
    body.scale.set(1.1, 0.95, 0.9);
    this.charGroup.add(body);

    const bellyGeo = new THREE.SphereGeometry(BIRD_VISUAL_RADIUS * 0.75, 10, 6);
    const belly = new THREE.Mesh(bellyGeo, this.bellyMat);
    belly.position.set(0.1, -0.12, 0);
    this.charGroup.add(belly);

    // Big Orange Beak
    const beakGeo = new THREE.ConeGeometry(0.15, 0.38, 6);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(BIRD_VISUAL_RADIUS + 0.12, -0.02, 0);
    this.charGroup.add(beak);

    this.addEyes();
    this.addAngelWings();
  }

  private addEyes(): void {
    const eyeWhiteGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const shineGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const lWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    lWhite.position.set(0.26, 0.14, 0.24);
    lWhite.scale.set(0.8, 1, 1);
    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.set(0.33, 0.14, 0.27);
    const lShine = new THREE.Mesh(shineGeo, shineMat);
    lShine.position.set(0.39, 0.18, 0.28);
    this.charGroup.add(lWhite);
    this.charGroup.add(lPupil);
    this.charGroup.add(lShine);

    const rWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rWhite.position.set(0.26, 0.14, -0.24);
    rWhite.scale.set(0.8, 1, 1);
    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.set(0.33, 0.14, -0.27);
    const rShine = new THREE.Mesh(shineGeo, shineMat);
    rShine.position.set(0.39, 0.18, -0.26);
    this.charGroup.add(rWhite);
    this.charGroup.add(rPupil);
    this.charGroup.add(rShine);
  }

  private addEyesAndCheeks(): void {
    this.addEyes();
    const cheekGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const lCheek = new THREE.Mesh(cheekGeo, cheekMat);
    lCheek.position.set(0.36, -0.04, 0.1);
    this.charGroup.add(lCheek);

    const rCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rCheek.position.set(0.36, -0.04, -0.1);
    this.charGroup.add(rCheek);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 3), new THREE.MeshStandardMaterial({ color: 0xff6b8b }));
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(0.44, 0.02, 0);
    this.charGroup.add(nose);
  }

  private addAngelWings(): void {
    const wingGeo = new THREE.BoxGeometry(0.38, 0.06, 0.22);
    wingGeo.translate(0, 0, 0.11);

    this.leftWingPivot.position.set(-0.1, 0.12, 0.32);
    this.leftWingPivot.add(new THREE.Mesh(wingGeo, this.wingMat));
    this.charGroup.add(this.leftWingPivot);

    this.rightWingPivot.position.set(-0.1, 0.12, -0.32);
    const rWing = new THREE.Mesh(wingGeo, this.wingMat);
    rWing.rotation.x = Math.PI;
    this.rightWingPivot.add(rWing);
    this.charGroup.add(this.rightWingPivot);
  }

  onFlap(): void {
    this.wingT = 1;
  }

  syncFrom(w: World, alpha: number, dt: number): void {
    this.animTime += dt;
    this.group.position.x = BIRD_X;

    // Sub-frame linear interpolation between previous tick and current tick
    const subFrameDt = (1 / 120) * (alpha - 1);
    const interpY = w.bird.alive ? w.bird.y + w.bird.vy * subFrameDt : w.bird.y;
    this.group.position.y = interpY;

    // Pitch
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

    // Dynamic Scale Shifter (Chibi / Chubby)
    const targetScale = getEffectiveVisualScale(w);
    const currentScale = this.charGroup.scale.x || 1.0;
    const lerpedScale = THREE.MathUtils.lerp(currentScale, targetScale, 1 - Math.exp(-12 * dt));
    
    // Add cute flap squish/bounce
    const squishFactor = this.wingT * (w.chubbyTimer > 0 ? 0.18 : 0.08);
    this.charGroup.scale.set(
      lerpedScale * (1 + squishFactor),
      lerpedScale * (1 - squishFactor),
      lerpedScale * (1 + squishFactor),
    );

    // Ear wiggle
    const earWiggle = Math.sin(this.wingT * Math.PI * 2) * 0.15;
    this.leftEarGroup.rotation.z = -0.1 + earWiggle;
    this.rightEarGroup.rotation.z = -0.1 + earWiggle;

    // Tail sway
    this.tailPivot.rotation.y = Math.sin(this.animTime * 5) * 0.35;
    this.tailPivot.rotation.x = Math.cos(this.animTime * 4) * 0.15;

    // Thruster pulse for Hamster
    if (this.thrusterLeft && this.thrusterRight) {
      const pulse = 1 + Math.sin(this.animTime * 20) * 0.3 + this.wingT * 1.2;
      this.thrusterLeft.scale.set(pulse, pulse * 1.5, pulse);
      this.thrusterRight.scale.set(pulse, pulse * 1.5, pulse);
    }

    // Invulnerability shimmer
    if (w.bird.invulnUntilTick > w.tick) {
      const shimmer = Math.sin(w.tick * 0.4) > 0 ? 0.4 : 0.95;
      this.primaryMat.opacity = shimmer;
      this.bellyMat.opacity = shimmer;
      this.wingMat.opacity = shimmer;
    } else {
      this.primaryMat.opacity = 1;
      this.bellyMat.opacity = 1;
      this.wingMat.opacity = 0.9;
    }
  }
}
