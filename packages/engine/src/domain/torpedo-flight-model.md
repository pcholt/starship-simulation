# Torpedo flight model

Reference table for the numbers implemented in `torpedo.ts` and the `FireTorpedo`/`tick` handling
in `engine.ts`. Not derived from the book — a simplification invented for this project.

| Parameter | Rule |
|---|---|
| Launch position | Firing ship's current position |
| Launch heading | Firing ship's current heading (`xyAngleDeg`/`xzAngleDeg`) |
| Launch speed | Firing ship's current `warpSpeed` + 2 |
| Speed ramp | Linear, from launch speed to warp 18, over the first 2 seconds of flight |
| Steady speed (pre-miss) | Warp 18, held until it hits |
| Turn rate | `turnRateDegPerSecond(torpedo speed) × 2` — homes in on the target's current position every tick |
| Hit check | Each tick, if within `TORPEDO_HIT_RADIUS` of target |
| Hit chance | 100% if target `speed` ≤ warp 5; 50% (coin flip) if target `speed` > warp 5 |
| Post-miss speed: target behind | Warp 2 (angle between torpedo heading and bearing-to-target > 90°) |
| Post-miss speed: target ≤5° ahead | Warp 18 |
| Post-miss speed: otherwise | Warp 5 |
| Fuel | Starts at 10 units |
| Fuel burn | `0.1 × current warp speed` per second |
| Fuel exhausted | Torpedo explodes in place (no direct hit, splash only) |
| Direct-hit damage | `computeTorpedoDamage(targetShield)` to the target |
| Splash damage | Half of `computeTorpedoDamage(targetShield)` to any other craft within `TORPEDO_SPLASH_RADIUS` (3 units) of the explosion point |
