import * as THREE from "three";

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  update: (dt: number, birdY: number) => void;
  kick: (amount: number) => void;
  onResize: (aspect: number) => void;
}

export function createCameraRig(getAspect: () => number): CameraRig {
  const camera = new THREE.PerspectiveCamera(70, getAspect(), 0.1, 100);
  let currentY = 1.5;
  let targetY = 1.5;
  let currentLookY = 0.75;
  let fovKickAmt = 0;

  const getBaseFov = (aspect: number) => {
    // 1. Mobile Portrait (aspect < 1.0): Expands FOV and pulls back so runway matches landscape
    if (aspect < 0.6) return 78;
    if (aspect < 1.0) return 72;
    // 2. Standard Landscape (1.0 <= aspect <= 1.78): Standard 60 deg
    if (aspect <= 1.78) return 60;
    // 3. Anti-Cheat / Fair Play: Ultrawide Landscape (aspect > 1.78, e.g. 21:9, 32:9, multi-monitor)
    // Clamps the horizontal vision angle so ultrawide players cannot see extra pipes ahead!
    const targetHdeg = 92; // fixed maximum horizontal field
    const clampedVdeg = 2 * Math.atan(Math.tan((targetHdeg * Math.PI) / 360) / aspect) * (180 / Math.PI);
    return Math.min(60, Math.max(30, clampedVdeg));
  };

  const update = (dt: number, birdY: number) => {
    targetY = birdY;
    const k = 1 - Math.exp(-5 * dt);
    currentY += (targetY - currentY) * k;

    // smooth lookAt
    const targetLookY = birdY * 0.5;
    currentLookY += (targetLookY - currentLookY) * k;

    const aspect = getAspect();

    // Responsive camera position:
    // In portrait mobile (aspect < 1.0), pull camera back in Z and shift X ahead so runway is clearly visible
    const portraitFactor = Math.max(0, Math.min(1, (1.0 - aspect) / 0.6));
    const camX = 6 + portraitFactor * 1.8;
    const camY = currentY * 0.35 + 3.2 + portraitFactor * 0.9;
    const camZ = 11 + portraitFactor * 4.8;

    const lookX = portraitFactor * 2.8;
    const lookY = currentLookY + portraitFactor * 0.3;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookX, lookY, 0);

    // FOV decay
    if (fovKickAmt > 0.001) {
      fovKickAmt *= Math.exp(-6 * dt);
    } else {
      fovKickAmt = 0;
    }

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
