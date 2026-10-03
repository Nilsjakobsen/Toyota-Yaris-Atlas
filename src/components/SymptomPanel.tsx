import { useMemo, useState } from "react";
import { actions, store, useApp } from "../state/store";
import { FLOW_BY_ID, SYMPTOM_FLOWS } from "../data/symptoms";
import { COMPONENT_BY_ID } from "../data/components";
import { activeSafety, evaluateFlow, FIT_LABEL, type Fit } from "../lib/flowEval";
import { lookupCode } from "../data/obdCodes";
import { PartChip } from "./Inspector";

const FITS: Fit[] = ["fits", "mixed", "open", "less"];

function CodeResult({ code }: { code: string }) {
  const r = lookupCode(code);
  switch (r.kind) {
    case "generic":
      return (
        <>
          <b>{r.code}</b> — {r.info.description} <span className="muted">(generic code meaning)</span>
          {r.info.note ? <div className="muted small">{r.info.note}</div> : null}
          <div className="part-chips" style={{ marginTop: 4 }}>
            <span className="muted small">Concerns:</span>
            {r.info.components.map((c) => (
              <PartChip key={c} id={c} onClick={() => actions.select(c, { openInspector: false })} />
            ))}
          </div>
        </>
      );
    case "manufacturer":
      return (
        <>
          <b>{r.code}</b> — manufacturer-specific code. This app does not interpret it; look it up in Toyota service information for your variant.
        </>
      );
    case "generic-unlisted":
      return (
        <>
          <b>{r.code}</b> — a generic code, but not in this app's small table. Look up its standard meaning in a reliable source and record it in the log.
        </>
      );
    case "other-domain":
      return (
        <>
          <b>{r.code}</b> — {r.code[0] === "B" ? "body" : r.code[0] === "C" ? "chassis" : "network"} code (not engine). Not interpreted here.
        </>
      );
    default:
      return null;
  }
}

