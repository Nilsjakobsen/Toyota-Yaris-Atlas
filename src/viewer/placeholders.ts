import * as THREE from "three";
import type { PlaceholderSpec, PrimitiveSpec, Vec3 } from "../data/types";
import { makeMaterial } from "./materials";
import { buildBodyShell } from "./bodyShell";

/**
 * Approximate placeholder geometry for every component, in metres, vehicle coordinates:
 *   +Y up · +Z forward · +X = the car's left (driver's side in Norway) · origin on the ground,
 *   centred under the car (middle of the registered 3790 mm length).
 *
 * These positions are ESTIMATES for orientation. Replace any of them by exporting a GLB
 * object with the same ID — see docs/BLENDER-GLB-WORKFLOW.md.
 */

/** Front / rear axle Z positions: 2460 mm wheelbase (secondary source); overhang split estimated. */
export const FA = 1.155;
export const RA = -1.305;
/** 185/60 R15 → 381 mm rim + 2 × 111 mm sidewall = 603 mm diameter. */
export const WR = 0.3015;
const TRACK_F = 0.73; // half-track estimates
const TRACK_R = 0.72;

const cyl = (radius: number, length: number, axis: "x" | "y" | "z", pos: Vec3, mat: string, extra: Partial<PrimitiveSpec> = {}): PrimitiveSpec =>
  ({ shape: "cylinder", radius, length, axis, pos, mat, ...extra }) as PrimitiveSpec;
const box = (size: Vec3, pos: Vec3, mat: string, extra: Partial<PrimitiveSpec> = {}): PrimitiveSpec =>
  ({ shape: "box", size, pos, mat, ...extra }) as PrimitiveSpec;
const pipe = (points: Vec3[], radius: number, mat: string, name?: string): PrimitiveSpec => ({ shape: "pipe", points, radius, mat, name });

const CYL_X = [-0.31, -0.18, -0.05, 0.08]; // four cylinder positions along the engine (estimate)

