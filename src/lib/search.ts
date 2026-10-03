import type { ComponentRecord } from "../data/types";
import { SYSTEM_BY_ID } from "../data/systems";

/**
 * Fold text so that Norwegian letters and casual spellings match:
 * "kjølevifte", "kjolevifte" and "kjoelevifte" all fold to "kjolevifte".
 * The same fold is applied to the query and to the index, so it stays consistent.
 */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/aa/g, "a")
    .replace(/oe/g, "o")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface IndexedField {
  text: string; // original
  folded: string;
  words: string[];
  weight: number;
  label: string; // what to show when this field is what matched
}

interface IndexedComponent {
  record: ComponentRecord;
  fields: IndexedField[];
}

export interface SearchHit {
  record: ComponentRecord;
  score: number;
  /** Human-readable reason, e.g. "norsk: peilepinne". Undefined when the English name matched. */
  matchedVia?: string;
}

function field(text: string, weight: number, label: string): IndexedField {
  const folded = fold(text);
  return { text, folded, words: folded.split(" ").filter(Boolean), weight, label };
}

export function buildIndex(records: ComponentRecord[]): IndexedComponent[] {
  return records.map((record) => {
    const fields: IndexedField[] = [field(record.name.en, 10, "name"), field(record.name.no, 10, "norsk")];
    for (const a of record.aliases?.en ?? []) fields.push(field(a, 6, "also called"));
    for (const a of record.aliases?.no ?? []) fields.push(field(a, 6, "norsk"));
    const sys = SYSTEM_BY_ID[record.system];
    fields.push(field(sys.name.en, 2, "system"), field(sys.name.no, 2, "system"));
    fields.push(field(record.function, 1, "description"));
    fields.push(field(record.id.replace(/-/g, " "), 4, "id"));
    return { record, fields };
  });
}

function tokenScore(token: string, f: IndexedField): number {
  let best = 0;
  for (const w of f.words) {
    if (w === token) return 3;
    if (w.startsWith(token)) best = Math.max(best, 2);
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, 1);
  }
  return best;
}

/**
 * Every query token must match somewhere in a record. Score favours name matches,
 * whole words, and prefixes. Returns hits sorted best first.
 */
export function search(index: IndexedComponent[], query: string, limit = 20): SearchHit[] {
  const q = fold(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  const hits: SearchHit[] = [];

  for (const item of index) {
    let total = 0;
    let bestField: IndexedField | null = null;
    let bestFieldScore = 0;
    let allMatched = true;

    for (const t of tokens) {
      let tokenBest = 0;
      for (const f of item.fields) {
        const s = tokenScore(t, f) * f.weight;
        if (s > tokenBest) tokenBest = s;
        if (s > bestFieldScore) {
          bestFieldScore = s;
          bestField = f;
        }
      }
      if (tokenBest === 0) {
        allMatched = false;
        break;
      }
      total += tokenBest;
    }
    if (!allMatched) continue;

    // Bonus when the whole query appears as a phrase in a name or alias.
    for (const f of item.fields) {
      if (f.weight >= 6 && f.folded.includes(q)) {
        total += f.folded === q ? 25 : f.folded.startsWith(q) ? 12 : 6;
        break;
      }
    }

    const via =
      bestField && bestField.label !== "name" && bestField.label !== "id"
        ? `${bestField.label}: ${bestField.text.length > 48 ? bestField.text.slice(0, 45) + "…" : bestField.text}`
        : undefined;
    hits.push({ record: item.record, score: total, matchedVia: via });
  }

  hits.sort((a, b) => b.score - a.score || a.record.name.en.localeCompare(b.record.name.en));
  return hits.slice(0, limit);
}
