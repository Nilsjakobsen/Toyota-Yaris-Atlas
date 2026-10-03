# 3D asset sourcing shortlist

Researched 2 October 2026. **Nothing was downloaded, bought or bundled.** The app
currently uses only its own placeholder geometry.

How listings were checked: Sketchfab pages render with JavaScript, so their details
were read from Sketchfab's public listing API (`api.sketchfab.com/v3/models/<uid>`),
which returns the licence, face count and description the creator entered. "Re-checked"
means the listing was read a second time while building the app. TurboSquid, CGTrader,
Free3D and Hum3D blocked automated access (HTTP 403), so their candidates are marked
**listing not verified**. Do not rely on them until you have read the listing yourself.

No listing said whether doors or wheels are separate objects. Inspect the node tree
after downloading (Blender's Outliner).

## Bottom line

* **No exact, permissively licensed match was found** for a European XP90 facelift
  5-door with separate mechanical parts.
* The best candidate for a body shell is a **CC-BY XP90-platform Vitz** (the Japanese
  sister model), with visible differences (Japanese-market RS body kits, right-hand
  drive). It would still need checking against your car.
* No vehicle listing includes an engine bay or mechanical parts. Mechanical detail would
  come from **generic CC-BY / CC0 component models**, each relabelled as generic.
* Keep the honest placeholders until you decide whether a "close but not exact" body is
  better for you than an obviously approximate one.

## Vehicle candidates

| # | Listing (creator) | Claimed model | Licence → may it ship in a browser app? | Format | Size | Contents | Price / caveats |
|---|---|---|---|---|---|---|---|
| 1 | [2008 Toyota Vitz RS CVT [NPC91]](https://sketchfab.com/3d-models/2008-toyota-vitz-rs-cvt-npc91-089990b5c9934a45940be32bb5c1cb40) (Raysh) | "2008 Toyota Vitz RS CVT [NPC91]". XP90 platform, Japanese-market Vitz | **CC-BY 4.0**: yes, with attribution (re-checked) | Download offered as glTF/GLB (source FBX) | 395,182 faces, 40 materials, 10 textures (re-checked) | Exterior plus "select interior options" (pedals, trays, tonneau cover). No engine mentioned | Free. Ships with RS/TRD/Modellista/Damd body kits and right-hand drive. Whether it is facelift styling is uncertain; check visually. Heavy for the web; decimate |
| 2 | [Toyota Yaris MK3 2011-2020](https://sketchfab.com/3d-models/toyota-yaris-mk3-2011-2020-a735fe6fe72049299c186e5db62a8d23) (Merc_TV) | XP130 (the *next* generation) | CC-BY: yes, with attribution | GLB (source DAE) | ~78k faces, 21 materials, no textures | Not described | Free. Wrong generation if your car is XP90. Origin of the mesh unknown |
| 3 | [2007 Toyota Yaris Hatchback](https://sketchfab.com/3d-models/2007-toyota-yaris-hatchback-b63626fbe9f84555a92b2feb82ac520a) (DogeAvalon2006) | XP90 pre-facelift | Sketchfab Free Standard: **no**, the Standard licence forbids making the asset available as a stand-alone file | GLB | ~26k faces | Rigged | Free. The same uploader's other Yaris says "Taken from a BeamNG mod", so provenance is doubtful |
| 4 | [Toyota Vitz RS 1.5 2007](https://sketchfab.com/3d-models/toyota-vitz-rs-15-2007-6d765909a55f4851b2ec0b1dea29c623) (DR1KING100K) | Vitz RS 1.5 2007 (XP90 per description) | CC-BY: yes, with attribution | GLB (source FBX) | ~327k faces | Description is spec text only | Free. Origin unknown |
| 5 | [Toyota Yaris 2009 Liftback](https://www.squir.com/toyota-yaris-2009-liftback-3d-model.html) (SQUIR) | Yaris 2009 5-door; the year fits the facelift | Editorial licence that forbids "any free download… through any app": **no**, unless SQUIR grants a custom licence | 3DS/LWO/MAX/OBJ/XSI/C4D, **no GLB** | ~340k polys | Textured; interior not stated | €59. The closest *claimed* match, but the licence does not suit a browser app |
| 6 | [Toyota Yaris Vitz Hatchback](https://www.renderhub.com/holy360/toyota-yaris-vitz-hatchback) (Holy360) | Generation **not stated** | RenderHub Extended Use / Editorial, IP-restricted. Educational use is allowed with credit, but re-check the anti-extraction terms | blend/fbx/obj | ~51k | Doors open, separate wheels, interior, 4K PBR textures | $35. Generation unconfirmed |
| 7 | [Toyota Yaris 2012 Lowpoly](https://www.renderhub.com/igor-shmidt/toyota-yaris-2012-lowpoly) (Igor Shmidt) | Probably XP130 (not stated) | As #6 | blend/fbx | ~16.5k | "Simple interior", no textures | $20 |
| 8 | [2009 Toyota Yaris (PS1 style)](https://sketchfab.com/3d-models/2009-toyota-yaris-8c66eb592afb4ea7872fc219a5c467e8) (ImperialBlue3D) | 2009 Yaris, **3-door**, retro low-poly | CC-BY: yes | GLB | ~2.4k | Exterior only | Free. Only good as a stylised placeholder |

**Listing not verified** (seen only in search snippets): TurboSquid "2 Yaris" #467329
("Yaris II 2008–2010 with facelift option, 5-door"), TurboSquid 3-door #489287, CGTrader
"Toyota Yaris Vitz 5door 2012", Hum3D "Yaris (Vitz) 5door 2014".

**Avoid:** "2007 Toyota Yaris" (b0e5c550…), a sedan the uploader says is a BeamNG mod;
"Toyota Yaris II" (9c9e3890…), whose source file name suggests a game rip; "2014 Toyota
Yaris" by teenlin3, tagged as AI-generated (Hunyuan3D), a single 1.5M-face mesh.

## Generic mechanical components (Sketchfab, GLB available)

| Model (creator) | Licence | Faces | Notes |
|---|---|---|---|
| [Engine Chevy Chevette 1977](https://sketchfab.com/3d-models/ef123ab4b01140179745751dab5d7864) (flow3d) | CC-BY | ~440k | Animated internals, alternator, water pump, air filter. A carburetted 1970s engine: label it generic |
| [Inline-4 Engine Modelling & Rigging Study](https://sketchfab.com/3d-models/652cf3def1ae40b7a6e546e62ed19778) (s1d.fx0) | CC-BY | ~28k | Pistons, crank and rods only. Light enough for the web |
| [Car wheel with brake disc – Low poly](https://sketchfab.com/3d-models/5b9bb83857674cd5a866f35fbf7fe8d4) (MMC Works) | CC-BY | ~8.2k | Tyre, rim, disc, caliper |
| [MacPherson suspension strut](https://sketchfab.com/3d-models/bd202ee134454402bf398ca906c8e2f5) (vr.designer_09) | CC-BY | ~98k | STL origin, probably one mesh |
| [Catalytic converter, 1982–1983](https://sketchfab.com/3d-models/5e59f014795748e5b8354d6321eaf082) (Science Museum Group) | **CC0** | ~60k | Museum scan, textured |
| [Car battery cut through](https://sketchfab.com/3d-models/455c1b96e8214b45ac06bb2742d8b50d) (klaxoneer) | CC-BY | ~50k | Cross-section; useful for explaining a battery |

The research step also found CC-BY models of a steering gear (Dubina Evo, ~1.1k faces),
an alternator (dilkaarrow, ~7.7k) and a radiator (terllok, ~812). Those links were not
re-checked.

## Licence notes

* **CC-BY / CC0:** sharing in any medium is allowed. CC-BY requires credit: creator,
  title, link and licence. Neither licence grants **trademark** rights, so do not
  present Toyota logos or branding as licensed.
* **Sketchfab Standard / Free Standard:** the licence text (seen via search; the page
  itself could not be fetched) forbids making the asset available "in a way that allows
  third parties to use, download, extract or access the Licensed Material as a
  stand-alone file". A GLB served to a browser is exactly such a file.
* **TurboSquid** ([licence summary](https://blog.turbosquid.com/turbosquid-3d-model-license/)):
  real-time use requires a proprietary format "so that they cannot be opened or
  imported… or extracted without reverse engineering". A plain GLB fails this.
* **CGTrader** ([terms](https://www.cgtrader.com/pages/terms-and-conditions)): real-time
  use requires a proprietary format and "commercially reasonable measures" against
  extraction. Editorial means newsworthy use only.
* **RenderHub** ([licensing](https://www.renderhub.com/info/3d-content-licensing)):
  Editorial Use includes "academic or educational value", and credit must read "copyright
  [Seller] via RenderHub". Re-read the extraction terms before relying on it.

For a model that only ever runs on your own computer, the practical risk is low. But
the app is easy to share, so prefer CC-BY/CC0 and record attribution from day one.

## Recommendation

1. Keep the placeholders for now. They are honest about being approximate.
2. If you want a more realistic body: download candidate #1 yourself, check it in
   Blender against photos of your car, decimate it to under ~100k faces, rename the
   root to `body-shell`, add the attribution to `docs/ASSET-LICENCES.md` and the
   manifest, and keep it labelled approximate.
3. Swap mechanical placeholders for generic CC-BY parts only where the extra realism
   helps understanding (wheel/brake corner, battery). Label them generic.
4. Best long-term option: model the few parts you can see on **your** car (battery,
   reservoirs, fuse box, air box) in Blender from your own photos and measurements.
   Then the locations become owner-confirmed rather than estimated.