export const PLACEHOLDERS: Record<string, PlaceholderSpec> = {
  /* ---------------- engine & intake (engine centred at x −0.10, z 1.20) */
  engine: {
    parts: [
      box([0.42, 0.09, 0.28], [-0.1, 0.245, 1.2], "metal-steel", { name: "sump" }),
      box([0.5, 0.4, 0.34], [-0.1, 0.49, 1.2], "metal-aluminium", { name: "block" }),
      box([0.48, 0.12, 0.3], [-0.1, 0.75, 1.19], "metal-aluminium", { name: "head" }),
      box([0.46, 0.06, 0.26], [-0.1, 0.84, 1.19], "metal-dark", { name: "cam-cover" }),
      box([0.05, 0.52, 0.3], [-0.375, 0.58, 1.2], "metal-aluminium", { name: "timing-cover" }),
      cyl(0.065, 0.03, "x", [-0.415, 0.36, 1.26], "metal-dark", { name: "crank-pulley" }),
    ],
  },
  "air-filter": {
    parts: [
      box([0.28, 0.12, 0.14], [0.15, 0.75, 1.54], "plastic-black", { name: "housing", radius: 0.02 }),
      pipe([[0.08, 0.7, 1.5], [0.17, 0.64, 1.47], [0.18, 0.575, 1.45]], 0.03, "rubber", "duct"),
    ],
  },
  "throttle-body": {
    parts: [
      box([0.4, 0.1, 0.07], [-0.1, 0.56, 1.45], "metal-aluminium", { name: "plenum", radius: 0.02 }),
      cyl(0.035, 0.07, "x", [0.135, 0.57, 1.45], "metal-aluminium", { name: "throttle" }),
      ...CYL_X.map((x, i) => pipe([[x, 0.76, 1.345], [x, 0.73, 1.42], [x, 0.62, 1.45]], 0.019, "metal-aluminium", `runner-${i + 1}`)),
    ],
  },
  "oil-dipstick": {
    parts: [
      pipe([[0.16, 0.45, 1.33], [0.16, 0.855, 1.33]], 0.006, "metal-steel", "dipstick-tube"),
      { shape: "torus", radius: 0.02, tube: 0.006, axis: "z", pos: [0.16, 0.876, 1.33], mat: "plastic-yellow", name: "dipstick-handle" },
      cyl(0.03, 0.022, "y", [-0.25, 0.881, 1.16], "plastic-black", { name: "filler-cap" }),
    ],
  },

  /* ---------------- fuel & ignition */
  "fuel-tank": {
    parts: [
      box([0.75, 0.2, 0.42], [0.05, 0.33, -0.85], "plastic-black", { name: "tank", radius: 0.05 }),
      cyl(0.06, 0.04, "y", [0.2, 0.445, -0.85], "plastic-grey", { name: "pump-flange" }),
    ],
  },
  "fuel-injectors": {
    parts: [
      pipe([[-0.34, 0.7, 1.39], [0.12, 0.7, 1.39]], 0.011, "metal-steel", "rail"),
      ...CYL_X.map((x, i) => cyl(0.011, 0.05, "z", [x, 0.69, 1.365], "plastic-grey", { name: `injector-${i + 1}` })),
      pipe([[0.12, 0.7, 1.39], [0.26, 0.5, 1.15], [0.26, 0.2, 0.75], [0.26, 0.2, -0.55], [0.2, 0.3, -0.64]], 0.007, "metal-steel", "feed-line"),
    ],
  },
  "ignition-coils": {
    parts: CYL_X.map((x, i) => cyl(0.021, 0.085, "y", [x, 0.87, 1.19], "plastic-black", { name: `coil-${i + 1}` })),
  },
  ecu: {
    parts: [box([0.2, 0.045, 0.15], [0.05, 0.93, 0.62], "electronics-box", { name: "ecu-box" })],
  },
  "obd-port": {
    parts: [box([0.045, 0.022, 0.035], [0.42, 0.6, 0.55], "plastic-black", { name: "socket" })],
  },

  /* ---------------- cooling (radiator stack at the front) */
  radiator: {
    parts: [
      box([0.6, 0.36, 0.035], [0, 0.53, 1.7], "metal-dark", { name: "core" }),
      box([0.04, 0.38, 0.05], [0.32, 0.53, 1.7], "plastic-black", { name: "tank-left" }),
      box([0.04, 0.38, 0.05], [-0.32, 0.53, 1.7], "plastic-black", { name: "tank-right" }),
    ],
  },
  "cooling-fan": {
    parts: [
      box([0.48, 0.36, 0.02], [0, 0.53, 1.66], "plastic-black", { name: "shroud" }),
      cyl(0.16, 0.022, "z", [-0.05, 0.53, 1.645], "plastic-grey", { name: "blades" }),
      cyl(0.045, 0.05, "z", [-0.05, 0.53, 1.62], "metal-dark", { name: "motor" }),
    ],
  },
  "coolant-reservoir": {
    parts: [
      box([0.09, 0.15, 0.11], [-0.52, 0.7, 1.48], "fluid-reservoir", { name: "tank", radius: 0.015 }),
      cyl(0.025, 0.02, "y", [-0.52, 0.785, 1.48], "plastic-black", { name: "cap" }),
    ],
  },
  "coolant-hoses": {
    parts: [
      pipe([[-0.32, 0.66, 1.68], [-0.33, 0.7, 1.55], [-0.3, 0.76, 1.37]], 0.018, "rubber", "upper-hose"),
      pipe([[0.32, 0.4, 1.68], [0.28, 0.34, 1.52], [0.1, 0.36, 1.38]], 0.018, "rubber", "lower-hose"),
      pipe([[-0.5, 0.64, 1.47], [-0.4, 0.66, 1.62], [-0.33, 0.68, 1.68]], 0.008, "rubber", "reservoir-hose"),
      pipe([[-0.24, 0.66, 1.03], [-0.24, 0.7, 0.93], [-0.2, 0.74, 0.88]], 0.012, "rubber", "heater-hose-1"),
      pipe([[-0.16, 0.62, 1.03], [-0.16, 0.66, 0.93], [-0.12, 0.7, 0.88]], 0.012, "rubber", "heater-hose-2"),
    ],
  },

  /* ---------------- electrical */
  battery: {
    parts: [
      box([0.24, 0.18, 0.17], [0.48, 0.74, 1.4], "battery-case", { name: "case", radius: 0.01 }),
      cyl(0.012, 0.022, "y", [0.4, 0.84, 1.35], "plastic-red", { name: "terminal-positive" }),
      cyl(0.012, 0.022, "y", [0.56, 0.84, 1.35], "metal-dark", { name: "terminal-negative" }),
    ],
  },
  alternator: {
    parts: [
      cyl(0.065, 0.12, "x", [-0.3, 0.38, 1.45], "metal-aluminium", { name: "body" }),
      cyl(0.03, 0.025, "x", [-0.375, 0.38, 1.45], "metal-dark", { name: "pulley" }),
    ],
  },
  "starter-motor": {
    parts: [
      cyl(0.045, 0.17, "x", [0.12, 0.38, 0.97], "metal-dark", { name: "motor" }),
      cyl(0.028, 0.08, "x", [0.13, 0.445, 0.97], "metal-steel", { name: "solenoid" }),
    ],
  },
  "fuse-box": {
    parts: [box([0.12, 0.08, 0.16], [0.66, 0.7, 1.36], "plastic-black", { name: "box", radius: 0.01 })],
  },

  /* ---------------- drivetrain (gearbox on the car's left, estimate) */
  transmission: {
    parts: [
      cyl(0.19, 0.1, "x", [0.21, 0.45, 1.16], "metal-aluminium", { name: "bell-housing" }),
      box([0.3, 0.3, 0.3], [0.4, 0.45, 1.14], "metal-aluminium", { name: "case", radius: 0.03 }),
      cyl(0.11, 0.12, "x", [0.42, 0.33, 1.17], "metal-aluminium", { name: "differential" }),
    ],
  },
  clutch: {
    parts: [
      cyl(0.115, 0.022, "x", [0.18, 0.45, 1.16], "friction", { name: "disc" }),
      cyl(0.12, 0.02, "x", [0.205, 0.45, 1.16], "metal-steel", { name: "pressure-plate" }),
    ],
  },
  "drive-shafts": {
    mirrorX: true,
    parts: [
      pipe([[0.48, 0.33, 1.17], [0.64, 0.302, FA]], 0.016, "metal-steel", "shaft"),
      cyl(0.042, 0.08, "x", [0.51, 0.326, 1.168], "rubber", { name: "inner-boot" }),
      cyl(0.044, 0.08, "x", [0.6, 0.306, FA + 0.003], "rubber", { name: "outer-boot" }),
    ],
  },
  "engine-mounts": {
    parts: [
      box([0.1, 0.08, 0.1], [-0.45, 0.76, 1.2], "rubber", { name: "right-mount" }),
      box([0.1, 0.08, 0.1], [0.53, 0.64, 1.12], "rubber", { name: "gearbox-mount" }),
      pipe([[-0.05, 0.3, 1.02], [-0.05, 0.26, 0.82]], 0.022, "metal-dark", "torque-rod"),
    ],
  },

  /* ---------------- brakes */
  "front-brakes": {
    mirrorX: true,
    parts: [
      cyl(0.129, 0.022, "x", [0.665, WR, FA], "metal-cast", { name: "disc" }), // 258 mm (UK XP90 spec)
      box([0.06, 0.12, 0.08], [0.668, WR + 0.08, FA - 0.08], "metal-dark", { name: "caliper", rot: [-0.75, 0, 0] }),
      cyl(0.055, 0.06, "x", [0.625, WR, FA], "metal-steel", { name: "hub" }),
    ],
  },
  "rear-brakes": {
    mirrorX: true,
    parts: [cyl(0.11, 0.055, "x", [0.655, WR, RA], "metal-cast", { name: "drum-or-disc" })],
  },
  "brake-master": {
    parts: [
      cyl(0.12, 0.1, "z", [0.4, 0.78, 0.94], "metal-dark", { name: "servo" }),
      cyl(0.03, 0.14, "z", [0.4, 0.78, 1.06], "metal-aluminium", { name: "master-cylinder" }),
      box([0.1, 0.06, 0.07], [0.4, 0.84, 1.05], "fluid-reservoir", { name: "reservoir", radius: 0.01 }),
      cyl(0.022, 0.015, "y", [0.4, 0.877, 1.05], "plastic-black", { name: "cap" }),
    ],
  },
  "abs-unit": {
    parts: [box([0.12, 0.1, 0.1], [0.62, 0.74, 0.98], "metal-aluminium", { name: "modulator" })],
  },

  /* ---------------- steering & suspension */
  steering: {
    parts: [
      pipe([[-0.45, 0.36, FA - 0.13], [0.45, 0.36, FA - 0.13]], 0.025, "metal-dark", "rack"),
      cyl(0.045, 0.22, "x", [0.24, 0.36, FA - 0.13], "metal-aluminium", { name: "rack-housing" }),
      pipe([[0.45, 0.36, FA - 0.13], [0.64, 0.34, FA - 0.14]], 0.012, "metal-steel", "tie-rod-left"),
      pipe([[-0.45, 0.36, FA - 0.13], [-0.64, 0.34, FA - 0.14]], 0.012, "metal-steel", "tie-rod-right"),
      pipe([[0.3, 0.4, FA - 0.14], [0.34, 0.6, 0.72], [0.37, 0.93, 0.33]], 0.02, "metal-dark", "column"),
      { shape: "torus", radius: 0.185, tube: 0.016, axis: "z", pos: [0.37, 0.99, 0.27], rot: [-0.42, 0, 0], mat: "plastic-black", name: "wheel-rim" },
      cyl(0.06, 0.06, "z", [0.37, 0.985, 0.285], "plastic-black", { name: "wheel-hub", rot: [-0.42, 0, 0] }),
    ],
  },
  "front-suspension": {
    mirrorX: true,
    parts: [
      pipe([[0.61, 0.43, FA - 0.02], [0.56, 0.88, FA - 0.05]], 0.028, "metal-steel", "strut"),
      pipe([[0.595, 0.6, FA - 0.03], [0.575, 0.8, FA - 0.042]], 0.07, "metal-dark", "spring"),
      cyl(0.07, 0.03, "y", [0.56, 0.895, FA - 0.05], "rubber", { name: "top-mount" }),
      pipe([[0.62, 0.25, FA], [0.33, 0.25, FA + 0.02]], 0.02, "metal-dark", "lower-arm-front"),
      pipe([[0.62, 0.25, FA], [0.36, 0.25, FA - 0.28]], 0.02, "metal-dark", "lower-arm-rear"),
      pipe([[0.0, 0.29, FA - 0.24], [0.44, 0.29, FA - 0.24], [0.58, 0.36, FA - 0.06]], 0.011, "metal-steel", "anti-roll-bar-half"),
    ],
  },
  "rear-suspension": {
    parts: [
      box([1.1, 0.06, 0.08], [0, 0.3, -1.15], "metal-dark", { name: "torsion-beam" }),
      pipe([[0.58, 0.34, -0.86], [0.64, 0.3, RA]], 0.03, "metal-dark", "trailing-arm-left"),
      pipe([[-0.58, 0.34, -0.86], [-0.64, 0.3, RA]], 0.03, "metal-dark", "trailing-arm-right"),
      pipe([[0.56, 0.28, -1.37], [0.53, 0.62, -1.43]], 0.022, "metal-steel", "damper-left"),
      pipe([[-0.56, 0.28, -1.37], [-0.53, 0.62, -1.43]], 0.022, "metal-steel", "damper-right"),
      cyl(0.06, 0.17, "y", [0.44, 0.415, -1.18], "metal-dark", { name: "spring-left" }),
      cyl(0.06, 0.17, "y", [-0.44, 0.415, -1.18], "metal-dark", { name: "spring-right" }),
    ],
  },

  /* ---------------- wheels & tyres */
  "front-wheels": {
    mirrorX: true,
    parts: [
      { shape: "tyre", radius: WR, width: 0.185, sidewall: 0.111, pos: [TRACK_F, WR, FA], mat: "tyre", name: "tyre" },
      cyl(0.19, 0.16, "x", [TRACK_F, WR, FA], "metal-wheel", { name: "rim" }),
      cyl(0.16, 0.012, "x", [TRACK_F + 0.08, WR, FA], "metal-wheel", { name: "wheel-face" }),
    ],
  },
  "rear-wheels": {
    mirrorX: true,
    parts: [
      { shape: "tyre", radius: WR, width: 0.185, sidewall: 0.111, pos: [TRACK_R, WR, RA], mat: "tyre", name: "tyre" },
      cyl(0.19, 0.16, "x", [TRACK_R, WR, RA], "metal-wheel", { name: "rim" }),
      cyl(0.16, 0.012, "x", [TRACK_R + 0.08, WR, RA], "metal-wheel", { name: "wheel-face" }),
    ],
  },

  /* ---------------- exhaust (manifold drawn at the rear of the engine — orientation NOT verified) */
  "exhaust-manifold-cat": {
    parts: [
      box([0.4, 0.1, 0.06], [-0.1, 0.62, 1.0], "metal-exhaust", { name: "manifold" }),
      pipe([[-0.04, 0.6, 0.98], [-0.02, 0.42, 0.92], [0.0, 0.22, 0.76]], 0.03, "metal-exhaust", "downpipe"),
      cyl(0.065, 0.3, "z", [0.0, 0.2, 0.58], "metal-exhaust", { name: "catalyst" }),
    ],
  },
  "oxygen-sensors": {
    parts: [
      cyl(0.012, 0.06, "y", [0.02, 0.69, 1.0], "metal-steel", { name: "upstream-sensor" }),
      cyl(0.012, 0.06, "y", [0.0, 0.27, 0.4], "metal-steel", { name: "downstream-sensor" }),
    ],
  },
  "exhaust-silencer": {
    parts: [
      pipe([[0.0, 0.2, 0.43], [0.0, 0.18, -0.45], [-0.45, 0.18, -0.65], [-0.45, 0.18, -1.38], [-0.32, 0.22, -1.48]], 0.024, "metal-exhaust", "pipe"),
      box([0.42, 0.14, 0.26], [-0.28, 0.24, -1.6], "metal-exhaust", { name: "rear-silencer", radius: 0.05 }),
      pipe([[-0.45, 0.22, -1.7], [-0.47, 0.22, -1.92]], 0.022, "metal-steel", "tailpipe"),
    ],
  },
};

