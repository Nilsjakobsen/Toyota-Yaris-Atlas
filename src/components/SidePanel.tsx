import { store, useApp, type Panel } from "../state/store";
import { VEHICLE_QUESTIONS } from "../data/vehicle";
import { Inspector } from "./Inspector";
import { SymptomPanel } from "./SymptomPanel";
import { LogPanel } from "./LogPanel";
import { VehiclePanel } from "./VehiclePanel";
import { AboutPanel } from "./AboutPanel";

const TABS: { id: Panel; label: string }[] = [
  { id: "inspect", label: "Inspector" },
  { id: "symptoms", label: "Symptoms" },
  { id: "log", label: "Log" },
  { id: "vehicle", label: "Vehicle" },
  { id: "about", label: "About" },
];

export function SidePanel() {
  const panel = useApp((s) => s.panel);
  const logCount = useApp((s) => s.log.length);
  const openQ = useApp((s) => VEHICLE_QUESTIONS.filter((q) => !s.vehicleAnswers[q.id] || s.vehicleAnswers[q.id] === "unsure").length);

  return (
    <aside className="side" aria-label="Details">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" className="tab" aria-selected={panel === t.id} onClick={() => store.set({ panel: t.id })} data-tab={t.id}>
            {t.label}
            {t.id === "log" && logCount ? <span className="badge-n">{logCount}</span> : null}
            {t.id === "vehicle" && openQ ? <span className="badge-n">{openQ}?</span> : null}
          </button>
        ))}
      </div>
      {panel === "inspect" ? <Inspector /> : null}
      {panel === "symptoms" ? <SymptomPanel /> : null}
      {panel === "log" ? <LogPanel /> : null}
      {panel === "vehicle" ? <VehiclePanel /> : null}
      {panel === "about" ? <AboutPanel /> : null}
    </aside>
  );
}
