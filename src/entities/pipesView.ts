import * as THREE from "three";
import { GROUND_Y, PIPE_RADIUS } from "../core/constants";
import type { World } from "../core/types";

interface PooledPipe {
  group: THREE.Group;
  lowerCyl: THREE.Mesh;
  upperCyl: THREE.Mesh;
  lowerLip: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerMat: THREE.MeshStandardMaterial;
  upperMat: THREE.MeshStandardMaterial;
  lipMat: THREE.MeshStandardMaterial;
  pipeId: number;
  flashTimer: number;
}

export class PipesView {
  private pool: PooledPipe[] = [];
  private group: THREE.Group;
  private pipeCylGeo: THREE.CylinderGeometry;
  private pipeLipGeo: THREE.CylinderGeometry;

  constructor(scene: THREE.Scene, poolSize = 8) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Reusable geometries
    this.pipeCylGeo = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, 1, 16);
    this.pipeLipGeo = new THREE.CylinderGeometry(PIPE_RADIUS * 1.15, PIPE_RADIUS * 1.15, 0.5, 16);

    for (let i = 0; i < poolSize; i++) {
      const pGroup = new THREE.Group();

      const lowerMat = new THREE.MeshStandardMaterial({
        color: 0x388e3c,
        roughness: 0.35,
        metalness: 0.1,
        flatShading: true,
      });
      const upperMat = new THREE.MeshStandardMaterial({
        color: 0x388e3c,
        roughness: 0.35,
        metalness: 0.1,
        flatShading: true,
      });
      const lipMat = new THREE.MeshStandardMaterial({
        color: 0x43a047,
        roughness: 0.3,
        metalness: 0.15,
        flatShading: true,
      });

      const lowerCyl = new THREE.Mesh(this.pipeCylGeo, lowerMat);
      const upperCyl = new THREE.Mesh(this.pipeCylGeo, upperMat);
      const lowerLip = new THREE.Mesh(this.pipeLipGeo, lipMat);
      const upperLip = new THREE.Mesh(this.pipeLipGeo, lipMat);

      pGroup.add(lowerCyl);
      pGroup.add(upperCyl);
      pGroup.add(lowerLip);
      pGroup.add(upperLip);

      pGroup.visible = false;
      this.group.add(pGroup);

      this.pool.push({
        group: pGroup,
        lowerCyl,
        upperCyl,
        lowerLip,
        upperLip,
        lowerMat,
        upperMat,
        lipMat,
        pipeId: -1,
        flashTimer: 0,
      });
    }
  }

  private emissiveHex = 0x66ff66;

  setBiomeTheme(pipeHex: number, lipHex: number, emissiveHex: number): void {
    this.emissiveHex = emissiveHex;
    for (const p of this.pool) {
      p.lowerMat.color.setHex(pipeHex);
      p.upperMat.color.setHex(pipeHex);
      p.lipMat.color.setHex(lipHex);
    }
  }

  flash(pipeId: number): void {
    const item = this.pool.find((p) => p.pipeId === pipeId);
    if (item) item.flashTimer = 0.25;
  }

  syncFrom(w: World, alpha: number, dt: number): void {
    void alpha;
    const activePipes = w.pipes;

    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i]!;
      if (i < activePipes.length) {
        const p = activePipes[i]!;
        item.group.visible = true;
        item.pipeId = p.id;
        item.group.position.x = p.x;
        item.group.position.z = 0;

        const gapBot = p.gapCenter - p.gapHeight / 2;
        const gapTop = p.gapCenter + p.gapHeight / 2;

        // Lower pipe: from GROUND_Y to gapBot
        const lowerH = Math.max(0.1, gapBot - GROUND_Y);
        item.lowerCyl.scale.set(1, lowerH, 1);
        item.lowerCyl.position.y = GROUND_Y + lowerH / 2;

        // Lower lip
        item.lowerLip.position.y = gapBot - 0.25;

        // Upper pipe: from gapTop to gapTop + 20
        const upperH = 20;
        item.upperCyl.scale.set(1, upperH, 1);
        item.upperCyl.position.y = gapTop + upperH / 2;

        // Upper lip
        item.upperLip.position.y = gapTop + 0.25;

        // Flash decay
        if (item.flashTimer > 0) {
          item.flashTimer -= dt;
          const flashAmt = Math.max(0, item.flashTimer / 0.25);
          item.lowerMat.emissive.setHex(this.emissiveHex);
          item.lowerMat.emissiveIntensity = flashAmt * 1.5;
          item.upperMat.emissive.setHex(this.emissiveHex);
          item.upperMat.emissiveIntensity = flashAmt * 1.5;
          item.lipMat.emissive.setHex(this.emissiveHex);
          item.lipMat.emissiveIntensity = flashAmt * 2.0;
        } else {
          item.lowerMat.emissiveIntensity = 0;
          item.upperMat.emissiveIntensity = 0;
          item.lipMat.emissiveIntensity = 0;
        }
      } else {
        item.group.visible = false;
        item.pipeId = -1;
      }
    }
  }
}
