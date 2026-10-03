import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { COMPONENTS, COMPONENT_BY_ID, COMPONENT_IDS } from "../data/components";
import { SYSTEM_BY_ID } from "../data/systems";
import type { ComponentRecord, SystemId, Vec3 } from "../data/types";
import type { BodyMode, CameraPreset } from "../data/presets";
import { buildPlaceholderObjects } from "./placeholders";
import { loadAssets, type AssetStatus } from "./assets";
import { libraryMaterialFor } from "./materials";
import { approach, explodeDirection, explodeSpread, sliderToAmount } from "./explode";

export type ColourMode = "realistic" | "system";

export interface ViewerCallbacks {
  onHover(id: string | null): void;
  onSelect(id: string | null): void;
  onAssets(status: AssetStatus): void;
  onExplodeReadout(cm: number): void;
}

interface Unit {
  obj: THREE.Object3D;
  /** Assembled local position. Never modified after registration. */
  home: THREE.Vector3;
  /** Local displacement at full explode (amount = 1). */
  offset: THREE.Vector3;
  /** World-space travel at full explode, metres. */
  travel: number;
  /** Bounding-box centre in the unit's own local space, used to anchor labels. */
  anchor: THREE.Vector3;
}

interface MatSlot {
  mesh: THREE.Mesh;
  isArray: boolean;
  realistic: THREE.Material[];
  system: THREE.Material[];
  orig: MatOrig[];
  origSystem: MatOrig[];
}

interface MatOrig {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}

const snapshot = (m: THREE.Material): MatOrig => {
  const std = m as THREE.MeshStandardMaterial;
  return {
    opacity: m.opacity,
    transparent: m.transparent,
    depthWrite: m.depthWrite,
    emissive: std.emissive ? std.emissive.clone() : undefined,
    emissiveIntensity: std.emissiveIntensity,
  };
};

interface CompNode {
  id: string;
  record: ComponentRecord;
  group: THREE.Object3D;
  units: Unit[];
  slots: MatSlot[];
  source: "glb" | "placeholder";
  file?: string;
}

const ACCENT = new THREE.Color("#15a2b8");
const HOVER = new THREE.Color("#5ec8d8");
const LINKED = new THREE.Color("#e39a2d");
const UNKNOWN_EDGE = new THREE.Color("#d9902b");

/** How much further the camera pulls back at full explode (fraction of the starting distance). */
const DOLLY = 0.5;

const HOME_PRESET: CameraPreset = { id: "overview", name: "Overview", position: [4.6, 2.5, 5.6], target: [0, 0.62, 0.05] };

export class AtlasViewer {
  readonly container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private modelRoot = new THREE.Group();
  private grid: THREE.GridHelper;
  private labelLayer: HTMLDivElement;
  private labels = new Map<string, { el: HTMLDivElement; w: number }>();
  private nodes = new Map<string, CompNode>();
  private pickList: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hoverPending: { x: number; y: number } | null = null;
  private down: { x: number; y: number; t: number } | null = null;
  private raf = 0;
  private lastT = 0;
  private dirty = true;
  private resizeObs: ResizeObserver;
  private tween: { fromP: THREE.Vector3; toP: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t0: number; dur: number } | null = null;
  private disposed = false;

  // State mirrored from the app.
  private visibleSystems: Record<SystemId, boolean> = Object.fromEntries(Object.keys(SYSTEM_BY_ID).map((k) => [k, true])) as Record<SystemId, boolean>;
  private bodyMode: BodyMode = "solid";
  private colourMode: ColourMode = "realistic";
  private selected: string | null = null;
  private hovered: string | null = null;
  private linked = new Set<string>();
  private isolate = false;
  private showLabels = true;
  private explodeTarget = 0;
  private explodeAmount = 0;
  private lastReadout = -1;
  /** Camera distance the explode dolly scales from; captured when the explode starts. */
  private dollyBase = 0;

  ready: Promise<void>;
  assetStatus: AssetStatus | null = null;

