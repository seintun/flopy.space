import * as THREE from "three";
import type { PaletteOut } from "../core/palette";

export class SkyDome {
  group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private starPoints: THREE.Points;
  private sunMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // Inverted gradient dome
    const domeGeo = new THREE.SphereGeometry(55, 32, 16);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        cTop: { value: new THREE.Color(0x2c3e6b) },
        cBot: { value: new THREE.Color(0xffb347) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 cTop;
        uniform vec3 cBot;
        void main() {
          float h = normalize(vPos).y * 0.5 + 0.5;
          gl_FragColor = vec4(mix(cBot, cTop, pow(clamp(h, 0.0, 1.0), 0.8)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(domeGeo, this.material);
    this.group.add(dome);

    // Stars
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.1); // upper hemisphere
      const r = 54;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.group.add(this.starPoints);

    // Celestial body (Sun/Moon)
    const sunGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.group.add(this.sunMesh);
  }

  update(p: PaletteOut, dirLight?: THREE.DirectionalLight, fog?: THREE.Fog): void {
    (this.material.uniforms.cTop!.value as THREE.Color).setHex(p.skyTop);
    (this.material.uniforms.cBot!.value as THREE.Color).setHex(p.skyBottom);
    (this.starPoints.material as THREE.PointsMaterial).opacity = p.starAlpha;

    // Position sun on circle radius 50 in X-Y plane
    const sunR = 50;
    const sunX = Math.cos(p.sunAngle) * sunR;
    const sunY = Math.sin(p.sunAngle) * sunR;
    const sunZ = -10;
    this.sunMesh.position.set(sunX, sunY, sunZ);

    if (dirLight) {
      dirLight.position.set(sunX * 0.5 + 5, Math.max(5, sunY * 0.5 + 10), 15);
      const isNight = p.starAlpha > 0.6;
      dirLight.intensity = isNight ? 0.35 : 1.2;
      dirLight.color.setHex(isNight ? 0x90a0d0 : 0xffffff);
    }

    if (fog) {
      fog.color.setHex(p.fogColor);
    }
  }
}
