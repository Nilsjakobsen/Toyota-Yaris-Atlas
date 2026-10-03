import { useState } from "react";
import { store, useApp } from "../state/store";
import { DERIVED_FACTS, INSPECTION_DEADLINE, OWNER_FACTS, VARIANT_FACTS, VEHICLE_QUESTIONS } from "../data/vehicle";
import type { VehicleFact } from "../data/types";
import { maskRegistration, maskVin, vinShapeIssues } from "../lib/privateConfig";
import { Ev, SourceList } from "./Evidence";

/** Only the manufacturer prefix is decoded, locally, from a public table. */
const WMI: Record<string, string> = { VNK: "Toyota Motor Manufacturing France (Valenciennes)" };

function Facts({ facts }: { facts: VehicleFact[] }) {
  return (
    <div className="facts">
      {facts.map((f) => (
        <div className="fact" key={f.id} data-fact={f.id}>
          <div>
            <div className="fact-label">{f.label}</div>
            <div className="fact-value">{f.value}</div>
          </div>
          <div>
            <Ev level={f.level} />
          </div>
          {f.note ? <div className="fact-note">{f.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

function daysUntil(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

export function VehiclePanel() {
  const cfg = useApp((s) => s.privateConfig);
  const answers = useApp((s) => s.vehicleAnswers);
  const [reveal, setReveal] = useState(false);
  const days = daysUntil(INSPECTION_DEADLINE);
  const setAnswer = (id: string, v: string) =>
    store.set((s) => {
      const next = { ...s.vehicleAnswers };
      if (!v || next[id] === v) delete next[id];
      else next[id] = v;
      return { vehicleAnswers: next };
    });
  const open = VEHICLE_QUESTIONS.filter((q) => !answers[q.id] || answers[q.id] === "unsure").length;
  const allSources = [...OWNER_FACTS, ...VARIANT_FACTS, ...DERIVED_FACTS].flatMap((f) => f.sources).concat(cfg?.vin ? ["wmi-vnk"] : []);

  return (
    <div className="panel-body" data-testid="vehicle">
      <h2>{cfg?.nickname ?? "Your Yaris"}</h2>
      <div className="sub">Toyota Yaris · silver · petrol · 5 seats · first registered in Norway 15 Aug 2011</div>

      <div className={`callout ${days < 0 ? "stop" : days < 60 ? "caution" : "info"}`}>
        <span className="tag">EU-kontroll</span>
        Next inspection deadline <b>31 January 2027</b>
        {days >= 0 ? ` — in ${days} day${days === 1 ? "" : "s"}.` : ` — ${-days} days overdue.`} Last approved 28 January 2025.
      </div>

      <h3>Private identifiers (this computer only)</h3>
      {cfg && (cfg.registration || cfg.vin) ? (
        <div className="card">
          <dl className="kv">
            {cfg.registration ? (
              <>
                <dt>Registration</dt>
                <dd className="masked" data-testid="reg">
                  {reveal ? cfg.registration : maskRegistration(cfg.registration)}
                </dd>
              </>
            ) : null}
            {cfg.vin ? (
              <>
                <dt>VIN</dt>
                <dd className="masked" data-testid="vin">
                  {reveal ? cfg.vin : maskVin(cfg.vin)}
                </dd>
                <dt>Manufacturer code</dt>
                <dd>
                  {cfg.vin.slice(0, 3)} — {WMI[cfg.vin.slice(0, 3).toUpperCase()] ?? "not in the local table"}
                </dd>
              </>
            ) : null}
          </dl>
          {cfg.vin && vinShapeIssues(cfg.vin).length ? <div className="callout caution">{vinShapeIssues(cfg.vin).join(" ")}</div> : null}
          <button className="btn" onClick={() => setReveal((r) => !r)}>
            {reveal ? "Hide" : "Show"}
          </button>
          <p className="muted small" style={{ marginTop: 6 }}>
            Read from <code>config/vehicle.local.json</code> by the local dev server. Not stored in the browser, not in exports, not in builds. Only the first
            three VIN characters (the factory code) are decoded; the rest is manufacturer-specific and is not interpreted here.
          </p>
        </div>
      ) : (
        <p className="muted small">
          Not configured — that is fine, the app works without them. To show them here, copy <code>config/vehicle.example.json</code> to{" "}
          <code>config/vehicle.local.json</code> and fill it in. That file is ignored by Git.
        </p>
      )}

      <h3>Most likely variant</h3>
      <p className="small">
        Matched from your registration data against manufacturer and catalogue sources. Strongly supported, but not yet checked against the model code on the
        car's label.
      </p>
      <Facts facts={VARIANT_FACTS} />

      <h3>
        Open questions <span className="muted">({open} open)</span>
      </h3>
      <p className="small">Answer these by looking at the car. Your answers are saved on this computer and included in log exports.</p>
      {VEHICLE_QUESTIONS.map((q) => (
        <div className="card" key={q.id} data-question={q.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <b style={{ fontSize: 12.8 }}>{q.question}</b>
            {answers[q.id] && answers[q.id] !== "unsure" ? <Ev level="owner" label="Answered" /> : <Ev level="unknown" label="Open" />}
          </div>
          <div className="small muted" style={{ margin: "3px 0 5px" }}>
            {q.why}
          </div>
          <ul className="small">
            {q.howToCheck.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          {q.options ? (
            <div className="opts">
              {q.options.map((o) => (
                <button key={o.id} className="opt" aria-pressed={answers[q.id] === o.id} onClick={() => setAnswer(q.id, o.id)}>
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="field">
              <input
                type="text"
                aria-label={q.question}
                value={answers[q.id] ?? ""}
                onChange={(e) => store.set((s) => ({ vehicleAnswers: { ...s.vehicleAnswers, [q.id]: e.target.value } }))}
                placeholder="Type what you find"
              />
            </div>
          )}
        </div>
      ))}

      <h3>Registration data (owner-supplied)</h3>
      <Facts facts={OWNER_FACTS} />

      <h3>Calculated from your data</h3>
      <Facts facts={DERIVED_FACTS} />

      <h3>Sources</h3>
      <SourceList ids={allSources} />
    </div>
  );
}
