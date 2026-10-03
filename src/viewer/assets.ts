import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Replaceable GLB assets.
 *
 * public/models/asset-manifest.json lists GLB files to try. Each object in a GLB is mapped
 * to a component by (in order): its `atlas_id` custom property, its original Blender name,
 * or its glTF node name — with Blender's ".001" duplicate suffix stripped. Components not
 * found in any GLB fall back to the built-in placeholders, so a missing or partial GLB never
 * breaks labels, selection, visibility or explode.
 */

export interface AssetEntry {
  id: string;
  file: string;
  optional?: boolean;
  title?: string;
  creator?: string;
  source?: string;
  licence?: string;
  attribution?: string;
  /** "approximate" until a model is verified against the real car. */
  geometryStatus?: "approximate" | "verified";
  notes?: string;
}

export interface AssetManifest {
  version: 1;
  units: "metres";
  assets: AssetEntry[];
}

export interface AssetResult {
  entry: AssetEntry;
  status: "loaded" | "missing" | "error";
  message?: string;
  mapped: string[];
  unmapped: string[];
  duplicates: string[];
  /** Matched an ID but contained no mesh, so the placeholder was kept. */
  empty: string[];
}

export interface AssetStatus {
  manifest: "loaded" | "missing" | "error";
  results: AssetResult[];
  /** component id → GLB file it came from; components absent here use placeholders. */
  fromGlb: Record<string, string>;
  placeholders: string[];
}

export interface MappedObject {
  object: THREE.Object3D;
  file: string;
}

/** Resolve the component ID an object stands for, or null. */
export function resolveComponentId(obj: THREE.Object3D, known: Set<string>): string | null {
  const ud = (obj.userData ?? {}) as Record<string, unknown>;
  const candidates = [ud.atlas_id, ud.atlasId, ud.name, obj.name].filter((v): v is string => typeof v === "string" && v.length > 0);
  for (const raw of candidates) {
    const n = raw.trim().toLowerCase().replace(/\.\d{3}$/, "").replace(/_\d+$/, "");
    if (known.has(n)) return n;
  }
  return null;
}

/** Walk a loaded scene and pick the top-most object for each known component ID. */
export function mapScene(scene: THREE.Object3D, known: Set<string>): { mapped: Map<string, THREE.Object3D>; unmapped: string[]; duplicates: string[] } {
  const mapped = new Map<string, THREE.Object3D>();
  const duplicates: string[] = [];
  const claimed = new Set<THREE.Object3D>(); // mapped objects and ignored duplicates
  const visit = (o: THREE.Object3D) => {
    const id = o === scene ? null : resolveComponentId(o, known);
    if (id) {
      if (mapped.has(id)) duplicates.push(id);
      else mapped.set(id, o);
      claimed.add(o);
      return; // everything below belongs to this component
    }
    o.children.forEach(visit);
  };
  visit(scene);

  // Report top-level objects that carry no component at all (likely naming mistakes).
  const unmapped: string[] = [];
  const containsMapped = (o: THREE.Object3D): boolean => {
    let found = false;
    o.traverse((c) => {
      if (!found && claimed.has(c)) found = true;
    });
    return found;
  };
  let roots = scene.children;
  // A single wrapper object (e.g. a "YarisAtlas" empty) is looked through.
  while (roots.length === 1 && !resolveComponentId(roots[0], known) && roots[0].children.length) roots = roots[0].children;
  for (const r of roots) if (!containsMapped(r)) unmapped.push(r.name || "(unnamed)");
  return { mapped, unmapped, duplicates };
}

async function fetchArrayBuffer(url: string): Promise<{ ok: true; buf: ArrayBuffer } | { ok: false; missing: boolean; message: string }> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return { ok: false, missing: res.status === 404, message: `HTTP ${res.status}` };
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("text/html")) return { ok: false, missing: true, message: "Server returned an HTML page instead of a model" };
    return { ok: true, buf: await res.arrayBuffer() };
  } catch (e) {
    return { ok: false, missing: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function loadAssets(baseUrl: string, componentIds: string[]): Promise<{ objects: Map<string, MappedObject>; status: Omit<AssetStatus, "placeholders" | "fromGlb">; manifest: AssetManifest | null }> {
  const known = new Set(componentIds);
  const objects = new Map<string, MappedObject>();
  const results: AssetResult[] = [];

  let manifest: AssetManifest | null = null;
  let manifestState: AssetStatus["manifest"] = "loaded";
  try {
    const res = await fetch(`${baseUrl}models/asset-manifest.json`, { cache: "no-cache" });
    if (!res.ok) manifestState = "missing";
    else manifest = (await res.json()) as AssetManifest;
  } catch {
    manifestState = "error";
  }
  if (!manifest || !Array.isArray(manifest.assets)) return { objects, status: { manifest: manifest ? "error" : manifestState, results }, manifest: null };

  const loader = new GLTFLoader();
  for (const entry of manifest.assets) {
    const url = `${baseUrl}${entry.file.replace(/^\//, "")}`;
    const got = await fetchArrayBuffer(url);
    if (!got.ok) {
      results.push({ entry, status: got.missing ? "missing" : "error", message: got.message, mapped: [], unmapped: [], duplicates: [], empty: [] });
      continue;
    }
    try {
      const gltf = await loader.parseAsync(got.buf, url.slice(0, url.lastIndexOf("/") + 1));
      const scene = gltf.scene;
      scene.updateMatrixWorld(true);
      const { mapped, unmapped, duplicates } = mapScene(scene, known);
      const usedHere: string[] = [];
      const empty: string[] = [];
      for (const [id, obj] of mapped) {
        if (objects.has(id)) {
          duplicates.push(id);
          continue;
        }
        let hasMesh = false;
        obj.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) hasMesh = true;
        });
        if (!hasMesh) {
          empty.push(id);
          continue;
        }
        objects.set(id, { object: obj, file: entry.file });
        usedHere.push(id);
      }
      results.push({ entry, status: "loaded", mapped: usedHere.sort(), unmapped, duplicates, empty });
    } catch (e) {
      results.push({ entry, status: "error", message: e instanceof Error ? e.message : String(e), mapped: [], unmapped: [], duplicates: [], empty: [] });
    }
  }
  return { objects, status: { manifest: "loaded", results }, manifest };
}
