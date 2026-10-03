import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { mapScene, resolveComponentId } from "../src/viewer/assets";
import { COMPONENT_IDS } from "../src/data/components";
import { libraryMaterialFor } from "../src/viewer/materials";

const known = new Set(COMPONENT_IDS);

describe("GLB object → component mapping", () => {
  it("prefers the atlas_id custom property", () => {
    const o = new THREE.Object3D();
    o.name = "Cube.004";
    o.userData.atlas_id = "battery";
    expect(resolveComponentId(o, known)).toBe("battery");
  });

  it("accepts Blender names, including duplicate suffixes", () => {
    const o = new THREE.Object3D();
    o.name = "radiator001"; // what GLTFLoader makes of "radiator.001"
    o.userData.name = "radiator.001"; // the original Blender name
    expect(resolveComponentId(o, known)).toBe("radiator");
    const p = new THREE.Object3D();
    p.name = "Front-Wheels";
    expect(resolveComponentId(p, known)).toBe("front-wheels");
  });

  it("returns null for names that are not component IDs", () => {
    const o = new THREE.Object3D();
    o.name = "Cube";
    expect(resolveComponentId(o, known)).toBeNull();
  });

  it("maps the top-most match, reports duplicates and unmapped objects", () => {
    const scene = new THREE.Group();
    const wrapper = new THREE.Group();
    wrapper.name = "YarisAtlas";
    scene.add(wrapper);
    const battery = new THREE.Group();
    battery.name = "battery";
    const inner = new THREE.Mesh();
    inner.name = "radiator"; // nested inside battery: belongs to battery, not mapped separately
    battery.add(inner);
    const dup = new THREE.Mesh();
    dup.userData.name = "battery.001";
    dup.name = "battery001";
    const stray = new THREE.Mesh();
    stray.name = "Camera_helper";
    wrapper.add(battery, dup, stray);

    const r = mapScene(scene, known);
    expect([...r.mapped.keys()]).toEqual(["battery"]);
    expect(r.mapped.get("battery")).toBe(battery);
    expect(r.duplicates).toEqual(["battery"]);
    expect(r.unmapped).toEqual(["Camera_helper"]);
  });
});

describe("material convention", () => {
  it("swaps atlas-<name> materials for the built-in library", () => {
    const m = new THREE.MeshStandardMaterial({ color: "red" });
    m.name = "atlas-paint-silver.001";
    const lib = libraryMaterialFor(m) as THREE.MeshStandardMaterial;
    expect(lib).not.toBeNull();
    expect(lib.name).toBe("atlas-paint-silver");
    const other = new THREE.MeshStandardMaterial();
    other.name = "MyTexturedPaint";
    expect(libraryMaterialFor(other)).toBeNull();
  });
});
