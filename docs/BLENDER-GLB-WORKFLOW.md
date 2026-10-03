# Blender → GLB workflow

The app ships with built-in placeholder geometry. Any part can be replaced by a GLB
object that carries the same **stable component ID** — labels, selection, system
visibility, search, the inspector and the exploded view keep working, because they are
keyed by ID, not by geometry.

You never have to model everything. Replace one part at a time; whatever is missing
from your GLB keeps its placeholder.

---

## 1. Units and axes

| | In the app (three.js / glTF) | In Blender |
|---|---|---|
| Unit | 1 = 1 metre | 1 Blender unit = 1 metre (Scene → Units: Metric, Unit Scale 1.0) |
| Up | **+Y** | **+Z** |
| Front of the car | **+Z** | **−Y** (the car faces you in Front view, numpad 1) |
| Car's left side (driver's side in Norway) | **+X** | **+X** |
| Origin | On the ground, centred under the car, halfway along the registered 3790 mm length | Same point |

The glTF exporter converts Blender's Z-up to glTF's Y-up when **+Y Up** is ticked
(the helper script always does this). Example: the placeholder battery sits at
app (0.48, 0.75, 1.40) and imports into Blender at (0.48, −1.40, 0.75).

Reference dimensions used by the placeholders (see the Vehicle panel for sources):
length 3.790 m and width 1.700 m (registration), height 1.530 m and wheelbase 2.460 m
(secondary source for the XP90 facelift), front axle at Z = +1.155, rear axle at
Z = −1.305 (overhang split estimated), tyre diameter ≈ 0.603 m (185/60 R15).

## 2. Object names and stable IDs

* Each component is **one top-level object** named exactly like its ID — for example
  `battery`, `front-brakes`, `body-shell`. The full list is in
  [`blender/component-ids.json`](../blender/component-ids.json) and in the app
  (Inspector → bottom line shows the ID).
* Put the meshes **underneath** that object (Empty parent + mesh children), or make the
  object itself a mesh. Everything below it belongs to that component.
* Blender's duplicate suffix is tolerated: `battery.001` still maps to `battery`.
* The most robust option is a custom property `atlas_id` (Object Properties → Custom
  Properties) holding the ID. The helper script adds it for you. With it, you may name
  the object anything you like.
* **Never rename an ID casually.** Log entries, confirmations and GLBs refer to it.
  If you must, rename it in `src/data/components.ts`, the placeholder table, and run
  `npm run gen:ids`.

### Sided components

`front-wheels`, `rear-wheels`, `front-brakes`, `rear-brakes`, `front-suspension` and
`drive-shafts` exist on both sides. Give each of them exactly two child objects:

```
front-wheels            (Empty, atlas_id = "front-wheels")
├── front-wheels_L      (left side, +X)  → meshes…
└── front-wheels_R      (right side, −X) → meshes…
```

Each child explodes outward on its own side.

### Objects the app ignores

Top-level objects whose names are not IDs (cameras, lights, reference images, a
"Cube") are ignored and listed under **About → 3D geometry** as "no matching ID".
An object that matches an ID but contains no mesh (for example an empty Empty) is
also ignored, and the placeholder stays.

## 3. Origins and assembled positions

* Place every part **where it sits on the assembled car**. That position is the part's
  "home".
* Put each component object's origin roughly at the part's centre (Object → Set
  Origin → Origin to Geometry, on the parent). It is not critical: the app measures
  each part's bounding box.
* Apply scale (Ctrl+A → Scale) on meshes. Negative scale flips normals.
* Keep everything at or above the ground (Z ≥ 0 in Blender).

### How the exploded view is derived (no drift)

When the app loads, it stores each part's assembled local position (`home`) and
computes, once, a direction and travel distance from:

1. the part's centre relative to the middle of the car,
2. its system's "fan" direction (engine up, cooling forward, exhaust down …), and
3. optional overrides in `src/data/components.ts` (`explode: { dir, spread }`).

Every frame, positions are recomputed **absolutely**: `position = home + offset × amount`.
They are never accumulated, so moving the slider back to 0 returns every part to
exactly where your GLB put it. The audit checks this to the last bit.

## 4. Materials and textures

