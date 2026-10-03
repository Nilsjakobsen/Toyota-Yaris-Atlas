import type { Condition, Possibility, SafetyNote, SymptomFlow } from "../data/types";

export type Answers = Record<string, string>;

/** How a possibility lines up with the answers so far. Deliberately not a probability. */
export type Fit = "fits" | "mixed" | "open" | "less";

export interface EvaluatedPossibility {
  possibility: Possibility;
  supporting: Condition[];
  weakening: Condition[];
  fit: Fit;
}

const FIT_ORDER: Record<Fit, number> = { fits: 0, mixed: 1, open: 2, less: 3 };

export const FIT_LABEL: Record<Fit, string> = {
  fits: "Consistent with your answers",
  mixed: "Some answers fit, some do not",
  open: "Not yet assessed by your answers",
  less: "Less consistent with your answers",
};

function matches(c: Omit<Condition, "note">, answers: Answers): boolean {
  const a = answers[c.q];
  return a !== undefined && c.a.includes(a);
}

export function evaluateFlow(flow: SymptomFlow, answers: Answers): EvaluatedPossibility[] {
  const out: EvaluatedPossibility[] = [];
  flow.possibilities.forEach((p) => {
    if (p.showIf && !p.showIf.some((c) => matches(c, answers))) return;
    const supporting = p.supports.filter((c) => matches(c, answers));
    const weakening = p.weakens.filter((c) => matches(c, answers));
    const fit: Fit =
      supporting.length && !weakening.length
        ? "fits"
        : supporting.length && weakening.length
          ? "mixed"
          : weakening.length
            ? "less"
            : "open";
    out.push({ possibility: p, supporting, weakening, fit });
  });
  // Stable ordering: by fit group, then by number of supporting answers, then authoring order.
  return out
    .map((e, i) => ({ e, i }))
    .sort(
      (x, y) =>
        FIT_ORDER[x.e.fit] - FIT_ORDER[y.e.fit] ||
        y.e.supporting.length - x.e.supporting.length ||
        x.e.weakening.length - y.e.weakening.length ||
        x.i - y.i,
    )
    .map((x) => x.e);
}

export function activeSafety(flow: SymptomFlow, answers: Answers): SafetyNote[] {
  const order = { stop: 0, caution: 1, info: 2 } as const;
  return flow.safety
    .filter((s) => !s.when || s.when.some((c) => matches(c, answers)))
    .sort((a, b) => order[a.level] - order[b.level]);
}
