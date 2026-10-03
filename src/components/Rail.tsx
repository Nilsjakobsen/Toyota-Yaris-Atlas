import { useMemo, useRef, useEffect } from "react";
import { actions, store, useApp } from "../state/store";
import { COMPONENTS } from "../data/components";
import { SYSTEMS, SYSTEM_BY_ID } from "../data/systems";
import { PRESETS } from "../data/presets";
import { buildIndex, search } from "../lib/search";

const INDEX = buildIndex(COMPONENTS);
const COUNTS = Object.fromEntries(SYSTEMS.map((s) => [s.id, COMPONENTS.filter((c) => c.system === s.id).length]));

export function Rail() {
  const query = useApp((s) => s.query);
  const selected = useApp((s) => s.selectedId);
  const visible = useApp((s) => s.visibleSystems);
  const bodyMode = useApp((s) => s.bodyMode);
  const activePreset = useApp((s) => s.activePreset);
  const colourMode = useApp((s) => s.colourMode);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => search(INDEX, query), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (id: string) => {
    const rec = COMPONENTS.find((c) => c.id === id)!;
    // Make sure the part can be seen: show its system, and ghost the shell if it hides it.
    store.set((s) => ({
      visibleSystems: s.visibleSystems[rec.system] ? s.visibleSystems : { ...s.visibleSystems, [rec.system]: true },
      bodyMode: id !== "body-shell" && s.bodyMode === "solid" ? "ghost" : s.bodyMode,
    }));
    actions.select(id);
    actions.focus(id);
  };

  return (
    <aside className="rail" aria-label="Views, systems and search">
      <div className="search">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search — English or norsk"
          aria-label="Search components in English or Norwegian"
          value={query}
          onChange={(e) => store.set({ query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) pick(hits[0].record.id);
            if (e.key === "Escape") store.set({ query: "" });
          }}
          spellCheck={false}
          autoComplete="off"
        />
        {query ? (
          <button className="clear" aria-label="Clear search" onClick={() => store.set({ query: "" })}>
            ×
          </button>
        ) : null}
      </div>
      <div className="rail-scroll">
        {query ? (
          <div className="sect">
            <div className="sect-head">
              <span className="eyebrow">Matches</span>
              <span className="count">{hits.length}</span>
            </div>
            <div className="results" role="list">
              {hits.length === 0 ? <div className="empty">No parts match “{query}”. Try another word, in English or Norwegian.</div> : null}
              {hits.map((h) => (
                <button key={h.record.id} role="listitem" className={`result${selected === h.record.id ? " sel" : ""}`} onClick={() => pick(h.record.id)}>
                  <div className="result-name">{h.record.name.en}</div>
                  <div className="result-meta">
                    {h.record.name.no}
                    {h.matchedVia ? ` · ${h.matchedVia}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Views</span>
          </div>
          <div className="presets">
            {PRESETS.map((p) => (
              <button key={p.id} className="preset" aria-pressed={activePreset === p.id} onClick={() => actions.preset(p.id, p.body)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Systems</span>
            <span>
              <button className="link-btn" onClick={() => actions.allSystems(true)}>
                All
              </button>
              {" · "}
              <button className="link-btn" onClick={() => actions.allSystems(false)}>
                None
              </button>
            </span>
          </div>
          {SYSTEMS.map((s) => (
            <div className="sys-row" key={s.id}>
              <button className="sys-toggle" aria-pressed={visible[s.id]} onClick={() => actions.toggleSystem(s.id)} title={s.blurb} data-system={s.id}>
                <span className="swatch" style={{ background: s.colour }} />
                <span className="sys-name">{s.name.en}</span>
                <span className="count">{COUNTS[s.id]}</span>
              </button>
              <button className="solo" onClick={() => actions.soloSystem(s.id)} title={`Show only ${s.name.en}`}>
                only
              </button>
            </div>
          ))}
        </div>

        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Body shell</span>
          </div>
          <div className="seg" role="group" aria-label="Body shell display">
            {(["solid", "ghost", "hidden"] as const).map((m) => (
              <button key={m} aria-pressed={bodyMode === m} onClick={() => store.set({ bodyMode: m })}>
                {m === "solid" ? "Solid" : m === "ghost" ? "See-through" : "Hidden"}
              </button>
            ))}
          </div>
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            {SYSTEM_BY_ID.body.blurb}
          </p>
        </div>

        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Colours</span>
          </div>
          <div className="seg" role="group" aria-label="Colour mode">
            <button aria-pressed={colourMode === "realistic"} onClick={() => store.set({ colourMode: "realistic" })}>
              Realistic
            </button>
            <button aria-pressed={colourMode === "system"} onClick={() => store.set({ colourMode: "system" })}>
              By system
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
