import { useEffect, useState } from "react";
import { actions, store, useApp } from "./state/store";
import { loadPrivateConfig } from "./lib/privateConfig";
import { storageAvailable } from "./lib/storage";
import { TopBar } from "./components/TopBar";
import { Rail } from "./components/Rail";
import { ViewerHost } from "./components/ViewerHost";
import { Dock } from "./components/Dock";
import { SidePanel } from "./components/SidePanel";

function Toast() {
  const toast = useApp((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return visible && toast ? (
    <div className="toast" role="status">
      {toast.text}
    </div>
  ) : null;
}

function StageOverlay() {
  const status = useApp((s) => s.assetStatus);
  return (
    <>
      {!status ? <div className="stage-status">Building the model…</div> : null}
      <div className="stage-note" data-testid="approx-note">
        <b>Approximate placeholder — not a digital twin.</b> Sized to your registered 3790 × 1700 mm; shape and part positions are estimates. Grid squares are 1
        m. <span className="dash" />
        dashed outline = location unknown.
      </div>
    </>
  );
}

export function App() {
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    store.set({ storageOk: storageAvailable() });
    void loadPrivateConfig().then((privateConfig) => store.set({ privateConfig }));
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "Escape") {
        if (store.get().isolate) store.set({ isolate: false });
        else actions.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`app${railCollapsed ? " rail-collapsed" : ""}`}>
      <TopBar onToggleRail={() => setRailCollapsed((c) => !c)} railCollapsed={railCollapsed} />
      <div className="main">
        <Rail />
        <section className="stage" aria-label="3D view">
          <ViewerHost />
          <StageOverlay />
          <Dock />
        </section>
        <SidePanel />
      </div>
      <Toast />
    </div>
  );
}
