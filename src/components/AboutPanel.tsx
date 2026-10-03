import { useState } from "react";
import { useApp, actions } from "../state/store";
import { COMPONENTS } from "../data/components";
import { SOURCES } from "../data/sources";
import { SYMPTOM_FLOWS } from "../data/symptoms";
import { EvidenceLegend } from "./Evidence";

export function AboutPanel() {
  const status = useApp((s) => s.assetStatus);
  const [busy, setBusy] = useState(false);

  const exportGlb = async () => {
    const viewer = window.__atlas?.viewer;
    if (!viewer) {
      actions.toast("Viewer not ready yet");
      return;
    }
    setBusy(true);
    try {
      const buf = await viewer.exportPlaceholderGLB();
      const url = URL.createObjectURL(new Blob([buf], { type: "model/gltf-binary" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "yaris-atlas-placeholders.glb";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  };

  const glbIds = status ? Object.keys(status.fromGlb) : [];

  return (
    <div className="panel-body" data-testid="about">
      <h2>About this atlas</h2>
      <p>
        An interactive guide to one specific Toyota Yaris: what the parts are, roughly where they sit, and how to think through a symptom. It is a learning
        aid — <b>not</b> a digital twin, a workshop manual or a diagnosis tool.
      </p>

      <h3>How much to trust what you see</h3>
      <EvidenceLegend />
      <p className="small">
        Parts drawn with a <span style={{ borderTop: "2px dashed #d9902b", display: "inline-block", width: 18, verticalAlign: "middle" }} /> dashed amber outline
        have an <b>unknown</b> location on your car; they are shown only as reminders.
      </p>

      <h3>3D geometry</h3>
      {!status ? <p className="muted">Loading…</p> : null}
      {status ? (
        <div className="card" data-testid="asset-status">
          <div className="small">
            <b>{status.placeholders.length}</b> parts use built-in placeholders · <b>{glbIds.length}</b> from GLB files
          </div>
          {status.manifest !== "loaded" ? <div className="small muted">Asset manifest {status.manifest}; using placeholders only.</div> : null}
          {status.results.map((r) => (
            <div key={r.entry.id} className="small" style={{ marginTop: 6 }} data-asset={r.entry.id} data-asset-status={r.status}>
              <code>{r.entry.file}</code> —{" "}
              {r.status === "loaded" ? `loaded, ${r.mapped.length} parts mapped` : r.status === "missing" ? "not present (optional) — placeholders used" : `could not be loaded: ${r.message}`}
              {r.unmapped.length ? <div className="muted">Objects with no matching ID: {r.unmapped.slice(0, 8).join(", ")}</div> : null}
              {r.duplicates.length ? <div className="muted">Duplicate IDs ignored: {r.duplicates.join(", ")}</div> : null}
              {r.empty.length ? <div className="muted">Matched but no mesh (placeholder kept): {r.empty.join(", ")}</div> : null}
              {r.entry.licence ? (
                <div className="muted">
                  Licence: {r.entry.licence}
                  {r.entry.attribution ? ` · ${r.entry.attribution}` : ""}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <p className="small">
        Every part has a stable ID. To replace a placeholder, export an object with that ID from Blender into <code>public/models/yaris-atlas.glb</code>. Start
        from the current placeholders:
      </p>
      <button className="btn" onClick={exportGlb} disabled={busy}>
        {busy ? "Preparing…" : "Download placeholder GLB for Blender"}
      </button>
      <p className="muted small" style={{ marginTop: 6 }}>
        See <code>docs/BLENDER-GLB-WORKFLOW.md</code> for scale, axes, naming and export settings.
      </p>

      <h3>What is in here</h3>
      <p className="small">
        {COMPONENTS.length} components · {SYMPTOM_FLOWS.length} symptom investigations · {SOURCES.length} recorded sources. No part numbers, torque values,
        fluid specifications, fuse assignments, wiring or service intervals — take those from documentation that matches your exact variant.
      </p>

      <h3>Privacy</h3>
      <p className="small">
        Your registration number and VIN stay in <code>config/vehicle.local.json</code> on this computer. The app makes no network requests except to load its own
        files, and the build checks that private identifiers never end up in it.
      </p>
    </div>
  );
}
