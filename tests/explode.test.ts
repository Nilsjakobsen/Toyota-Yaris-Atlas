import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { approach, explodeDirection, explodedPosition, explodeSpread, sliderToAmount } from "../src/viewer/explode";
import { buildPlaceholderObjects } from "../src/viewer/placeholders";
import { COMPONENTS, COMPONENT_IDS } from "../src/data/components";
import type { Vec3 } from "../src/data/types";

describe("explode maths", () => {
  it("returns exactly home at amount 0", () => {
    const home: Vec3 = [0.123456789, 0.5, -1.25];
    expect(explodedPosition(home, [0.3, 0.9, 0.1], 0.8, 0)).toEqual(home);
  });

  it("does not drift over many explode/restore cycles", () => {
    const home: Vec3 = [0.48, 0.74, 1.4];
    const dir = explodeDirection(home, [0.6, 0.7, 0.15]);
    const spread = explodeSpread(home, 1);
    let amount = 0;
    let pos: Vec3 = home;
    for (let cycle = 0; cycle < 25; cycle++) {
      for (const target of [1, 0.37, 0]) {
        for (let f = 0; f < 600 && amount !== target; f++) {
          amount = approach(amount, target, 1 / 60);
          pos = explodedPosition(home, dir, spread, amount);
        }
        expect(amount).toBe(target);
      }
    }
    expect(pos).toEqual(home);
  });

  it("mirrors override directions for right-side units", () => {
    const left = explodeDirection([0.7, 0.3, 1.1], [0, 0, 0], [1, 0.1, 0]);
    const right = explodeDirection([-0.7, 0.3, 1.1], [0, 0, 0], [1, 0.1, 0]);
    expect(left[0]).toBeGreaterThan(0);
    expect(right[0]).toBeCloseTo(-left[0], 12);
    expect(right[1]).toBeCloseTo(left[1], 12);
  });

  it("produces unit-length directions", () => {
    for (const c of [[0, 0.55, 0.15], [1, 2, 3], [-0.5, 0.1, -1.8]] as Vec3[]) {
      const d = explodeDirection(c, [0, 1, 0.25]);
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
    }
  });

  it("eases the slider monotonically from 0 to 1", () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const a = sliderToAmount(i / 100);
      expect(a).toBeGreaterThan(prev);
      prev = a;
    }
    expect(sliderToAmount(0)).toBe(0);
    expect(sliderToAmount(1)).toBe(1);
    expect(sliderToAmount(2)).toBe(1);
  });
});

describe("placeholder model", () => {
  const objs = buildPlaceholderObjects(COMPONENT_IDS);

  it("builds one named object per component, tagged with its atlas_id", () => {
    expect([...objs.keys()].sort()).toEqual([...COMPONENT_IDS].sort());
    for (const [id, o] of objs) {
      expect(o.name).toBe(id);
      expect(o.userData.atlas_id).toBe(id);
      let meshes = 0;
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshes++;
      });
      expect(meshes, id).toBeGreaterThan(0);
    }
  });

  it("splits sided components into _L (+X) and _R (−X) explode units", () => {
    for (const c of COMPONENTS.filter((c) => c.sides)) {
      const o = objs.get(c.id)!;
      const names = o.children.map((ch) => ch.name).sort();
      expect(names).toEqual([`${c.id}_L`, `${c.id}_R`]);
      const l = o.getObjectByName(`${c.id}_L`)!;
      const r = o.getObjectByName(`${c.id}_R`)!;
      expect(l.position.x).toBeGreaterThan(0);
      expect(r.position.x).toBeCloseTo(-l.position.x, 9);
    }
  });

  it("fits the registered length and width", () => {
    const box = new THREE.Box3();
    for (const o of objs.values()) {
      o.updateMatrixWorld(true);
      box.expandByObject(o, true); // precise: rotated parts would otherwise inflate the box
    }
    const size = box.getSize(new THREE.Vector3());
    // Mirrors and wheels may protrude slightly beyond the body width, as on the real car.
    expect(size.z).toBeGreaterThan(3.78);
    expect(size.z).toBeLessThan(3.84);
    expect(size.x).toBeGreaterThan(1.68);
    expect(size.x).toBeLessThan(1.86);
    expect(box.min.y).toBeGreaterThanOrEqual(-1e-6); // nothing below the ground
    expect(size.y).toBeLessThan(1.6);
  });
});