  constructor(container: HTMLElement, private cb: ViewerCallbacks) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = "viewer-canvas";
    container.appendChild(this.renderer.domElement);

    this.labelLayer = document.createElement("div");
    this.labelLayer.className = "label-layer";
    container.appendChild(this.labelLayer);

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
    this.camera.position.set(...HOME_PRESET.position);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...HOME_PRESET.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 24;
    this.controls.zoomSpeed = 0.9;
    this.controls.addEventListener("start", () => (this.tween = null));
    // If the user zooms while exploded, keep their choice as the new baseline.
    this.controls.addEventListener("end", () => {
      if (this.explodeAmount > 0) this.dollyBase = this.camera.position.distanceTo(this.controls.target) / (1 + DOLLY * this.explodeAmount);
    });
    this.controls.addEventListener("change", () => (this.dirty = true));
    this.controls.update();

    // Lighting: a neutral studio environment for reflections, plus one shadow-casting key.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(4.5, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -4.5; sc.right = 4.5; sc.top = 4.5; sc.bottom = -4.5; sc.near = 1; sc.far = 25;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key, new THREE.HemisphereLight(0xf2f5f8, 0x4a4f55, 0.35));

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "__ground";
    this.scene.add(ground);
    this.grid = new THREE.GridHelper(12, 12, 0x7d8790, 0x7d8790);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.22;
    this.grid.position.y = 0.001;
    this.grid.name = "__grid";
    this.scene.add(this.grid);

    this.modelRoot.name = "YarisAtlas";
    this.scene.add(this.modelRoot);

