import * as THREE from "three";
import { makeMaterial } from "./materials";

/**
 * Procedural placeholder body: a lofted five-door hatchback silhouette.
 *
 * Sized to the registered length (3790 mm) and width (1700 mm), with height (1530 mm) and
 * wheelbase (2460 mm) from a secondary database for the XP90 facelift. The profile curves
 * are hand-drawn estimates, so this is recognisable rather than accurate. Replace it by
 * exporting a "body-shell" object in your GLB.
 */

const L = 3.79;
const ZF = L / 2;
const ZR = -L / 2;
const FA = 1.155;
const RA = -1.305;
const WHEEL_R = 0.3015;
const ARCH_R = 0.37;

type Pt = [number, number];

// Side-profile top line (z, y), front to rear.
const TOP: Pt[] = [
  [1.895, 0.52], [1.87, 0.64], [1.8, 0.745], [1.6, 0.835], [1.35, 0.915], [1.08, 0.985],
  [0.85, 1.12], [0.55, 1.3], [0.28, 1.45], [0.0, 1.515], [-0.6, 1.528], [-1.2, 1.505],
  [-1.5, 1.455], [-1.66, 1.35], [-1.77, 1.15], [-1.84, 0.98], [-1.88, 0.75], [-1.895, 0.55],
];
// Bottom line before wheel arches are cut.
const BOT: Pt[] = [[1.895, 0.36], [1.85, 0.27], [1.7, 0.235], [1.3, 0.22], [-1.3, 0.22], [-1.7, 0.26], [-1.85, 0.32], [-1.895, 0.4]];
// Plan-view half width at the shoulder.
const HW: Pt[] = [[1.895, 0.5], [1.86, 0.66], [1.78, 0.76], [1.62, 0.82], [1.4, 0.845], [1.0, 0.85], [-1.4, 0.85], [-1.7, 0.84], [-1.83, 0.8], [-1.895, 0.72]];

