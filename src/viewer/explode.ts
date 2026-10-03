import type { Vec3 } from "../data/types";

/**
 * Exploded-view maths, kept free of three.js so it can be unit-tested.
 *
 * The rule that prevents drift: an exploded position is ALWAYS computed from the
 * assembled ("home") position — never by adding to the current position.
 *
 *   position = home + dir × spread × amount
 *
 * so amount = 0 returns exactly `home`, whatever happened before.
 */

/** Explode centre in vehicle coordinates: roughly the middle of the car at hip height. */
export const EXPLODE_CENTRE: Vec3 = [0, 0.55, 0.15];

const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const norm = (v: Vec3): Vec3 => {
  const l = len(v);
  return l < 1e-9 ? [0, 1, 0] : [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Direction a unit moves when exploded: its radial direction away from the centre, blended
 * with its system's fan direction so systems separate as groups. An explicit override wins;
 * overrides are written for the car's left side and mirrored for right-side (−X) units.
 */
export function explodeDirection(unitCentre: Vec3, fan: Vec3, override?: Vec3, centre: Vec3 = EXPLODE_CENTRE): Vec3 {
  if (override) {
    const mirrored: Vec3 = unitCentre[0] < 0 ? [-override[0], override[1], override[2]] : override;
    return norm(mirrored);
  }
  const r: Vec3 = [(unitCentre[0] - centre[0]) * 1.4, (unitCentre[1] - centre[1]) * 0.8, unitCentre[2] - centre[2]];
  const radial = norm(r);
  const fanLen = len(fan);
  if (fanLen < 1e-9) return radial;
  const f = norm(fan);
  return norm([radial[0] + f[0] * 0.9, radial[1] + f[1] * 0.9, radial[2] + f[2] * 0.9]);
}

/** How far (metres) a unit travels at full explode. */
export function explodeSpread(unitCentre: Vec3, systemSpread: number, override?: number, centre: Vec3 = EXPLODE_CENTRE): number {
  if (override !== undefined) return override;
  const d = Math.hypot(unitCentre[0] - centre[0], unitCentre[1] - centre[1], unitCentre[2] - centre[2]);
  return (0.32 + 0.42 * d) * systemSpread;
}

export function explodedPosition(home: Vec3, dir: Vec3, spread: number, amount: number): Vec3 {
  const k = spread * amount;
  return [home[0] + dir[0] * k, home[1] + dir[1] * k, home[2] + dir[2] * k];
}

/** Slider position (0..1) → explode amount. Eased so the first part of the travel is finer. */
export function sliderToAmount(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return Math.pow(c, 1.4);
}

/**
 * Smoothly approach a target amount. Snaps exactly onto the target when close, so that a
 * restore to 0 lands precisely on the assembled positions.
 */
export function approach(current: number, target: number, dtSeconds: number, rate = 9): number {
  const next = current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dtSeconds)));
  return Math.abs(target - next) < 5e-4 ? target : next;
}
