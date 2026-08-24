import * as THREE from "three";
import { BIRD_X, GRAVITY, FLAP_VELOCITY, DT } from "../core/constants";
import type { World } from "../core/types";

export class TrailView {
  group: THREE.Group;

  // Trajectory ribbon
  private ribbonMesh: THREE.Mesh;
  private ribbonGeo: THREE.BufferGeometry;
  private ribbonPositions: Float32Array;
  private ribbonColors: Float32Array;
  private maxPoints = 50;
  private points: Array<{ x: number; y: number; age: number }> = [];

  // Forward trajectory preview dots
  private forwardGroup: THREE.Group;
  private forwardDots: THREE.Mesh[] = [];

  // Shield bubble
  private shieldMesh: THREE.Mesh;
  private shieldMat: THREE.MeshPhysicalMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // 1. Ribbon Setup (strip of quads: 2 vertices per point)
    const vertCount = this.maxPoints * 2;
    this.ribbonPositions = new Float32Array(vertCount * 3);
    this.ribbonColors = new Float32Array(vertCount * 3);

    this.ribbonGeo = new THREE.BufferGeometry();
    this.ribbonGeo.setAttribute("position", new THREE.BufferAttribute(this.ribbonPositions, 3));
    this.ribbonGeo.setAttribute("color", new THREE.BufferAttribute(this.ribbonColors, 3));

    // Indices for triangle strip
    const indices: number[] = [];
    for (let i = 0; i < this.maxPoints - 1; i++) {
      const p1 = i * 2;
      const p2 = i * 2 + 1;
      const p3 = (i + 1) * 2;
      const p4 = (i + 1) * 2 + 1;
      indices.push(p1, p2, p3);
      indices.push(p2, p4, p3);
    }
    this.ribbonGeo.setIndex(indices);

    const ribbonMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.ribbonMesh = new THREE.Mesh(this.ribbonGeo, ribbonMat);
    this.group.add(this.ribbonMesh);

    // 2. Forward Trajectory Predictor Dots
    this.forwardGroup = new THREE.Group();
    const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 20; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.visible = false;
      this.forwardGroup.add(dot);
      this.forwardDots.push(dot);
    }
    this.group.add(this.forwardGroup);

    // 3. Shield Bubble
    const shieldGeo = new THREE.SphereGeometry(0.68, 16, 16);
    this.shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.6,
      depthWrite: false,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.x = BIRD_X;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);
  }

  update(w: World, dt: number, totalTime: number): void {
    const isRainbowActive = w.rainbowTrailTimer > 0;

    // 1. Shift existing points back with scroll speed
    const dx = w.scrollSpeed * dt;
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i]!;
      p.x -= dx;
      p.age += dt;
      if (p.x < -15 || p.age > (isRainbowActive ? 2.5 : 0.8)) {
        this.points.splice(i, 1);
      }
    }

    // Add new position
    if (w.bird.alive) {
      this.points.unshift({ x: BIRD_X, y: w.bird.y, age: 0 });
      if (this.points.length > this.maxPoints) {
        this.points.pop();
      }
    }

    // Update Ribbon Geometry
    const ribbonHalfWidth = isRainbowActive ? 0.18 : 0.08;
    const rainbowColors = [
      [1.0, 0.0, 0.4], // Red/Pink
      [1.0, 0.5, 0.0], // Orange
      [1.0, 0.9, 0.0], // Yellow
      [0.0, 1.0, 0.4], // Green
      [0.0, 0.8, 1.0], // Cyan
      [0.5, 0.0, 1.0], // Purple
    ];

    for (let i = 0; i < this.maxPoints; i++) {
      const idx = i * 6;
      if (i < this.points.length) {
        const p = this.points[i]!;
        const frac = i / Math.max(1, this.points.length - 1);
        const wWidth = ribbonHalfWidth * (1 - frac * 0.7);

        // Top vertex (Z = +wWidth)
        this.ribbonPositions[idx] = p.x;
        this.ribbonPositions[idx + 1] = p.y + wWidth;
        this.ribbonPositions[idx + 2] = 0;

        // Bottom vertex (Z = -wWidth)
        this.ribbonPositions[idx + 3] = p.x;
        this.ribbonPositions[idx + 4] = p.y - wWidth;
        this.ribbonPositions[idx + 5] = 0;

        // Rainbow color cycle
        let r = 1, g = 1, b = 1;
        if (isRainbowActive) {
          const cIdx = Math.floor(((totalTime * 3 + i * 0.15) % rainbowColors.length));
          const col = rainbowColors[cIdx] || [1, 1, 1];
          r = col[0]! * (1 - frac * 0.4);
          g = col[1]! * (1 - frac * 0.4);
          b = col[2]! * (1 - frac * 0.4);
        } else {
          // Subtle soft white-cyan
          r = 0.4 * (1 - frac);
          g = 0.9 * (1 - frac);
          b = 1.0 * (1 - frac);
        }

        this.ribbonColors[idx] = r;
        this.ribbonColors[idx + 1] = g;
        this.ribbonColors[idx + 2] = b;

        this.ribbonColors[idx + 3] = r;
        this.ribbonColors[idx + 4] = g;
        this.ribbonColors[idx + 5] = b;
      } else {
        // Degenerate zero vertices
        this.ribbonPositions[idx] = 0;
        this.ribbonPositions[idx + 1] = 0;
        this.ribbonPositions[idx + 2] = 0;
        this.ribbonPositions[idx + 3] = 0;
        this.ribbonPositions[idx + 4] = 0;
        this.ribbonPositions[idx + 5] = 0;
      }
    }

    this.ribbonGeo.attributes.position!.needsUpdate = true;
    this.ribbonGeo.attributes.color!.needsUpdate = true;
    this.ribbonMesh.visible = this.points.length > 2;

    // 2. Forward Trajectory Preview (Active when rainbow trail is active)
    if (isRainbowActive && w.bird.alive) {
      this.forwardGroup.visible = true;
      let simY = w.bird.y;
      let simVy = Math.max(w.bird.vy, FLAP_VELOCITY * 0.7); // predict upcoming arc
      const simDt = DT * 3;

      for (let i = 0; i < this.forwardDots.length; i++) {
        const dot = this.forwardDots[i]!;
        dot.visible = true;
        simVy += GRAVITY * simDt;
        simY += simVy * simDt;
        const simX = BIRD_X + (i + 1) * (w.scrollSpeed * simDt);
        dot.position.set(simX, simY, 0);

        const scale = 1 - (i / this.forwardDots.length) * 0.5;
        dot.scale.set(scale, scale, scale);
      }
    } else {
      this.forwardGroup.visible = false;
    }

    // 3. Shield Bubble
    if (w.hasShield && w.bird.alive) {
      this.shieldMesh.visible = true;
      this.shieldMesh.position.y = w.bird.y;
      this.shieldMesh.rotation.y = totalTime * 2;
      this.shieldMesh.rotation.x = Math.sin(totalTime * 3) * 0.2;
      this.shieldMat.emissiveIntensity = 0.4 + Math.sin(totalTime * 6) * 0.25;
    } else {
      this.shieldMesh.visible = false;
    }
  }
}