/** Monotone cubic interpolation (no overshoot), points in any z order. */
function makeInterp(points: Pt[]): (z: number) => number {
  const p = [...points].sort((a, b) => a[0] - b[0]);
  const n = p.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (z: number) => {
    if (z <= p[0][0]) return p[0][1];
    if (z >= p[n - 1][0]) return p[n - 1][1];
    let i = 0;
    while (i < n - 2 && z > p[i + 1][0]) i++;
    const h = p[i + 1][0] - p[i][0];
    const t = (z - p[i][0]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * p[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

const topAt = makeInterp(TOP);
const botBaseAt = makeInterp(BOT);
const hwAt = makeInterp(HW);

function botAt(z: number): number {
  let y = botBaseAt(z);
  for (const ax of [FA, RA]) {
    const dz = z - ax;
    if (Math.abs(dz) < ARCH_R) y = Math.max(y, WHEEL_R + Math.sqrt(ARCH_R * ARCH_R - dz * dz));
  }
  return y;
}

const beltAt = (z: number) => 0.975 + 0.04 * Math.min(1, Math.max(0, (0.9 - z) / 2.6));
type Section = "under" | "sill" | "side" | "glasshouse" | "roof";
type Group = "paint" | "glass" | "under";

interface RingVertex {
  x: number;
  y: number;
}

/** Rows per section, from the bottom centre to the top centre of one (left) side. */
const ROWS: [Section, number][] = [
  ["under", 4],
  ["sill", 4],
  ["side", 7],
  ["glasshouse", 7],
  ["roof", 9],
];

/**
 * One half cross-section at station z, as explicit rows so that window edges follow
 * clean lines: the belt line and roof edge are always vertex rows.
 */
function halfRing(z: number): { verts: RingVertex[]; seg: { section: Section; index: number; count: number }[] } {
  const yb = botAt(z);
  const yt = Math.max(topAt(z), yb + 0.04);
  const hw = hwAt(z);
  const y1 = yb + Math.min(0.1, (yt - yb) * 0.28); // top of the sill rounding
  const y2 = Math.min(Math.max(beltAt(z), y1 + 0.01), yt - 0.025); // belt / shoulder
  const y3 = Math.max(y2, yt - 0.06); // roof edge
  const gh = y3 - y2; // glasshouse height
  const tumble = 0.27 * Math.min(1, gh / 0.42); // how far the glasshouse leans in
  const xBelt = hw;
  const xRoof = hw * (1 - tumble);

  const verts: RingVertex[] = [];
  const seg: { section: Section; index: number; count: number }[] = [];
  const push = (x: number, y: number) => verts.push({ x, y });
  push(0, yb);
  for (const [section, n] of ROWS) {
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      let x = 0, y = 0;
      switch (section) {
        case "under":
          x = hw * 0.9 * t;
          y = yb;
          break;
        case "sill": {
          const a = (Math.PI / 2) * t; // quarter round from the floor up to the side
          x = hw * 0.9 + hw * 0.085 * Math.sin(a);
          y = yb + (y1 - yb) * (1 - Math.cos(a));
          break;
        }
        case "side":
          x = hw * (0.985 + 0.015 * Math.sin(Math.PI * t * 0.9));
          y = y1 + (y2 - y1) * t;
          break;
        case "glasshouse":
          x = xBelt + (xRoof - xBelt) * Math.pow(t, 1.15);
          y = y2 + gh * t;
          break;
        case "roof": {
          const a = (Math.PI / 2) * t; // superelliptic crown from the roof edge to the centre
          const e = 2 / 3.2;
          x = xRoof * Math.pow(Math.cos(a), e);
          y = y3 + (yt - y3) * Math.pow(Math.sin(a), e);
          break;
        }
      }
      seg.push({ section, index: i - 1, count: n });
      push(x, y);
    }
  }
  return { verts, seg };
}

const SIDE_WINDOWS: [number, number][] = [
  [-0.3, 0.9], // front door (runs forward to the A-pillar)
  [-1.22, -0.385], // rear door, behind the B-pillar
  [-1.58, -1.32], // rear quarter, behind the C-pillar
];

function classify(section: Section, index: number, count: number, z: number, yt: number): Group {
  if (section === "under") return "under";
  if (section === "glasshouse") {
    if (index === 0 || index === count - 1) return "paint"; // window frame rows
    return SIDE_WINDOWS.some(([a, b]) => z > a && z < b) ? "glass" : "paint";
  }
  if (section === "roof") {
    if (index < 2) return "paint"; // A-pillars / roof rails
    if (z > 0.32 && z < 1.04) return "glass"; // windscreen
    if (z < -1.6 && yt > 1.07 && z > -1.84) return "glass"; // tailgate window
  }
  return "paint";
}

function buildPanels(): THREE.Mesh {
  const NZ = 140;
  const stations: number[] = [];
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ;
    // Cluster stations slightly towards the ends where curvature is highest.
    const z = ZR + (ZF - ZR) * (u - (0.15 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI));
    stations.push(Math.min(ZF, Math.max(ZR, z)));
  }
  // Snap a station onto every window boundary so pillar edges are straight.
  const edges = [0.32, 1.04, -1.6, -1.84, ...SIDE_WINDOWS.flat()];
  for (const e of edges) {
    let best = 0;
    for (let i = 1; i < stations.length - 1; i++) if (Math.abs(stations[i] - e) < Math.abs(stations[best] - e)) best = i;
    if (best > 0) stations[best] = e;
  }
  stations.sort((a, b) => a - b);

  const positions: number[] = [];
  let ringSize = 0;
  let segInfo: { section: Section; index: number; count: number }[] = [];
  for (const z of stations) {
    const { verts, seg } = halfRing(z);
    // Full ring: left side bottom→top, then right side top→bottom (centres not duplicated).
    const ring = [...verts, ...verts.slice(1, -1).reverse().map((v) => ({ x: -v.x, y: v.y }))];
    if (!ringSize) {
      ringSize = ring.length;
      segInfo = [...seg, ...[...seg].reverse()];
    }
    for (const v of ring) positions.push(v.x, v.y, z);
  }
  const capF = positions.length / 3;
  positions.push(0, (botAt(ZF) + topAt(ZF)) / 2, ZF);
  const capR = positions.length / 3;
  positions.push(0, (botAt(ZR) + topAt(ZR)) / 2, ZR);

  const idx: Record<Group, number[]> = { paint: [], glass: [], under: [] };
  const P = (i: number, k: number) => i * ringSize + (k % ringSize);
  for (let i = 0; i < stations.length - 1; i++) {
    const zMid = (stations[i] + stations[i + 1]) / 2;
    const yt = topAt(zMid);
    for (let k = 0; k < ringSize; k++) {
      const s = segInfo[k];
      const g = classify(s.section, s.index, s.count, zMid, yt);
      const a = P(i, k), b = P(i + 1, k), c = P(i + 1, k + 1), d = P(i, k + 1);
      // Left half is wound bottom→top, right half top→bottom; both give outward normals.
      idx[g].push(a, d, b, b, d, c);
    }
  }
  const last = stations.length - 1;
  for (let k = 0; k < ringSize; k++) {
    idx.paint.push(P(0, k + 1), P(0, k), capR);
    idx.paint.push(P(last, k), P(last, k + 1), capF);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const all = [...idx.paint, ...idx.glass, ...idx.under];
  g.setIndex(all);
  g.addGroup(0, idx.paint.length, 0);
  g.addGroup(idx.paint.length, idx.glass.length, 1);
  g.addGroup(idx.paint.length + idx.glass.length, idx.under.length, 2);
  g.computeVertexNormals();

  const mesh = new THREE.Mesh(g, [makeMaterial("paint-silver"), makeMaterial("glass"), makeMaterial("trim-dark")]);
  mesh.name = "panels";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function ellipsoid(name: string, mat: string, pos: [number, number, number], scale: [number, number, number], rotY = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), makeMaterial(mat));
  m.name = name;
  m.position.set(...pos);
  m.scale.set(...scale);
  m.rotation.y = rotY;
  return m;
}

function slab(name: string, mat: string, size: [number, number, number], pos: [number, number, number]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), makeMaterial(mat));
  m.name = name;
  m.position.set(...pos);
  m.castShadow = true;
  return m;
}

