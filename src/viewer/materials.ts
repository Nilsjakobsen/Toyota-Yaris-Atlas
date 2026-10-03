import * as THREE from "three";

/**
 * Built-in material library. Placeholder geometry uses these by name, and so may your GLB:
 * a GLB material named "atlas-<name>" (e.g. "atlas-paint-silver") is swapped for the
 * built-in one at load time. Any other GLB material is used exactly as exported.
 */
type MatDef = {
  color: string;
  metalness: number;
  roughness: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  transmission?: number;
};

export const MATERIAL_DEFS: Record<string, MatDef> = {
  "paint-silver": { color: "#b7bcc2", metalness: 0.75, roughness: 0.32, clearcoat: 0.8 },
  glass: { color: "#1f2a33", metalness: 0.2, roughness: 0.04, opacity: 0.66 },
  "light-clear": { color: "#dfe6ec", metalness: 0.2, roughness: 0.08, opacity: 0.85, emissive: "#f3f6f8", emissiveIntensity: 0.06 },
  "light-red": { color: "#9b1c1c", metalness: 0.1, roughness: 0.2, opacity: 0.92, emissive: "#5a0c0c", emissiveIntensity: 0.25 },
  "light-amber": { color: "#d0801f", metalness: 0.1, roughness: 0.25, opacity: 0.9 },
  "plastic-black": { color: "#1d1f22", metalness: 0.0, roughness: 0.62 },
  "plastic-grey": { color: "#53585e", metalness: 0.0, roughness: 0.55 },
  "plastic-yellow": { color: "#e2b51b", metalness: 0.0, roughness: 0.45 },
  "plastic-red": { color: "#b3261e", metalness: 0.0, roughness: 0.45 },
  "trim-dark": { color: "#121416", metalness: 0.2, roughness: 0.5 },
  plate: { color: "#e9ecef", metalness: 0.0, roughness: 0.4 },
  rubber: { color: "#17181a", metalness: 0.0, roughness: 0.88 },
  tyre: { color: "#1b1c1e", metalness: 0.0, roughness: 0.92 },
  "metal-steel": { color: "#8c9399", metalness: 0.85, roughness: 0.38 },
  "metal-cast": { color: "#5d6266", metalness: 0.7, roughness: 0.6 },
  "metal-aluminium": { color: "#a9aeb2", metalness: 0.8, roughness: 0.42 },
  "metal-dark": { color: "#3c4146", metalness: 0.6, roughness: 0.5 },
  "metal-wheel": { color: "#9ea4aa", metalness: 0.8, roughness: 0.3 },
  "metal-exhaust": { color: "#7a6f66", metalness: 0.7, roughness: 0.55 },
  "battery-case": { color: "#25282c", metalness: 0.0, roughness: 0.55 },
  "fluid-reservoir": { color: "#e8e4d6", metalness: 0.0, roughness: 0.35, opacity: 0.8 },
  friction: { color: "#4a423b", metalness: 0.1, roughness: 0.85 },
  "electronics-box": { color: "#30353b", metalness: 0.3, roughness: 0.5 },
};

export function makeMaterial(name: string): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const def = MATERIAL_DEFS[name] ?? MATERIAL_DEFS["plastic-grey"];
  const params = {
    color: new THREE.Color(def.color),
    metalness: def.metalness,
    roughness: def.roughness,
    transparent: def.opacity !== undefined && def.opacity < 1,
    opacity: def.opacity ?? 1,
    emissive: new THREE.Color(def.emissive ?? "#000000"),
    emissiveIntensity: def.emissiveIntensity ?? 1,
  };
  const mat = def.clearcoat
    ? new THREE.MeshPhysicalMaterial({ ...params, clearcoat: def.clearcoat, clearcoatRoughness: 0.18 })
    : new THREE.MeshStandardMaterial(params);
  if (params.transparent) mat.depthWrite = def.opacity! > 0.6;
  mat.name = `atlas-${name}`;
  return mat;
}

/** If a GLB material follows the "atlas-<name>" convention, return the built-in equivalent. */
export function libraryMaterialFor(original: THREE.Material): THREE.Material | null {
  const m = /^atlas-(.+?)(\.\d{3})?$/.exec(original.name ?? "");
  if (!m || !MATERIAL_DEFS[m[1]]) return null;
  return makeMaterial(m[1]);
}
