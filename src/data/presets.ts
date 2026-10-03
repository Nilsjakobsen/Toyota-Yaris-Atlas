import type { Vec3 } from "./types";

export type BodyMode = "solid" | "ghost" | "hidden";

export interface CameraPreset {
  id: string;
  name: string;
  /** Camera position and orbit target, in metres, vehicle coordinates (see docs/BLENDER-GLB-WORKFLOW.md). */
  position: Vec3;
  target: Vec3;
  /** Body shell mode to switch to, if the view only makes sense with it changed. */
  body?: BodyMode;
}

/*
 * Vehicle coordinates: +Y up, +Z forward (front of the car), +X = the car's LEFT side
 * (the driver's side in Norway). Origin on the ground, centred under the car.
 */
export const PRESETS: CameraPreset[] = [
  { id: "overview", name: "Overview", position: [4.6, 2.5, 5.6], target: [0, 0.62, 0.05] },
  { id: "engine-bay", name: "Engine bay", position: [2.35, 3.0, 4.35], target: [0.02, 0.6, 1.15], body: "ghost" },
  { id: "side", name: "Left side", position: [7.4, 1.05, 0.0], target: [0, 0.65, 0] },
  { id: "front", name: "Front", position: [0, 1.2, 7.2], target: [0, 0.65, 0] },
  { id: "rear", name: "Rear", position: [0, 1.35, -7.2], target: [0, 0.65, 0] },
  { id: "top", name: "Top", position: [0, 8.6, 0.6], target: [0, 0.5, 0], body: "ghost" },
  { id: "underside", name: "Underside", position: [4.3, -3.3, 3.6], target: [0, 0.25, -0.1], body: "ghost" },
  { id: "front-corner", name: "Front wheel", position: [2.45, 1.65, 2.95], target: [0.6, 0.45, 1.155], body: "ghost" },
  { id: "rear-axle", name: "Rear axle", position: [2.9, 0.85, -3.5], target: [0, 0.35, -1.15], body: "ghost" },
];

export const PRESET_BY_ID: Record<string, CameraPreset> = Object.fromEntries(PRESETS.map((p) => [p.id, p]));
