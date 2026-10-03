"""
Developer self-test for the Blender pipeline, run by tools/audit.mjs when Blender is found.

  blender --background --factory-startup --python tools/blender_selftest.py -- \
      <placeholders.glb> <roundtrip-out.glb> <partial-out.glb>

1. Imports the app's placeholder GLB with blender/yaris_atlas_tools.py, validates, exports.
2. Builds a deliberately partial file: only `battery` and `front-wheels` kept, plus an
   unrelated "Cube" and an EMPTY named "radiator" — the app should map 2 parts, report
   "Cube" as unmapped, and keep the radiator placeholder because the empty has no mesh.
"""
import os
import sys

import bpy

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(here), "blender"))
import yaris_atlas_tools as yat  # noqa: E402

src, roundtrip, partial = sys.argv[sys.argv.index("--") + 1:][:3]

# Start from an empty scene (factory startup adds a cube, camera and light).
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

yat.import_placeholders(src)
report = yat.validate()
yat.print_report(report)
if any(level != "ok" for level, _ in report):
    print("[selftest] validation reported problems on a clean import")
    sys.exit(1)
yat.export_glb(roundtrip)

known = yat.load_component_ids()
keep = {"battery", "front-wheels"}
for o in yat.atlas_root_objects(known):
    if yat.component_id_of(o, known) not in keep:
        for d in [o] + list(o.children_recursive):
            bpy.data.objects.remove(d)
coll = bpy.data.collections[yat.ROOT_COLLECTION]
empty = bpy.data.objects.new("radiator", None)
coll.objects.link(empty)
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(0, 0, 3))
cube = bpy.context.active_object
cube.name = "Cube"
for c in list(cube.users_collection):
    c.objects.unlink(cube)
coll.objects.link(cube)
yat.print_report(yat.validate())
yat.export_glb(partial)
print("[selftest] done")