    const el = this.renderer.domElement;
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerLeave);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();

    this.ready = this.build();
    this.raf = requestAnimationFrame(this.tick);
  }

  /* ------------------------------------------------------------------ build */

  private async build(): Promise<void> {
    const base = import.meta.env.BASE_URL ?? "/";
    const { objects, status } = await loadAssets(base, COMPONENT_IDS);
    if (this.disposed) return;
    const missing = COMPONENT_IDS.filter((id) => !objects.has(id));
    const placeholders = buildPlaceholderObjects(missing);

    for (const record of COMPONENTS) {
      const fromGlb = objects.get(record.id);
      const obj = fromGlb?.object ?? placeholders.get(record.id);
      if (!obj) continue;
      if (fromGlb) this.modelRoot.attach(obj); // keeps the assembled world transform
      else this.modelRoot.add(obj);
      this.register(record, obj, fromGlb ? "glb" : "placeholder", fromGlb?.file);
    }

    const fromGlbMap: Record<string, string> = {};
    for (const n of this.nodes.values()) if (n.source === "glb" && n.file) fromGlbMap[n.id] = n.file;
    this.assetStatus = { ...status, fromGlb: fromGlbMap, placeholders: [...this.nodes.values()].filter((n) => n.source === "placeholder").map((n) => n.id) };
    this.applyVisibility();
    this.applyMaterials();
    this.applyExplode();
    this.cb.onAssets(this.assetStatus);
    this.dirty = true;
  }

  private register(record: ComponentRecord, group: THREE.Object3D, source: "glb" | "placeholder", file?: string) {
    group.name = record.id;
    group.userData.atlas_id = record.id;
    this.modelRoot.updateMatrixWorld(true);

    const sys = SYSTEM_BY_ID[record.system];
    const unitObjs = record.sides && group.children.length >= 2 ? group.children.filter((c) => !c.userData.atlasHelper) : [group];
    const units: Unit[] = unitObjs.map((obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const worldCentre = box.isEmpty() ? obj.getWorldPosition(new THREE.Vector3()) : box.getCenter(new THREE.Vector3());
      const c: Vec3 = [worldCentre.x, worldCentre.y, worldCentre.z];
      const dir = explodeDirection(c, sys.fan, record.explode?.dir);
      const travel = explodeSpread(c, sys.spread, record.explode?.spread);
      // Convert the world displacement into the unit's parent space, once.
      const parent = obj.parent ?? this.modelRoot;
      const homeWorld = obj.getWorldPosition(new THREE.Vector3());
      const target = homeWorld.clone().add(new THREE.Vector3(...dir).multiplyScalar(travel));
      const homeLocal = obj.position.clone();
      const offset = parent.worldToLocal(target.clone()).sub(parent.worldToLocal(homeWorld.clone()));
      const anchor = obj.worldToLocal(worldCentre.clone());
      return { obj, home: homeLocal, offset, travel, anchor };
    });

    const slots: MatSlot[] = [];
    const sysColour = new THREE.Color(sys.colour);
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || o.userData.atlasHelper) return;
      mesh.userData.atlasId = record.id;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const isArray = Array.isArray(mesh.material);
      const originals = (isArray ? mesh.material : [mesh.material]) as THREE.Material[];
      const realistic = originals.map((m) => libraryMaterialFor(m) ?? m.clone());
      const system = realistic.map((m) => {
        const glassy = m.transparent && m.opacity < 0.6;
        const sm = new THREE.MeshStandardMaterial({
          color: record.system === "body" ? new THREE.Color("#cdd2d7") : sysColour,
          metalness: 0.1,
          roughness: 0.55,
          transparent: glassy,
          opacity: glassy ? 0.35 : 1,
        });
        sm.name = `system-${record.system}`;
        return sm;
      });
      slots.push({ mesh, isArray, realistic, system, orig: realistic.map(snapshot), origSystem: system.map(snapshot) });

      if (record.location.status === "unknown") {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 25),
          new THREE.LineDashedMaterial({ color: UNKNOWN_EDGE, dashSize: 0.018, gapSize: 0.012 }),
        );
        edges.computeLineDistances();
        edges.userData.atlasHelper = true;
        edges.raycast = () => {};
        mesh.add(edges);
      }
    });

    this.nodes.set(record.id, { id: record.id, record, group, units, slots, source, file });
  }

  /* ------------------------------------------------------------------ state setters */

  setVisibleSystems(v: Record<SystemId, boolean>) {
    this.visibleSystems = { ...v };
    this.applyVisibility();
  }

  setBodyMode(mode: BodyMode) {
    this.bodyMode = mode;
    this.applyVisibility();
    this.applyMaterials();
  }

  setColourMode(mode: ColourMode) {
    this.colourMode = mode;
    this.applyMaterials();
  }

  setSelected(id: string | null) {
    if (id === this.selected) return;
    this.selected = id;
    this.applyMaterials();
  }

  setLinked(ids: string[]) {
    this.linked = new Set(ids);
    this.applyMaterials();
  }

  setIsolate(on: boolean) {
    this.isolate = on;
    this.applyMaterials();
  }

  setLabels(on: boolean) {
    this.showLabels = on;
    this.dirty = true;
  }

  /** Slider position 0..1. The displayed amount eases towards it every frame. */
  setExplode(slider: number) {
    this.explodeTarget = sliderToAmount(slider);
    this.dirty = true;
  }

  goTo(preset: CameraPreset, animate = true) {
    const toP = new THREE.Vector3(...preset.position);
    const toT = new THREE.Vector3(...preset.target);
    if (!animate) {
      this.tween = null;
      this.camera.position.copy(toP);
      this.controls.target.copy(toT);
      this.controls.update();
      this.dirty = true;
      return;
    }
    this.tween = { fromP: this.camera.position.clone(), toP, fromT: this.controls.target.clone(), toT, t0: performance.now(), dur: 850 };
  }

  resetView(animate = true) {
    this.goTo(HOME_PRESET, animate);
  }

  /** Frame the selected component without changing the viewing direction. */
  focus(id: string) {
    const node = this.nodes.get(id);
    if (!node) return;
    const box = new THREE.Box3().setFromObject(node.group);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    const r = Math.max(0.25, box.getSize(new THREE.Vector3()).length() * 0.5);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const dist = Math.min(9, Math.max(1.2, (r / Math.sin((this.camera.fov * Math.PI) / 360)) * 1.25));
    const pos = c.clone().add(dir.multiplyScalar(dist));
    this.goTo({ id: "focus", name: "Focus", position: [pos.x, pos.y, pos.z], target: [c.x, c.y, c.z] });
  }

  /* ------------------------------------------------------------------ apply */

  private nodeVisible(n: CompNode): boolean {
    if (!this.visibleSystems[n.record.system]) return false;
    if (n.id === "body-shell" && this.bodyMode === "hidden") return false;
    return true;
  }

  private applyVisibility() {
    this.pickList = [];
    for (const n of this.nodes.values()) {
      const vis = this.nodeVisible(n);
      n.group.visible = vis;
      if (!vis) continue;
      if (n.id === "body-shell" && this.bodyMode === "ghost") continue; // look through the ghosted shell
      for (const s of n.slots) this.pickList.push(s.mesh);
    }
    if (this.hovered && !this.nodes.get(this.hovered)?.group.visible) this.setHovered(null);
    this.dirty = true;
  }

  private applyMaterials() {
    for (const n of this.nodes.values()) {
      const selected = this.selected === n.id;
      const hovered = this.hovered === n.id && !selected;
      const linked = this.linked.has(n.id);
      const ghost = n.id === "body-shell" && this.bodyMode === "ghost";
      const faded = this.isolate && !!this.selected && !selected && !linked;
      const unknown = n.record.location.status === "unknown";
      for (const s of n.slots) {
        const mats = this.colourMode === "realistic" ? s.realistic : s.system;
        mats.forEach((m, i) => {
          const o = this.colourMode === "realistic" ? s.orig[i] : s.origSystem[i];
          let opacity = o.opacity;
          let transparent = o.transparent;
          let depthWrite = o.depthWrite;
          if (ghost) {
            opacity = Math.min(opacity, 0.12);
            transparent = true;
            depthWrite = false;
          } else if (faded) {
            opacity = Math.min(opacity, 0.1);
            transparent = true;
            depthWrite = false;
          } else if (unknown) {
            opacity = Math.min(opacity, 0.62);
            transparent = true;
          }
          if (m.transparent !== transparent) m.needsUpdate = true;
          m.opacity = opacity;
          m.transparent = transparent;
          m.depthWrite = depthWrite;
          const std = m as THREE.MeshStandardMaterial;
          if (std.emissive) {
            if (selected) {
              std.emissive.copy(ACCENT);
              std.emissiveIntensity = 0.55;
            } else if (hovered) {
              std.emissive.copy(HOVER);
              std.emissiveIntensity = 0.3;
            } else if (linked) {
              std.emissive.copy(LINKED);
              std.emissiveIntensity = 0.42;
            } else {
              std.emissive.copy(o.emissive ?? new THREE.Color(0));
              std.emissiveIntensity = o.emissiveIntensity ?? 1;
            }
          }
        });
        s.mesh.material = s.isArray ? mats : mats[0];
        s.mesh.castShadow = !ghost && !faded;
      }
    }
    this.dirty = true;
  }

  private applyExplode() {
    let maxTravel = 0;
    for (const n of this.nodes.values()) {
      for (const u of n.units) {
        // Absolute, from home: no drift however often this runs.
        u.obj.position.copy(u.home).addScaledVector(u.offset, this.explodeAmount);
        if (n.id !== "body-shell") maxTravel = Math.max(maxTravel, u.travel * this.explodeAmount);
      }
    }
    const cm = Math.round(maxTravel * 100);
    if (cm !== this.lastReadout) {
      this.lastReadout = cm;
      this.cb.onExplodeReadout(cm);
    }
  }

  /* ------------------------------------------------------------------ picking */

  private castAt(clientX: number, clientY: number): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickList, false);
    // Prefer solid surfaces; fall back to faded ones so isolate mode can still switch selection.
    for (const h of hits) {
      const m = (h.object as THREE.Mesh).material;
      const mat = (Array.isArray(m) ? m[h.face?.materialIndex ?? 0] ?? m[0] : m) as THREE.Material;
      if (mat.opacity >= 0.3) return h.object.userData.atlasId ?? null;
    }
    return hits.length ? (hits[0].object.userData.atlasId ?? null) : null;
  }

  private setHovered(id: string | null) {
    if (id === this.hovered) return;
    this.hovered = id;
    this.renderer.domElement.style.cursor = id ? "pointer" : "";
    this.applyMaterials();
    this.cb.onHover(id);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.buttons) return; // dragging the camera
    this.hoverPending = { x: e.clientX, y: e.clientY };
  };
  private onPointerDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  private onPointerUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (!d || e.button !== 0) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5 || performance.now() - d.t > 700) return;
    this.cb.onSelect(this.castAt(e.clientX, e.clientY));
  };
  private onPointerLeave = () => {
    this.hoverPending = null;
    this.setHovered(null);
  };

  /* ------------------------------------------------------------------ frame loop */

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private tick = (t: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = this.lastT ? Math.min(0.1, (t - this.lastT) / 1000) : 0.016;
    this.lastT = t;

    if (this.tween) {
      const k = Math.min(1, (performance.now() - this.tween.t0) / this.tween.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(this.tween.fromP, this.tween.toP, e);
      this.controls.target.lerpVectors(this.tween.fromT, this.tween.toT, e);
      if (k >= 1) this.tween = null;
      this.dirty = true;
    }
    if (this.controls.update()) this.dirty = true;

    if (this.explodeAmount !== this.explodeTarget) {
      if (this.explodeAmount === 0) this.dollyBase = this.camera.position.distanceTo(this.controls.target);
      this.explodeAmount = approach(this.explodeAmount, this.explodeTarget, dt);
      this.applyExplode();
      // Pull the camera back along its view line so the spread stays in frame.
      if (!this.tween && this.dollyBase > 0) {
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.camera.position.copy(this.controls.target).addScaledVector(dir, this.dollyBase * (1 + DOLLY * this.explodeAmount));
      }
      this.dirty = true;
    }

    if (this.hoverPending) {
      const p = this.hoverPending;
      this.hoverPending = null;
      this.setHovered(this.castAt(p.x, p.y));
    }

    if (this.dirty) {
      this.dirty = false;
      this.grid.visible = this.camera.position.y > 0.05;
      this.renderer.render(this.scene, this.camera);
      this.updateLabels();
    }
  };

  /* ------------------------------------------------------------------ labels */

  private labelFor(id: string) {
    let l = this.labels.get(id);
    if (!l) {
      const el = document.createElement("div");
      el.className = "atlas-label";
      el.dataset.id = id;
      el.textContent = COMPONENT_BY_ID[id]?.name.en ?? id;
      el.addEventListener("click", () => this.cb.onSelect(id));
      el.addEventListener("pointerenter", () => this.setHovered(id));
      el.addEventListener("pointerleave", () => this.setHovered(null));
      this.labelLayer.appendChild(el);
      l = { el, w: 0 };
      this.labels.set(id, l);
    }
    return l;
  }

  private screenOf(n: CompNode): { x: number; y: number; depth: number } | null {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    let best: { x: number; y: number; depth: number } | null = null;
    for (const u of n.units) {
      const p = u.obj.localToWorld(u.anchor.clone());
      const depth = p.distanceTo(this.camera.position);
      p.project(this.camera);
      if (p.z < -1 || p.z > 1) continue;
      const s = { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, depth };
      if (!best || s.depth < best.depth) best = s;
    }
    return best;
  }

  private updateLabels() {
    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    // Inside a solid body, labels would point at parts you cannot see. Show general labels
    // only when the shell is see-through, hidden or the model is exploded (wheels excepted).
    const shellSolid = this.visibleSystems.body && this.bodyMode === "solid" && this.explodeAmount < 0.05;
    const cands: { n: CompNode; x: number; y: number; prio: number }[] = [];
    for (const n of this.nodes.values()) {
      const l = this.labels.get(n.id);
      const want =
        n.group.visible &&
        (n.id === this.selected || n.id === this.hovered || this.linked.has(n.id) || (this.showLabels && n.id !== "body-shell" && !(this.isolate && this.selected) && (!shellSolid || n.record.system === "wheels")));
      if (!want) {
        if (l) l.el.style.display = "none";
        continue;
      }
      const s = this.screenOf(n);
      if (!s) {
        if (l) l.el.style.display = "none";
        continue;
      }
      const prio = n.id === this.selected ? 0 : n.id === this.hovered ? 1 : this.linked.has(n.id) ? 2 : 3 + s.depth;
      cands.push({ n, x: s.x, y: s.y, prio });
    }
    cands.sort((a, b) => a.prio - b.prio);
    for (const c of cands) {
      const l = this.labelFor(c.n.id);
      if (!l.w) {
        l.el.style.display = "block";
        l.w = l.el.offsetWidth || 120;
      }
      const x0 = c.x + 8, y0 = c.y - 11, x1 = x0 + l.w, y1 = y0 + 20;
      const overlaps = placed.some((p) => x0 < p.x1 + 2 && x1 > p.x0 - 2 && y0 < p.y1 + 1 && y1 > p.y0 - 1);
      if (overlaps && c.prio >= 3) {
        l.el.style.display = "none";
        continue;
      }
      placed.push({ x0, y0, x1, y1 });
      l.el.style.display = "block";
      l.el.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px)`;
      l.el.classList.toggle("is-selected", c.n.id === this.selected);
      l.el.classList.toggle("is-hovered", c.n.id === this.hovered);
      l.el.classList.toggle("is-linked", this.linked.has(c.n.id));
    }
  }

  /* ------------------------------------------------------------------ export & debug */

  /** A fresh placeholder model as a binary GLB, ready to import into Blender. */
  async exportPlaceholderGLB(): Promise<ArrayBuffer> {
    const root = new THREE.Group();
    root.name = "YarisAtlas";
    root.userData = { atlas_units: "metres", atlas_up: "+Y", atlas_forward: "+Z", atlas_left: "+X" };
    const objs = buildPlaceholderObjects(COMPONENT_IDS);
    for (const [id, obj] of objs) {
      const rec = COMPONENT_BY_ID[id];
      obj.userData = { atlas_id: id, atlas_system: rec.system, atlas_name: rec.name.en };
      root.add(obj);
    }
    const exporter = new GLTFExporter();
    const out = await exporter.parseAsync(root, { binary: true, onlyVisible: false });
    return out as ArrayBuffer;
  }

  debugInfo() {
    this.modelRoot.updateMatrixWorld(true);
    return {
      ready: this.assetStatus !== null,
      selected: this.selected,
      hovered: this.hovered,
      explode: { amount: this.explodeAmount, target: this.explodeTarget },
      camera: { position: this.camera.position.toArray(), target: this.controls.target.toArray() },
      pickable: this.pickList.length,
      components: [...this.nodes.values()].map((n) => ({
        id: n.id,
        system: n.record.system,
        visible: n.group.visible,
        source: n.source,
        units: n.units.map((u) => ({ name: u.obj.name, home: u.home.toArray(), position: u.obj.position.toArray() })),
      })),
    };
  }

  /** Screen position (CSS px, relative to the page) of a component's nearest unit centre. */
  projectComponent(id: string): { x: number; y: number } | null {
    const n = this.nodes.get(id);
    if (!n) return null;
    const s = this.screenOf(n);
    if (!s) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + s.x, y: r.top + s.y };
  }

  /** Which component a click at this page position would select (for tests). */
  pickAt(x: number, y: number): string | null {
    return this.castAt(x, y);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelLayer.remove();
  }
}
