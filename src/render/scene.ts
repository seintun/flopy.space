import * as THREE from "three";
import { GROUND_Y } from "../core/constants";
import { BiomeVfx } from "./biomeVfx";

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  dirLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  ground: THREE.Mesh;
  fog: THREE.Fog;
  biomeVfx: BiomeVfx;
  setSize: (w: number, h: number) => void;
  setBiomeGround: (groundHex: number, gridHex?: number) => void;
}

export function createScene(container: HTMLElement, camera: THREE.PerspectiveCamera): SceneCtx {
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xd9a06b, 16, 28);
  scene.fog = fog;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c2b,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(100, 40, 0x5a8f3b, 0x5a8f3b);
  gridHelper.position.y = GROUND_Y + 0.02;
  scene.add(gridHelper);

  const biomeVfx = new BiomeVfx();
  scene.add(biomeVfx.group);

  const setSize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
  };

  const setBiomeGround = (groundHex: number, gridHex = 0x5a8f3b) => {
    (ground.material as THREE.MeshStandardMaterial).color.setHex(groundHex);
    // update grid colors without allocating new materials
    if (gridHelper && gridHelper.material) {
      (gridHelper.material as THREE.LineBasicMaterial).color.setHex(gridHex);
      (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
      (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.35;
    }
  };

  return {
    renderer,
    scene,
    camera,
    dirLight,
    hemiLight,
    ground,
    fog,
    biomeVfx,
    setSize,
    setBiomeGround,
  };
}
