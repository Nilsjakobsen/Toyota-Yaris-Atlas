import type { EvidenceLevel } from "../data/types";
import { SOURCE_BY_ID } from "../data/sources";

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  owner: "Owner-supplied",
  verified: "Source-verified",
  generic: "Generic",
  approximate: "Approximate",
  unknown: "Unknown",
};

export const EVIDENCE_HELP: Record<EvidenceLevel, string> = {
  owner: "From your registration data, or something you checked on the car.",
  verified: "Supported by a cited source for this variant (see the source for which market and years).",
  generic: "A generic explanation true of most cars like this; not checked for yours.",
  approximate: "Position or shape is an estimate.",
  unknown: "Not known for your car. It may differ.",
};

export function Ev({ level, label }: { level: EvidenceLevel; label?: string }) {
  return (
    <span className={`ev ${level}`} title={EVIDENCE_HELP[level]}>
      {label ?? EVIDENCE_LABEL[level]}
    </span>
  );
}

export function EvidenceLegend() {
  return (
    <dl className="kv">
      {(Object.keys(EVIDENCE_LABEL) as EvidenceLevel[]).map((k) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>
            <Ev level={k} />
          </dt>
          <dd className="small">{EVIDENCE_HELP[k]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SourceList({ ids }: { ids: string[] }) {
  const uniq = [...new Set(ids)];
  return (
    <ul className="sources">
      {uniq.map((id) => {
        const s = SOURCE_BY_ID[id];
        if (!s) return <li key={id}>Unknown source: {id}</li>;
        return (
          <li key={id}>
            <span className="src-kind">{s.kind}</span>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.title}
              </a>
            ) : (
              <span>{s.title}</span>
            )}
            <div className="muted small">
              {s.publisher} · <i>applies to:</i> {s.appliesTo}
              {s.accessed ? ` · accessed ${s.accessed}` : ""}
            </div>
            {s.notes ? <div className="muted small">{s.notes}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
