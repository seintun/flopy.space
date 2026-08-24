import * as THREE from "three";

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  update: (dt: number, birdY: number) => void;
  kick: (amount: number) => void;
  onResize: (aspect: number) => void;
}

export function createCameraRig(getAspect: () => number): CameraRig {
  const camera = new THREE.PerspectiveCamera(74, getAspect(), 0.1, 100);
  let currentY = 1.5;
  let targetY = 1.5;
  let currentLookY = 0.75;
  let fovKickAmt = 0;

  const getBaseFov = (aspect: number) => (aspect < 1 ? 74 : 60);

  const update = (dt: number, birdY: number) => {
    targetY = birdY;
    const k = 1 - Math.exp(-5 * dt);
    currentY += (targetY - currentY) * k;

    // smooth lookAt
    const targetLookY = birdY * 0.5;
    currentLookY += (targetLookY - currentLookY) * k;

    // camera offset: (6, birdY * 0.35 + 3.2, 11)
    camera.position.set(6, currentY * 0.35 + 3.2, 11);
    camera.lookAt(0, currentLookY, 0);

    // FOV decay
    if (fovKickAmt > 0.001) {
      fovKickAmt *= Math.exp(-6 * dt);
    } else {
      fovKickAmt = 0;
    }
    const aspect = getAspect();
    camera.aspect = aspect;
    camera.fov = getBaseFov(aspect) + fovKickAmt;
    camera.updateProjectionMatrix();
  };

  const kick = (amount: number) => {
    fovKickAmt = Math.min(15, fovKickAmt + amount);
  };

  const onResize = (aspect: number) => {
    camera.aspect = aspect;
    camera.fov = getBaseFov(aspect) + fovKickAmt;
    camera.updateProjectionMatrix();
  };

  return { camera, update, kick, onResize };
}
