import { actions, store, useApp } from "../state/store";
import { COMPONENT_BY_ID } from "../data/components";
import { SYSTEM_BY_ID } from "../data/systems";
import { SYMPTOM_FLOWS } from "../data/symptoms";
import { VEHICLE_QUESTIONS } from "../data/vehicle";
import { Ev, SourceList } from "./Evidence";

export function PartChip({ id, onClick }: { id: string; onClick?: () => void }) {
  const rec = COMPONENT_BY_ID[id];
  if (!rec) return null;
  return (
    <button
      className="part-chip"
      onClick={onClick ?? (() => actions.select(id))}
      onMouseEnter={() => store.set({ hoveredId: id })}
      onMouseLeave={() => store.set({ hoveredId: null })}
      title={rec.name.no}
    >
      {rec.name.en}
    </button>
  );
}

export function Inspector() {
  const id = useApp((s) => s.selectedId);
  const assetStatus = useApp((s) => s.assetStatus);
  const confirmation = useApp((s) => (id ? s.confirmations[id] : undefined));
  const answers = useApp((s) => s.vehicleAnswers);
  const log = useApp((s) => s.log);
  const isolate = useApp((s) => s.isolate);

  if (!id || !COMPONENT_BY_ID[id]) {
    return (
      <div className="panel-body">
        <h2>Pick a part</h2>
        <p>Click a part in the 3D view, choose one from the search, or open a symptom investigation.</p>
        <ul>
          <li>Drag to orbit, scroll to zoom, right-drag to pan.</li>
          <li>Use the <b>Views</b> on the left to jump to the engine bay, underside or a wheel.</li>
          <li>The <b>Explode</b> slider pulls parts apart; <b>Assemble</b> puts them back exactly.</li>
          <li>Search works in English and Norwegian — try “peilepinne”, “dynamo” or “lyddemper”.</li>
        </ul>
        <p className="muted small">
          Everything you see is a placeholder sized to your car's registered dimensions. Each part's evidence badges tell you what is known and what is guessed.
        </p>
      </div>
    );
  }

  const rec = COMPONENT_BY_ID[id];
  const sys = SYSTEM_BY_ID[rec.system];
  const fromGlb = assetStatus?.fromGlb[id];
  const questions = VEHICLE_QUESTIONS.filter((q) => q.affects.includes(id));
  const flows = SYMPTOM_FLOWS.filter((f) => f.possibilities.some((p) => p.components.includes(id)));
  const entries = log.filter((e) => e.components.includes(id));

  const setConfirmed = (confirmed: boolean) =>
    store.set((s) => ({ confirmations: { ...s.confirmations, [id]: { confirmed, note: s.confirmations[id]?.note, at: new Date().toISOString() } } }));
  const setNote = (note: string) =>
    store.set((s) => ({ confirmations: { ...s.confirmations, [id]: { confirmed: s.confirmations[id]?.confirmed ?? false, note, at: new Date().toISOString() } } }));

  return (
    <div className="panel-body" data-testid="inspector">
      <div className="sys-line">
        <span className="swatch" style={{ background: sys.colour }} />
        {sys.name.en}
      </div>
      <h2 data-testid="inspector-name">{rec.name.en}</h2>
      <div className="sub">
        <span className="muted">norsk:</span> {rec.name.no}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="muted small">On this car:</span> <Ev level={rec.presence.status} />
        <span className="muted small">Location:</span> <Ev level={confirmation?.confirmed ? "owner" : rec.location.status} label={confirmation?.confirmed ? "Confirmed by you" : undefined} />
        <span className="muted small">3D:</span> <Ev level="approximate" label={fromGlb ? "GLB (approx.)" : "Placeholder"} />
      </div>
      <div className="row">
        <button className="btn" onClick={() => actions.focus(id)}>
          Focus camera
        </button>
        <button className="btn" aria-pressed={isolate} onClick={() => store.set({ isolate: !isolate })}>
          {isolate ? "Show all" : "Isolate"}
        </button>
        <button className="btn" onClick={() => actions.draftLog({ kind: "observation", title: `${rec.name.en}: `, components: [id] })}>
          Add log entry
        </button>
      </div>

      <h3>What it does</h3>
      <p>{rec.function}</p>
      {rec.presence.note ? <p className="small">{rec.presence.note}</p> : null}

      <h3>Where it is</h3>
      <p>{rec.location.text}</p>
      {fromGlb ? <p className="muted small">Geometry loaded from {fromGlb}.</p> : <p className="muted small">Shown with built-in placeholder geometry.</p>}
      <label className="check">
        <input type="checkbox" checked={!!confirmation?.confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I have found this on my car</span>
      </label>
      <div className="field">
        <span>Where you found it (your own words)</span>
        <input
          type="text"
          placeholder="e.g. front left of the engine bay, under a black cover"
          value={confirmation?.note ?? ""}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {questions.length ? (
        <>
          <h3>Your car</h3>
          {questions.map((q) => {
            const a = answers[q.id];
            const label = q.options?.find((o) => o.id === a)?.label ?? a;
            return (
              <p key={q.id} className="small">
                {q.question}{" "}
                {a && a !== "unsure" ? (
                  <>
                    <Ev level="owner" label={label} />
                  </>
                ) : (
                  <button className="link-btn" onClick={() => store.set({ panel: "vehicle" })}>
                    Answer in Vehicle →
                  </button>
                )}
              </p>
            );
          })}
        </>
      ) : null}

      {rec.unknowns?.length ? (
        <>
          <h3>Still to confirm</h3>
          <ul>
            {rec.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </>
      ) : null}

      {rec.checks?.length ? (
        <>
          <h3>Safe checks you can make</h3>
          <ul>
            {rec.checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}

      {rec.safety?.length
        ? rec.safety.map((s) => (
            <div key={s} className="callout caution">
              <span className="tag">Safety</span>
              {s}
            </div>
          ))
        : null}

      {rec.symptoms.length ? (
        <>
          <h3>Often linked symptoms</h3>
          <ul>
            {rec.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      ) : null}
      {flows.length ? (
        <div className="row" style={{ marginTop: 4 }}>
          <span className="muted small">Investigate:</span>
          {flows.map((f) => (
            <button key={f.id} className="part-chip" onClick={() => actions.openFlow(f.id)}>
              {f.title}
            </button>
          ))}
        </div>
      ) : null}

      {rec.related.length ? (
        <>
          <h3>Related parts</h3>
          <div className="part-chips">
            {rec.related.map((r) => (
              <PartChip key={r} id={r} />
            ))}
          </div>
        </>
      ) : null}

      {entries.length ? (
        <>
          <h3>In your log ({entries.length})</h3>
          <ul>
            {entries.slice(0, 4).map((e) => (
              <li key={e.id} className="small">
                <span className="entry-meta">{e.date}</span> {e.title}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>Sources</h3>
      <SourceList ids={rec.sources} />
      <p className="muted small" style={{ marginTop: 8 }}>
        ID <code>{rec.id}</code> — use this exact name for the object in Blender.
      </p>
    </div>
  );
}