* A material named `atlas-<name>` is replaced by the app's built-in material of that
  name, so placeholder-style parts look consistent. Available names:
  `paint-silver`, `glass`, `light-clear`, `light-red`, `light-amber`, `plastic-black`,
  `plastic-grey`, `plastic-yellow`, `plastic-red`, `trim-dark`, `plate`, `rubber`,
  `tyre`, `metal-steel`, `metal-cast`, `metal-aluminium`, `metal-dark`, `metal-wheel`,
  `metal-exhaust`, `battery-case`, `fluid-reservoir`, `friction`, `electronics-box`.
* Any other material (Principled BSDF with textures) is exported and shown as it is.
  Use PNG or JPEG textures, power-of-two sizes, 2048 px or smaller.
* "System colours" mode always overrides materials with the system's flat colour;
  "Realistic" shows your materials.
* No Draco compression (the app does not ship a decoder). Keep a whole-car file under
  roughly 20–30 MB for a smooth laptop experience.

## 5. Step by step in Blender (Steam version is fine)

**One-time:** nothing to install. The helper is a plain script.

1. In the app open **About → Download placeholder GLB for Blender**. You get
   `yaris-atlas-placeholders.glb` with every part at its placeholder position.
2. Start Blender → **File → New → General**, then delete the default cube, camera and
   light.
3. Switch to the **Scripting** workspace → **Text → Open…** →
   `blender/yaris_atlas_tools.py` → **Run Script** (▶).
4. Back in the **Layout** workspace, press **N** in the 3D viewport and open the
   **Yaris Atlas** tab:
   * **Import placeholder GLB** → pick the file from step 1. Parts land in collection
     `YarisAtlas`, one sub-collection per system.
   * Model, refine or replace parts. Keep the top-level object names.
   * **Validate** → reads problems back to you (missing IDs, missing `_L`/`_R`
     children, negative scale, parts below ground, unknown objects).
   * **Export GLB for the app** → save as `public/models/yaris-atlas.glb` in this
     repository.
5. Reload the browser. **About → 3D geometry** shows how many parts now come from your
   GLB and lists any objects it could not map.

Command line equivalent (Blender does not need to be open; path shown for the Steam
install):

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe" --background \
  --python blender/yaris_atlas_tools.py -- \
  --import yaris-atlas-placeholders.glb --validate \
  --export public/models/yaris-atlas.glb
```

### Export settings (if you export by hand instead of using the panel)

File → Export → glTF 2.0: Format **glTF Binary (.glb)**; Include → **Custom
Properties** ✔, limit to the `YarisAtlas` collection; Transform → **+Y Up** ✔;
Data → Mesh → **Apply Modifiers** ✔; Compression ✘; no cameras, lights or animation.

## 6. Mapping imported objects to components

At load time the app, for every object in the GLB, tries in order:

1. the `atlas_id` custom property (glTF extras),
2. the original Blender object name,
3. the glTF node name,

each lower-cased with `.001`-style suffixes removed. The first (top-most) object that
matches an ID claims it and everything beneath it. A second object with the same ID is
ignored and reported as a duplicate. The mapping code is in
[`src/viewer/assets.ts`](../src/viewer/assets.ts), and the unit tests are in
[`tests/assets.test.ts`](../tests/assets.test.ts).

Files to load are listed in [`public/models/asset-manifest.json`](../public/models/asset-manifest.json).
Add entries there for more GLBs (for example one per system). Earlier files win if
two files contain the same ID.

## 7. Using third-party models

Before a downloaded model goes into `public/models/`:

1. Check the licence on the listing itself and record it in
   [`docs/ASSET-LICENCES.md`](ASSET-LICENCES.md) and in the manifest entry
   (`licence`, `attribution`, `source`, `creator`).
2. A browser app serves the GLB as a plain file anyone with access could download.
   Only CC0, CC-BY or similarly permissive licences clearly allow that. Many
   marketplace licences forbid it. See [`docs/ASSET-SOURCING.md`](ASSET-SOURCING.md).
3. Rename or wrap its objects with the IDs above; delete what you do not need.
4. Keep `geometryStatus: "approximate"` unless you have checked the model against the
   real car.

`public/models/*.glb` is gitignored on purpose, so nothing is committed until you
decide it may be.