/* ------------------------------------------------------------------------------------ */
/* Builders                                                                             */
/* ------------------------------------------------------------------------------------ */

function tyreGeometry(radius: number, width: number, sidewall: number): THREE.BufferGeometry {
  // Lathe a rounded tyre cross-section around Y, then turn it to spin around X.
  const inner = radius - sidewall;
  const hw = width / 2;
  const pts: THREE.Vector2[] = [];
  const steps = 10;
  pts.push(new THREE.Vector2(inner, -hw * 0.92));
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    const r = radius - sidewall * 0.32 + Math.cos(a) * sidewall * 0.32;
    const y = Math.sin(a) * hw;
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(inner, hw * 0.92));
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateZ(Math.PI / 2);
  return g;
}

function roundedBox(size: Vec3, radius: number): THREE.BufferGeometry {
  // A cheap rounded box: extrude a rounded rectangle and bevel its faces.
  const [w, h, d] = size;
  const r = Math.min(radius, w / 2 - 1e-3, h / 2 - 1e-3);
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const bevel = Math.min(r, d / 2 - 1e-3);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-3, d - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: Math.max(0, bevel * 0.6),
    bevelSegments: 2,
    curveSegments: 4,
  });
  g.translate(0, 0, -(d - 2 * bevel) / 2);
  return g;
}

