import { actions, store, useApp } from "../state/store";

const STEPS = 1000;

export function Dock() {
  const explode = useApp((s) => s.explode);
  const cm = useApp((s) => s.explodeCm);
  const labels = useApp((s) => s.labels);
  const isolate = useApp((s) => s.isolate);
  const selected = useApp((s) => s.selectedId);

  return (
    <div className="dock" role="toolbar" aria-label="View controls">
      <label htmlFor="explode">Explode</label>
      <input
        id="explode"
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(explode * STEPS)}
        aria-valuetext={`${cm} centimetres`}
        onChange={(e) => store.set({ explode: Number(e.target.value) / STEPS })}
      />
      {/* Fixed width so the centred dock never shifts while dragging. */}
      <span className="readout" aria-hidden="true">
        {cm ? `+${cm} cm` : "0 cm"}
      </span>
      <button className="dock-btn" onClick={() => store.set({ explode: 0 })} disabled={explode === 0} title="Put every part back in its assembled position">
        Assemble
      </button>
      <div className="dock-sep" />
      <button className="dock-btn" aria-pressed={labels} onClick={() => store.set({ labels: !labels })}>
        Labels
      </button>
      <button
        className="dock-btn"
        aria-pressed={isolate}
        disabled={!selected}
        onClick={() => store.set({ isolate: !isolate })}
        title="Fade everything except the selected part"
      >
        Isolate
      </button>
      <button className="dock-btn" disabled={!selected} onClick={() => selected && actions.focus(selected)} title="Fly the camera to the selected part">
        Focus
      </button>
      <div className="dock-sep" />
      <button className="dock-btn" onClick={() => actions.reset()} title="Back to the opening view: all systems, assembled, solid body">
        Reset
      </button>
    </div>
  );
}