export function buildBodyShell(): THREE.Group {
  const parts: THREE.Mesh[] = [buildPanels()];
  for (const side of [1, -1]) {
    const s = side > 0 ? "left" : "right";
    parts.push(ellipsoid(`headlight-${s}`, "light-clear", [0.6 * side, 0.79, 1.7], [0.16, 0.07, 0.2], -0.55 * side));
    parts.push(ellipsoid(`taillight-${s}`, "light-red", [0.79 * side, 0.9, -1.8], [0.04, 0.12, 0.09]));
    parts.push(slab(`mirror-${s}`, "paint-silver", [0.07, 0.1, 0.15], [0.885 * side, 1.03, 0.8]));
    for (const [ax, name] of [[FA, "front"], [RA, "rear"]] as const) {
      const liner = new THREE.Mesh(new THREE.CircleGeometry(ARCH_R, 28, 0, Math.PI), makeMaterial("trim-dark"));
      liner.geometry.rotateY(Math.PI / 2);
      liner.material.side = THREE.DoubleSide;
      liner.name = `arch-liner-${name}-${s}`;
      liner.position.set(0.6 * side, WHEEL_R, ax);
      parts.push(liner);
    }
  }
  parts.push(slab("lower-grille", "trim-dark", [0.62, 0.12, 0.06], [0, 0.39, 1.86]));
  parts.push(slab("upper-grille", "trim-dark", [0.34, 0.045, 0.05], [0, 0.665, 1.83]));
  // Blank plates for orientation only — deliberately no registration text.
  parts.push(slab("plate-front", "plate", [0.52, 0.11, 0.012], [0, 0.48, 1.9]));
  parts.push(slab("plate-rear", "plate", [0.52, 0.11, 0.012], [0, 0.9, -1.872]));

  const g = new THREE.Group();
  g.name = "body-shell";
  parts.forEach((p) => g.add(p));
  return g;
}

/** Exposed for tests: overall extents of the procedural shell. */
export const BODY_DIMENSIONS = { length: L, width: 1.7, height: 1.53 };