/** Build one primitive as a mesh positioned in vehicle coordinates. */
export function buildPrimitive(spec: PrimitiveSpec): THREE.Mesh {
  let geom: THREE.BufferGeometry;
  const mesh = new THREE.Mesh();
  switch (spec.shape) {
    case "box":
      geom = spec.radius ? roundedBox(spec.size, spec.radius) : new THREE.BoxGeometry(...spec.size);
      mesh.position.set(...spec.pos);
      if (spec.rot) mesh.rotation.set(...spec.rot);
      break;
    case "cylinder": {
      geom = new THREE.CylinderGeometry(spec.radiusTop ?? spec.radius, spec.radius, spec.length, 28);
      if (spec.axis === "x") geom.rotateZ(Math.PI / 2);
      if (spec.axis === "z") geom.rotateX(Math.PI / 2);
      mesh.position.set(...spec.pos);
      if (spec.rot) mesh.rotation.set(...spec.rot);
      break;
    }
    case "torus": {
      geom = new THREE.TorusGeometry(spec.radius, spec.tube, 12, 40);
      if (spec.axis === "x") geom.rotateY(Math.PI / 2);
      if (spec.axis === "y") geom.rotateX(Math.PI / 2);
      mesh.position.set(...spec.pos);
      if (spec.rot) mesh.rotation.set(...spec.rot);
      break;
    }
    case "tyre":
      geom = tyreGeometry(spec.radius, spec.width, spec.sidewall);
      mesh.position.set(...spec.pos);
      break;
    case "sphere":
      geom = new THREE.SphereGeometry(spec.radius, 24, 16);
      mesh.position.set(...spec.pos);
      if (spec.scale) mesh.scale.set(...spec.scale);
      break;
    case "pipe": {
      const curve = new THREE.CatmullRomCurve3(spec.points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
      const segs = Math.max(8, spec.points.length * 10);
      geom = new THREE.TubeGeometry(curve, segs, spec.radius, 10, false);
      break;
    }
  }
  mesh.geometry = geom;
  mesh.material = makeMaterial(spec.mat);
  mesh.name = spec.name ?? spec.shape;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mirrorSpec(spec: PrimitiveSpec): PrimitiveSpec {
  const mx = (p: Vec3): Vec3 => [-p[0], p[1], p[2]];
  const mr = (r?: Vec3): Vec3 | undefined => (r ? [r[0], -r[1], -r[2]] : undefined);
  if (spec.shape === "pipe") return { ...spec, points: spec.points.map(mx) };
  if (spec.shape === "sphere" || spec.shape === "tyre") return { ...spec, pos: mx(spec.pos) };
  const out = { ...spec, pos: mx(spec.pos) } as PrimitiveSpec & { rot?: Vec3 };
  if ("rot" in spec && spec.rot) out.rot = mr(spec.rot);
  // Offsets along the axle (e.g. a wheel face) are already encoded in pos, so mirroring pos is enough.
  return out;
}

/** Group meshes so the group's origin sits at their bounding-box centre (the assembled position). */
function centredGroup(name: string, meshes: THREE.Mesh[]): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  const box3 = new THREE.Box3();
  meshes.forEach((m) => {
    m.updateMatrixWorld(true);
    box3.expandByObject(m);
  });
  const c = box3.getCenter(new THREE.Vector3());
  g.position.copy(c);
  meshes.forEach((m) => {
    if (m.geometry.type === "TubeGeometry") m.geometry.translate(-c.x, -c.y, -c.z);
    else m.position.sub(c);
    g.add(m);
  });
  return g;
}

/**
 * Build placeholder objects for every component, keyed by component ID.
 * Each object is named with the ID and carries userData.atlas_id, exactly like a GLB export.
 */
export function buildPlaceholderObjects(ids: string[]): Map<string, THREE.Object3D> {
  const out = new Map<string, THREE.Object3D>();
  for (const id of ids) {
    let obj: THREE.Object3D;
    if (id === "body-shell") {
      obj = buildBodyShell();
    } else {
      const spec = PLACEHOLDERS[id];
      if (!spec) continue;
      if (spec.mirrorX) {
        obj = new THREE.Group();
        obj.name = id;
        const left = centredGroup(`${id}_L`, spec.parts.map(buildPrimitive));
        const right = centredGroup(`${id}_R`, spec.parts.map((p) => buildPrimitive(mirrorSpec(p))));
        left.userData.atlas_unit = "L";
        right.userData.atlas_unit = "R";
        obj.add(left, right);
      } else {
        obj = centredGroup(id, spec.parts.map(buildPrimitive));
      }
    }
    obj.name = id;
    obj.userData.atlas_id = id;
    out.set(id, obj);
  }
  return out;
}
