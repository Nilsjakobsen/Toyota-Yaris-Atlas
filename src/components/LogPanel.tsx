import { useEffect, useRef, useState } from "react";
import { actions, store, useApp, type LogDraft } from "../state/store";
import { COMPONENTS, COMPONENT_BY_ID } from "../data/components";
import { FLOW_BY_ID } from "../data/symptoms";
import { buildExport, LOG_KINDS, LOG_KIND_LABEL, mergeEntries, newId, sortEntries, todayISO, validateImport, type LogEntry, type LogKind } from "../lib/log";
import { PartChip } from "./Inspector";

interface FormState {
  date: string;
  kind: LogKind;
  title: string;
  odometer: string;
  notes: string;
  components: string[];
  flowId?: string;
  answers?: Record<string, string>;
  codes?: string[];
}

const blank = (): FormState => ({ date: todayISO(), kind: "observation", title: "", odometer: "", notes: "", components: [] });

const fromDraft = (d: LogDraft): FormState => ({
  ...blank(),
  kind: d.kind ?? "observation",
  title: d.title ?? "",
  notes: d.notes ?? "",
  components: d.components ?? [],
  flowId: d.flowId,
  answers: d.answers,
  codes: d.codes,
});

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LogPanel() {
  const log = useApp((s) => s.log);
  const draft = useApp((s) => s.logDraft);
  const storageOk = useApp((s) => s.storageOk);
  const [form, setForm] = useState<FormState>(blank);
  const [open, setOpen] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // A draft from the inspector or a symptom flow opens the form prefilled.
  useEffect(() => {
    if (draft) {
      setForm(fromDraft(draft));
      setOpen(true);
      store.set({ logDraft: null });
    }
  }, [draft]);

  const save = () => {
    if (!form.title.trim()) return;
    const odo = form.odometer.trim() ? Number(form.odometer.replace(/\s/g, "")) : undefined;
    const entry: LogEntry = {
      id: newId(),
      createdAt: new Date().toISOString(),
      date: form.date || todayISO(),
      kind: form.kind,
      title: form.title.trim(),
      notes: form.notes,
      odometerKm: odo !== undefined && Number.isFinite(odo) && odo >= 0 ? odo : undefined,
      components: form.components,
      flowId: form.flowId,
      answers: form.answers,
      codes: form.codes?.length ? form.codes : undefined,
    };
    store.set((s) => ({ log: sortEntries([entry, ...s.log]) }));
    setForm(blank());
    setOpen(false);
    actions.toast("Saved to your log");
  };

  const doExport = () => {
    const s = store.get();
    const data = buildExport(s.log, s.vehicleAnswers, s.confirmations);
    download(`yaris-atlas-log-${todayISO()}.json`, JSON.stringify(data, null, 2));
  };

  const doImport = async (file: File) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportMsg({ ok: false, lines: ["That file is not valid JSON."] });
      return;
    }
    const r = validateImport(parsed);
    if (!r.ok) {
      setImportMsg({ ok: false, lines: r.errors.slice(0, 6) });
      return;
    }
    const s = store.get();
    const merged = mergeEntries(s.log, r.data.entries);
    // Existing answers win; imported ones only fill gaps.
    store.set({
      log: merged.entries,
      vehicleAnswers: { ...r.data.vehicleAnswers, ...s.vehicleAnswers },
      confirmations: { ...r.data.confirmations, ...s.confirmations },
    });
    setImportMsg({
      ok: true,
      lines: [`Imported ${merged.added} entr${merged.added === 1 ? "y" : "ies"}${merged.skipped ? `, ${merged.skipped} already present` : ""}.`, ...r.warnings.slice(0, 4)],
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this log entry? This cannot be undone (export first if unsure).")) return;
    store.set((s) => ({ log: s.log.filter((e) => e.id !== id) }));
  };

  const addComponent = (id: string) => id && setForm((f) => (f.components.includes(id) ? f : { ...f, components: [...f.components, id] }));

  return (
    <div className="panel-body" data-testid="log">
      <h2>Maintenance & observation log</h2>
      <p className="small">
        Stored in this browser on this computer. Export regularly to keep a backup. Exports contain your notes and answers, never the registration number or VIN.
      </p>
      {!storageOk ? <div className="callout caution">Browser storage is unavailable, so entries will be lost when you close the page. Export before leaving.</div> : null}
      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn primary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Cancel" : "New entry"}
        </button>
        <button className="btn" onClick={doExport} disabled={!log.length}>
          Export JSON
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="import-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {importMsg ? (
        <div className={`callout ${importMsg.ok ? "info" : "stop"}`}>
          {importMsg.lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="card" data-testid="log-form">
          <div className="form-grid">
            <label className="field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="field">
              <span>Type</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as LogKind })}>
                {LOG_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {LOG_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field full">
              <span>Title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Checked oil level — between MIN and MAX" />
            </label>
            <label className="field">
              <span>Odometer (km, optional)</span>
              <input inputMode="numeric" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="e.g. 148200" />
            </label>
            <label className="field">
              <span>Add a part</span>
              <select value="" onChange={(e) => addComponent(e.target.value)}>
                <option value="">Choose…</option>
                {COMPONENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.en}
                  </option>
                ))}
              </select>
            </label>
            {form.components.length ? (
              <div className="part-chips full">
                {form.components.map((c) => (
                  <button key={c} className="part-chip" onClick={() => setForm({ ...form, components: form.components.filter((x) => x !== c) })} title="Remove">
                    {COMPONENT_BY_ID[c]?.name.en} ×
                  </button>
                ))}
              </div>
            ) : null}
            <label className="field full">
              <span>Notes — what you saw, heard, smelled; conditions; who did the work</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
          {form.flowId ? <p className="muted small">Linked to the “{FLOW_BY_ID[form.flowId]?.title}” investigation (answers are saved with the entry).</p> : null}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={save} disabled={!form.title.trim()}>
              Save entry
            </button>
          </div>
        </div>
      ) : null}

      <h3>Entries ({log.length})</h3>
      {!log.length ? <p className="muted">No entries yet.</p> : null}
      {log.map((e) => (
        <div key={e.id} className="entry" data-testid="log-entry">
          <div className="entry-head">
            <span className="entry-title">{e.title}</span>
            <button className="link-btn" onClick={() => remove(e.id)} aria-label={`Delete ${e.title}`}>
              delete
            </button>
          </div>
          <div className="entry-meta">
            {e.date} · {LOG_KIND_LABEL[e.kind]}
            {e.odometerKm !== undefined ? ` · ${e.odometerKm.toLocaleString("nb-NO")} km` : ""}
            {e.codes?.length ? ` · ${e.codes.join(", ")}` : ""}
          </div>
          {e.notes ? <div className="entry-notes">{e.notes}</div> : null}
          {e.components.length ? (
            <div className="part-chips">
              {e.components.map((c) => (
                <PartChip key={c} id={c} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
