import { store, useApp } from "../state/store";
import { VEHICLE_QUESTIONS } from "../data/vehicle";

export function TopBar({ onToggleRail, railCollapsed }: { onToggleRail: () => void; railCollapsed: boolean }) {
  const open = useApp((s) => VEHICLE_QUESTIONS.filter((q) => !s.vehicleAnswers[q.id] || s.vehicleAnswers[q.id] === "unsure").length);
  const modelCode = useApp((s) => s.vehicleAnswers["model-code"]);
  const nickname = useApp((s) => s.privateConfig?.nickname);
  const glbCount = useApp((s) => (s.assetStatus ? Object.keys(s.assetStatus.fromGlb).length : 0));

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleRail} aria-pressed={!railCollapsed} title="Show or hide the left panel">
        ☰
      </button>
      <div className="brand">
        <h1>Toyota Yaris Atlas</h1>
        <span className="stamp">
          {nickname ? `${nickname} · ` : ""}silver · petrol · 1329 cm³ · 73 kW · reg. 2011
        </span>
      </div>
      <div className="top-chips">
        <button className="chip-btn" onClick={() => store.set({ panel: "about" })} title="The 3D model is a placeholder. Open About for details.">
          <span className="dot" style={{ background: "var(--ev-approx)" }} />
          {glbCount ? `Geometry: approximate (${glbCount} from GLB)` : "Geometry: approximate placeholder"}
        </button>
        <button className="chip-btn" onClick={() => store.set({ panel: "vehicle" })} title="Variant identification and open questions">
          <span className="dot" style={{ background: modelCode ? "var(--ev-owner)" : "var(--ev-verified)" }} />
          {modelCode ? `Model code: ${modelCode} · manual` : "XP90 facelift · 1NR-FE · manual gearbox"}
        </button>
        <button className="chip-btn" onClick={() => store.set({ panel: "vehicle" })} data-testid="open-questions">
          <span className="dot" style={{ background: open ? "var(--ev-unknown)" : "var(--ev-owner)" }} />
          {open ? `${open} open question${open === 1 ? "" : "s"}` : "No open questions"}
        </button>
      </div>
    </header>
  );
}