function FlowView({ flowId }: { flowId: string }) {
  const flow = FLOW_BY_ID[flowId];
  const answers = useApp((s) => s.symptom.answers);
  const codes = useApp((s) => s.symptom.codes);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const evaluated = useMemo(() => evaluateFlow(flow, answers), [flow, answers]);
  const safety = useMemo(() => activeSafety(flow, answers), [flow, answers]);
  const answered = flow.questions.filter((q) => answers[q.id]).length;

  const addCode = () => {
    const r = lookupCode(codeInput);
    if (r.kind === "invalid") {
      setCodeError("Codes look like P0301: a letter (P, B, C or U) and four characters.");
      return;
    }
    setCodeError("");
    setCodeInput("");
    store.set((s) => ({ symptom: { ...s.symptom, codes: s.symptom.codes.includes(r.code) ? s.symptom.codes : [...s.symptom.codes, r.code] } }));
  };

  const saveToLog = () => {
    const consistent = evaluated.filter((e) => e.fit === "fits").flatMap((e) => e.possibility.components);
    const lines = flow.questions.filter((q) => answers[q.id]).map((q) => `• ${q.text} — ${q.options.find((o) => o.id === answers[q.id])?.label}`);
    actions.draftLog({
      kind: codes.length ? "code" : "symptom",
      title: flow.title,
      notes: lines.join("\n") + (codes.length ? `\nCodes: ${codes.join(", ")}` : ""),
      components: [...new Set(consistent)].filter((c) => COMPONENT_BY_ID[c]),
      flowId: flow.id,
      answers: { ...answers },
      codes: [...codes],
    });
  };

  return (
    <div className="panel-body" data-testid="flow">
      <button className="link-btn" onClick={() => actions.openFlow(null)}>
        ← All symptoms
      </button>
      <h2 style={{ marginTop: 6 }}>{flow.title}</h2>
      <div className="sub">{flow.titleNo}</div>
      <p>{flow.summary}</p>

      {safety.map((s) => (
        <div key={s.text} className={`callout ${s.level}`} data-testid={`safety-${s.level}`}>
          <span className="tag">{s.level === "stop" ? "Stop" : s.level === "caution" ? "Caution" : "Note"}</span>
          {s.text}
        </div>
      ))}

      <h3>
        Questions <span className="muted">({answered} of {flow.questions.length} answered)</span>
      </h3>
      {flow.questions.map((q) => (
        <div className="q" key={q.id}>
          <div className="q-text">{q.text}</div>
          {q.help ? <div className="q-help">{q.help}</div> : null}
          <div className="opts" role="group" aria-label={q.text}>
            {q.options.map((o) => (
              <button key={o.id} className="opt" aria-pressed={answers[q.id] === o.id} onClick={() => actions.answer(q.id, o.id)} data-q={q.id} data-a={o.id}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {answered ? (
        <button className="link-btn" onClick={() => store.set((s) => ({ symptom: { ...s.symptom, answers: {} } }))}>
          Clear answers
        </button>
      ) : null}

      {flow.obd ? (
        <>
          <h3>Fault codes (manual entry)</h3>
          <p className="small">
            If a code reader or workshop gave you codes, type them here. This app does not connect to the car. A code describes what the engine computer
            detected — not which part has failed.
          </p>
          <div className="code-row">
            <input
              aria-label="Fault code"
              placeholder="e.g. P0301"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCode()}
            />
            <button className="btn" onClick={addCode}>
              Add code
            </button>
          </div>
          {codeError ? <div className="callout info">{codeError}</div> : null}
          {codes.map((c) => (
            <div key={c} className="code-item" data-testid="code-item">
              <CodeResult code={c} />
              <div>
                <button className="link-btn" onClick={() => store.set((s) => ({ symptom: { ...s.symptom, codes: s.symptom.codes.filter((x) => x !== c) } }))}>
                  remove
                </button>
              </div>
            </div>
          ))}
        </>
      ) : null}

      <h3>Possibilities to look into</h3>
      <div className="callout info small">
        Not a diagnosis. Possibilities are grouped by how your answers line up with them — not by likelihood. Hover a card to highlight its parts.
      </div>
      {FITS.map((fit) => {
        const group = evaluated.filter((e) => e.fit === fit);
        if (!group.length) return null;
        return (
          <div key={fit} data-fit={fit}>
            <div className="fit-head">{FIT_LABEL[fit]}</div>
            {group.map(({ possibility: p, supporting, weakening }) => (
              <div
                key={p.id}
                className="poss"
                data-testid="possibility"
                data-id={p.id}
                onMouseEnter={() => store.set({ linkedIds: p.components })}
                onMouseLeave={() => store.set({ linkedIds: [] })}
              >
                <div className="poss-title">{p.title}</div>
                <div className="small">{p.explanation}</div>
                {supporting.length || weakening.length ? (
                  <ul>
                    {supporting.map((c) => (
                      <li key={"s" + c.q + c.note} className="sup">
                        {c.note}
                      </li>
                    ))}
                    {weakening.map((c) => (
                      <li key={"w" + c.q + c.note} className="weak">
                        {c.note}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="next">
                  <b>Next observation:</b> {p.nextObservation}
                </div>
                {p.professional ? <div className="pro">{p.professional}</div> : null}
                {p.components.length ? (
                  <div className="part-chips" style={{ marginTop: 6 }}>
                    {p.components.map((c) => (
                      <PartChip key={c} id={c} onClick={() => actions.select(c, { openInspector: false })} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        );
      })}

      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={saveToLog}>
          Save to log
        </button>
      </div>
    </div>
  );
}

export function SymptomPanel() {
  const flowId = useApp((s) => s.symptom.flowId);
  if (flowId && FLOW_BY_ID[flowId]) return <FlowView flowId={flowId} />;
  return (
    <div className="panel-body">
      <h2>Investigate a symptom</h2>
      <p>
        Pick what you notice. You'll get follow-up questions, possibilities with the evidence for and against each, and a sensible next observation. Checks are
        observational: engine off and cool unless a step says otherwise.
      </p>
      <div className="flow-list">
        {SYMPTOM_FLOWS.map((f) => (
          <button key={f.id} className="flow-card" onClick={() => actions.openFlow(f.id)} data-flow={f.id}>
            <div className="t">{f.title}</div>
            <div className="n">{f.titleNo}</div>
            <div className="s">{f.summary}</div>
          </button>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        If something feels unsafe — brakes, steering, smoke, a red warning lamp — stop somewhere safe and get professional help. This tool is for understanding,
        not for deciding whether a car is safe to drive.
      </p>
    </div>
  );
}
