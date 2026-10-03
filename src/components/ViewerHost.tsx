import { useEffect, useRef } from "react";
import { AtlasViewer } from "../viewer/AtlasViewer";
import { actions, store, type AppState } from "../state/store";
import { PRESET_BY_ID } from "../data/presets";

declare global {
  interface Window {
    __atlas?: { viewer: AtlasViewer; store: typeof store; actions: typeof actions };
  }
}

/** Mounts the three.js viewer and keeps it in sync with the app store. */
export function ViewerHost() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const viewer = new AtlasViewer(el, {
      onHover: (id) => store.set({ hoveredId: id }),
      onSelect: (id) => actions.select(id),
      onAssets: (assetStatus) => store.set({ assetStatus }),
      onExplodeReadout: (cm) => store.set({ explodeCm: cm }),
    });

    let prev: AppState | null = null;
    const sync = () => {
      const s = store.get();
      if (!prev || prev.visibleSystems !== s.visibleSystems) viewer.setVisibleSystems(s.visibleSystems);
      if (!prev || prev.bodyMode !== s.bodyMode) viewer.setBodyMode(s.bodyMode);
      if (!prev || prev.colourMode !== s.colourMode) viewer.setColourMode(s.colourMode);
      if (!prev || prev.selectedId !== s.selectedId) viewer.setSelected(s.selectedId);
      if (!prev || prev.linkedIds !== s.linkedIds) viewer.setLinked(s.linkedIds);
      if (!prev || prev.isolate !== s.isolate) viewer.setIsolate(s.isolate);
      if (!prev || prev.labels !== s.labels) viewer.setLabels(s.labels);
      if (!prev || prev.explode !== s.explode) viewer.setExplode(s.explode);
      if (s.camRequest && (!prev || prev.camRequest?.nonce !== s.camRequest.nonce)) {
        const r = s.camRequest;
        if (r.kind === "reset") viewer.resetView();
        else if (r.kind === "focus" && r.id) viewer.focus(r.id);
        else if (r.kind === "preset" && r.id && PRESET_BY_ID[r.id]) viewer.goTo(PRESET_BY_ID[r.id]);
      }
      prev = s;
    };
    sync();
    const unsub = store.subscribe(sync);

    const params = new URLSearchParams(window.location.search);
    if (import.meta.env.DEV || params.has("debug")) window.__atlas = { viewer, store, actions };

    return () => {
      unsub();
      viewer.dispose();
      if (window.__atlas?.viewer === viewer) delete window.__atlas;
    };
  }, []);

  return <div className="viewer-host" ref={ref} data-testid="viewer" />;
}
