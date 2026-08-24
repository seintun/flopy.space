import { describe, it, expect } from "vitest";
import { createCameraRig } from "./camera";

describe("CameraRig Mobile Responsiveness", () => {
  it("adapts FOV and camera position for narrow portrait mobile screens (aspect < 1.0)", () => {
    let aspect = 0.46; // iPhone 14 portrait (390 x 844)
    const rig = createCameraRig(() => aspect);

    rig.update(0.016, 1.5);
    expect(rig.camera.fov).toBeGreaterThanOrEqual(78);
    expect(rig.camera.position.z).toBeGreaterThan(14); // pulled back for runway visibility
    expect(rig.camera.position.x).toBeGreaterThan(6.5);

    // Landscape tablet / desktop (16:9)
    aspect = 1.77;
    rig.onResize(aspect);
    rig.update(0.016, 1.5);
    expect(rig.camera.fov).toBe(60);
    expect(rig.camera.position.z).toBeCloseTo(11, 0.1);
  });
});
