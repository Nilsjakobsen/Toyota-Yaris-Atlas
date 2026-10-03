# Architecture

A Vite + React + TypeScript single-page app with a plain three.js viewer. There is no
backend. Everything runs in the browser on your own computer.

```
src/
  data/          What the app knows — plain typed data, no UI code
    types.ts         Evidence levels and record shapes (start here)
    components.ts    34 component records: function, location, presence, symptoms, sources
    systems.ts       10 systems: names, colours, explode fan directions
    sources.ts       Every cited source, with the variant it applies to
    vehicle.ts       Owner-supplied facts, variant facts, open questions
    symptoms.ts      7 investigation flows (questions, possibilities, safety notes)
    obdCodes.ts      Small table of generic OBD code meanings (manual entry only)
    presets.ts       Camera views
  viewer/        Everything three.js
    AtlasViewer.ts   Renderer, camera, picking, hover/selection, labels, explode, export
    placeholders.ts  Approximate geometry per component ID (+ builder)
    bodyShell.ts     Procedural body silhouette
    assets.ts        GLB manifest loading and object → ID mapping
    explode.ts       Pure explode maths (unit-tested; no drift)
    materials.ts     Built-in material library ("atlas-<name>")
  state/store.ts Tiny external store (no dependency) + persistence to localStorage
  lib/           search (EN/NO folding), log (export/import validation), flow evaluation,
                 private config loading, guarded storage
  components/    React UI: TopBar, Rail, Dock, SidePanel → Inspector, SymptomPanel,
                 LogPanel, VehiclePanel, AboutPanel
blender/         Blender helper script + generated component-ids.json
tools/           audit (browser end-to-end), privacy check, ID generator, Blender self-test
tests/           Vitest unit tests (data integrity, explode, search, log, flows, assets)
config/          vehicle.example.json (committed) / vehicle.local.json (private, ignored)
```

## How the pieces talk

```
 React components ──actions──▶ store ◀──subscribe── ViewerHost ──setters──▶ AtlasViewer
        ▲                        │                                              │
        └──────useApp(selector)──┘                 callbacks: onSelect/onHover/onAssets
```

* The **store** holds UI state: selection, visible systems, body mode, explode slider,
  panel, log, answers. React reads slices with `useApp`. `ViewerHost` subscribes and
  calls the viewer's setters only when a slice changes.
* The **viewer** never imports React. It renders on demand (only when something
  changed), raycasts on hover/click, and reports back through callbacks.
* **Component IDs** are the only coupling between data, geometry and UI. A GLB object
  named `battery` becomes the battery everywhere.

## Key decisions

* **Evidence levels on every claim** (`owner`, `verified`, `generic`, `approximate`,
  `unknown`) drive the badges, so trust is visible without extra text.
* **Placeholders and GLBs are interchangeable.** The viewer builds placeholders only for
  IDs the GLB did not provide. Missing, corrupt or partial files fall back silently and
  are reported under About.
* **Explode is absolute.** `position = home + offset × amount`, with `home` captured
  once at load. See `explode.ts`.
* **Picking ignores ghosted shells.** The see-through body is excluded from the pick
  list, so you can click parts inside it. Hidden systems are excluded too.
* **Private identifiers never enter the bundle.** The dev/preview server serves
  `config/vehicle.local.json` at `/__local/vehicle.json` (see `vite.config.ts`). No code
  imports the file, and `npm run build` ends with a scan of `dist/` and of every file Git
  would commit.
* **Symptom flows are data, not code.** Possibilities list the answers that support or
  weaken them. The UI groups them by fit and never shows a probability.

## Testing

* `npm test`: unit tests. Every component has a record and geometry and vice versa;
  flows reference real questions, options and parts; search finds every part by its
  English and Norwegian names; export/import round-trips; no explode drift.
* `npm run audit`: drives the production build in Edge/Chrome. It covers real clicks,
  hover, search, toggles, explode/restore, reset, flows, OBD entry, persistence across
  reload, export/import, masking, broken/missing/partial GLBs, and a Blender round trip
  when Blender is installed.
