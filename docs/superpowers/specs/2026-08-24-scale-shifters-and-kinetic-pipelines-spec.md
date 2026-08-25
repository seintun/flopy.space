# FLOPY.SPACE: Scale Shifters & Kinetic Pipelines Spec

> **Design & Implementation Specification for Hitbox Scaling Orbs and 120Hz Deterministic Moving Obstacles**
> **Date**: 2026-08-24
> **Status**: Implemented & Verified

---

## 1. Overview & Gameplay Intent

This specification formalizes two interconnected gameplay systems designed to escalate thrills, risk/reward wagers, and agility skill ceilings in FLOPY.SPACE:

1. **Scale Shifters**:
   - **🐥 Chibi Nano Orb**: Shrinks hero hitbox by $45\%$ ($r = 0.210\text{m}$) for micro agility through tight gaps.
   - **🐡 Chubby Chonker Orb**: Inflates hero hitbox by $+35\%$ ($r = 0.516\text{m}$) with a $1.70\times$ visual mesh ($30\%$ visual fluff buffer), awarding $+3\times$ Coins and $+3$ bonus score per pipe passed.
2. **Kinetic Pipelines**:
   - **Sine Bobbers**: Harmonic vertical oscillation of pipe pairs ($A \le 1.2\text{m}, \omega \le 2.0\text{ rad/s}$).
   - **Accordion Gaps**: Dynamic gap dilation with guaranteed safety invariant ($\ge 3.1\text{ units}$).
   - **4D Time Determinism**: State evaluated strictly as a function of integer world tick ($t = \text{tick} \times \text{DT}$), guaranteeing 100% bit-accurate 4D snapshot rewind reproduction.

---

## 2. Mathematical Formulations & Safety Invariants

### 2.1 Dynamic Hitbox Math
```typescript
export function getEffectiveHitboxRadius(w: World): number {
  if (w.chibiTimer > 0) return HITBOX_RADIUS * CHIBI_HITBOX_MULT; // 0.3825 * 0.55 = 0.210375
  if (w.chubbyTimer > 0) return HITBOX_RADIUS * CHUBBY_HITBOX_MULT; // 0.3825 * 1.35 = 0.516375
  return HITBOX_RADIUS;
}
```

### 2.2 Guaranteed Clearance on Hardest Difficulty
Given $\text{GAP\_MIN} = 2.85\text{ units}$:
$$\text{Clearance}_{\text{chubby}} = 2.85 - (2 \times 0.516) = 1.818\text{ units of vertical leeway}$$
$$\text{Leeway Margin} = \pm 0.909\text{ units above/below gap center}$$

This mathematically guarantees that even on peak difficulty, a Chubby hero has more than twice the single-flap impulse arc ($\Delta y_{\text{flap}} \approx 0.45\text{ units}$) to safely navigate any opening.

### 2.3 Anti-Fat-Trap Grace Invariant
When collecting a Chubby orb:
```typescript
w.bird.invulnUntilTick = Math.max(w.bird.invulnUntilTick, w.tick + CHUBBY_EXPANSION_GRACE_TICKS); // 60 ticks = 0.5s
```
Prevents unfair instant collisions when expanding right at the entrance of a pipe mouth.

---

## 3. Kinetic Pipeline Kinematics

Pipe transformations at tick $t = \text{tick} \times \text{DT}$:

$$\begin{aligned}
y_{\text{gap}}(t) &= \text{clamp}\left(y_{\text{base}} + A \sin(\omega t + \phi), \text{lo}(h), \text{hi}(h)\right) \\
h_{\text{gap}}(t) &= \max\left(3.1, h_{\text{base}} + A \sin(\omega t + \phi)\right)
\end{aligned}$$

Because $t$ is computed from `w.tick` and not wall-clock `Date.now()`, calling `SnapshotBuffer.rewindInto(w)` restores the exact historical state of all pipes seamlessly.

---

## 4. Visual, HUD & Audio Feedback

1. **Three.js Mesh Scaling**: `CharacterView.syncFrom` dynamically interpolates `charGroup.scale` to target scale ($0.45\times$ vs $1.70\times$) with flap squash/stretch animation.
2. **Camera Pullback**: `CameraRig.update` pulls camera back $+1.5\text{ Z}$ during Chubby mode to preserve clear forward sightlines down the pipe tunnel.
3. **HUD Active Badges**: Dedicated badges for `🐥 CHIBI` and `🐡 CHUBBY 3X` with real-time second countdowns.
4. **3D Pickup VFX**:
   - Chibi: Spinning mint octahedron with orbiting cyan ring (`#55ff99`).
   - Chubby: Pulsating pink dodecahedron with gold outer torus (`#ff66cc`).

---

## 5. Test Matrix & Verification Receipts

- `src/core/collision.test.ts`: Verified Chibi micro clearance and Chubby tolerance.
- `src/core/powerups.test.ts`: Verified 10 powerup types, timers, and scale helper functions.
- `src/core/scoring.test.ts`: Verified $+3\times$ coin and $+3$ bonus score wager multipliers.
- `src/core/spawner.test.ts`: Verified moving pipe spawn rates and fair minimum gap invariants ($\ge 3.09$).
- `src/core/snapshots.test.ts`: Verified 4D time rewind determinism with active moving pipes and scale timers.
