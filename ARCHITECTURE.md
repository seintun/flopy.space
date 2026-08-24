# FLOPY.SPACE Architecture & Systems Specification 🪐📐

> **Comprehensive architectural documentation for FLOPY.SPACE — A deterministic 3D arcade flyer with 4D time manipulation, WebGL rendering, and procedural WebAudio.**

---

## 1. System Overview

FLOPY.SPACE is designed with strict **unidirectional data flow** and a clean separation between the headless deterministic physics simulation, the Three.js 3D rendering pipeline, procedural WebAudio sound synthesizer, and the responsive DOM interface.

```mermaid
flowchart TD
    subgraph Core ["Deterministic Core (Headless Engine)"]
        Physics["Physics & Gravity (120Hz Tick)"]
        Collision["Sphere vs AABB Collision Engine"]
        Spawner["Deterministic Spawner (Wander Algorithm)"]
        TimeSys["TimeSystem (Dilation Scale)"]
        SnapBuffer["Zero-Alloc SnapshotBuffer (180-Tick Ring)"]
        Scoring["Combo Escalator & Near-Miss Detection"]
        Storage["LocalStorage Ledger & Meta Progression"]
    end

    subgraph Render ["Three.js 3D Visual Pipeline"]
        SceneCtx["Scene Context & Volumetric Fog"]
        CameraRig["Dynamic Aspect FOV Camera Rig"]
        CharView["Solid Mesh Character & Wing Springs"]
        PipesView["Instanced Buffer Pipe Geometry"]
        BiomeVfx["Atmospheric Silhouette Systems"]
        SkyDome["Vertex-Gradient Day/Night Sky Dome"]
    end

    subgraph UI ["Interface & Audio Synthesis"]
        HUD["HUD Energy Meters & Score Counters"]
        Menu["MenuView & Drag-Scroll Carousels"]
        GameOver["In-Situ Progression & Quick-Swap Card"]
        Audio["Procedural WebAudio Synthesizer"]
        PWA["Service Worker & Offline Cache Storage"]
    end

    Core --> Render
    Core --> UI
    PWA -.-> Core
    PWA -.-> Render
    PWA -.-> UI
```

---

## 2. Core Simulation & Physics (120Hz Tick)

### 2.1 Fixed-Timestep Accumulator
The core simulation runs at a fixed $120\text{Hz}$ ($\Delta t = 8.33\text{ms}$) physics timestep:

$$\Delta t_{\text{fixed}} = \frac{1}{120} \approx 0.008333\text{s}$$

When the browser renders frames at variable delta times ($60\text{Hz}$, $90\text{Hz}$, $120\text{Hz}$), the accumulator consumes integer fixed ticks. This guarantees:
1. Exact cross-device determinism.
2. Identical jump trajectories and collision precision regardless of device refresh rate.
3. Perfect replay fidelity during 4D time rewind.

### 2.2 Collision Math: Sphere vs AABB
- **Hero Hitbox**: Modeled as a sphere at center $(x_b, y_b, z_b)$ with radius $r = 0.28\text{m}$.
- **Pipe Hitbox**: Modeled as two 3D Axis-Aligned Bounding Boxes (AABBs): Top pipe and Bottom pipe.
- **Distance Formula**: Clamps sphere center to box bounds $(x_{\text{clamp}}, y_{\text{clamp}}, z_{\text{clamp}})$:

$$d^2 = (x_b - x_{\text{clamp}})^2 + (y_b - y_{\text{clamp}})^2 + (z_b - z_{\text{clamp}})^2$$

$$\text{Collision} \iff d^2 \le r^2$$

---

## 3. 4D Time Mechanics & Zero-Allocation Ring Buffer

### 3.1 Snapshot Ring Buffer (`SnapshotBuffer`)
To allow players to rewind death by $1.5\text{s}$ ($180$ ticks), world states are continuously recorded into a preallocated circular ring buffer.

```mermaid
graph LR
    subgraph RingBuffer ["Preallocated 180-Slot World Buffer"]
        S0["Slot 0"] --> S1["Slot 1"] --> S2["Slot 2"] --> Sdots["..."] --> S179["Slot 179"]
        S179 --> S0
    end
    Head["Head Pointer (In-Place Deep Copy)"] -.-> RingBuffer
```

- **Zero Garbage Collection**: Preallocates 180 static `World` structs. Scalar properties and pipe buffers are mutated in-place with $0$ heap allocations per tick.
- **Safe Runway Algorithm**: Scans back $\approx 1.5\text{s}$ in the past to find a snapshot where the hero has cleared the previous obstacle and has ample forward runway ($\text{pipe.x} \ge 3.2\text{m}$) before resuming.

---

## 4. WebGL Rendering & Performance Architecture

### 4.1 Responsive Camera Rig (`CameraRig`)
The camera dynamically adjusts FOV and $Z$-distance based on the mobile device aspect ratio ($w / h$):

- **Portrait Screens ($9:16$, $9:19.5$)**: Widens vertical FOV and shifts back in $Z$ ($z \approx 13.5\text{m}$) so upcoming obstacles on the right are framed with generous reaction sightlines.
- **Landscape / Desktop**: Frames the horizontal band smoothly at $z \approx 10.5\text{m}$.

### 4.2 Zero-Allocation Render Loop
- **Static Projection Vectors**: Preallocated module-level `_worldPopupVec` and `_tempVec` avoid per-frame `new THREE.Vector3()` churn.
- **In-Place Material Updates**: Scene day/night lighting and ground colors mutate existing material properties via `.setHex()` without creating orphan shader programs.

---

## 5. Procedural WebAudio Synthesizer

FLOPY.SPACE downloads **zero audio files**. All sound effects and musical chords are synthesized in real-time via the WebAudio API:

| Sound Effect | Synthesis Technique | Frequency / Waveform |
| :--- | :--- | :--- |
| **Flap** | Bandpass filtered noise burst + pitch envelope | Sine sweep $180\text{Hz} \to 80\text{Hz}$ |
| **Score Chimes** | Additive dual-sine chime with exponential decay | $E_5, G^\sharp_5, B_5, E_6$ chord notes |
| **Death Crunch** | Distortion overdrive + low-frequency square thump | $120\text{Hz} \to 30\text{Hz}$ with noise |
| **Rewind Whoosh** | Reverse frequency sweep with resonant bandpass | $80\text{Hz} \to 880\text{Hz}$ reverse envelope |
| **Slow-Mo Orb** | Shimmering FM synth bells with detuned oscillators | $440\text{Hz} / 884\text{Hz}$ frequency modulation |

---

## 6. Offline PWA & Service Worker Caching

```mermaid
flowchart TD
    Req["Browser Resource Request"] --> SW{"Service Worker Active?"}
    SW -- "Yes" --> Match{"In Cache Storage?"}
    Match -- "Hit (Cache-First)" --> ReturnCached["Return Cached Asset (0ms)"]
    Match -- "Miss" --> FetchNet["Fetch from Network"]
    FetchNet --> PutCache["Store Copy in Cache"]
    PutCache --> ReturnNet["Serve Asset"]
    SW -- "No" --> FetchNet
```

- **Precached Core**: `index.html`, `manifest.webmanifest`, `icon.svg`, and hashed Vite bundles.
- **Font Caching**: Cache-first for Google WebFonts (`.woff2`) and stale-while-revalidate for stylesheets.
- **Native Installation**: Intercepts `beforeinstallprompt` on Android Chromium and provides custom Add-to-Home-Screen instructions on iOS Safari.
