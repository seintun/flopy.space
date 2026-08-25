# GEMINI.md — FLOPY.SPACE Guidelines 🪐🤖

> **Context, Standards, and Instructions for Gemini CLI, Antigravity Agents, and Developers.**

---

## Key Workflows

- **Verification**: Run `npm test` before and after modifying files. Run `npm run build` to verify type checking and Rollup chunking.
- **Fast-Path Changes**: For single-session edits, make minimal surgical changes matching existing styles.
- **Deterministic Simulation**: All gameplay physics mutations belong strictly in `src/core/` and must compute from integer `tick` or delta `dt`.
- **Zero GC in Tick**: Never allocate new objects, closures, or arrays inside `frame()`, `stepBird()`, or `SnapshotBuffer.record()`.

---

## Architecture Summary

FLOPY.SPACE is a deterministic 3D flyer with 4D time manipulation, WebGL rendering, and procedural WebAudio.

- **`src/core/`**: Headless physics, collision detection (Sphere vs AABB), spawner, token suction, scoring, 180-slot snapshot ring buffer.
- **`src/render/`**: Three.js scene, lighting, camera FOV rig, SkyDome day/night cycle, atmospheric VFX.
- **`src/entities/`**: Mesh pools for characters, pipes, orbs/hazards, and ribbon trails.
- **`src/systems/juice.ts`**: Screenshake trauma, instanced particle bursts, screen border FX.
- **`src/ui/`**: Responsive DOM overlays (HUD, MenuView shop/drawer, GameOverView progression card, uiEffects).
- **`public/sw.js`**: PWA Service Worker providing 100% offline gameplay.

For detailed system topology, resource tables, and invariants, see [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
