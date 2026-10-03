# Asset licence and attribution manifest

Every piece of geometry, texture or image the app can display is listed here. Update
this file, and the matching entry in `public/models/asset-manifest.json`, **before**
adding any third-party file to `public/models/`.

| Asset | Where | Creator | Source | Licence | Attribution required | May ship in a browser app | Geometry status |
|---|---|---|---|---|---|---|---|
| Built-in placeholder parts (34 components) | `src/viewer/placeholders.ts` | This project | Generated in code | Same as this repository (licence not yet chosen) | No | Yes | Approximate: estimated positions and primitive shapes |
| Built-in body silhouette | `src/viewer/bodyShell.ts` | This project | Generated in code from registered length/width and a secondary source's height/wheelbase | Same as this repository | No | Yes | Approximate: hand-drawn profile curves; blank number plates |
| `public/models/yaris-atlas.glb` (optional) | Not present by default | You | Your Blender export | Your own work, unless it contains third-party parts (then list them below) | — | Yes, if all its contents allow it | Approximate until checked against the car |

## Third-party assets

None yet.

Template for a new row:

| Asset | Where | Creator | Source URL | Licence (exact name and version) | Attribution text | Ships in browser? | Modified? | Geometry status |
|---|---|---|---|---|---|---|---|---|
| e.g. Vitz body shell | `public/models/yaris-atlas.glb` → `body-shell` | Raysh | https://sketchfab.com/3d-models/… | CC BY 4.0 | "2008 Toyota Vitz RS CVT [NPC91]" by Raysh, CC BY 4.0, via Sketchfab | Yes | Decimated, renamed, re-origined | Approximate: different market variant |

Trademarks: Toyota names and logos belong to Toyota. A CC licence on a model does not
license the trademarks it depicts. The app uses the name only to describe the car.
