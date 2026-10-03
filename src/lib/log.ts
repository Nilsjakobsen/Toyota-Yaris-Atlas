import { COMPONENT_BY_ID } from "../data/components";

/**
 * The owner's maintenance and observation log. Stored in localStorage; exported and
 * imported as JSON. The export never contains the registration number or VIN — those
 * live only in config/vehicle.local.json.
 */

export const LOG_KINDS = ["observation", "symptom", "maintenance", "inspection", "code", "other"] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const LOG_KIND_LABEL: Record<LogKind, string> = {
  observation: "Observation",
  symptom: "Symptom investigation",
  maintenance: "Maintenance / repair",
  inspection: "Inspection (EU-kontroll)",
  code: "Fault code read",
  other: "Other",
};

export interface LogEntry {
  id: string;
  /** ISO timestamp when the entry was created. */
  createdAt: string;
  /** Date the thing happened, YYYY-MM-DD. */
  date: string;
  kind: LogKind;
  title: string;
  notes: string;
  odometerKm?: number;
  components: string[];
  flowId?: string;
  answers?: Record<string, string>;
  codes?: string[];
}

export interface Confirmation {
  confirmed: boolean;
  note?: string;
  at: string;
}

export interface ExportFile {
  app: "toyota-yaris-atlas";
  format: 1;
  exportedAt: string;
  entries: LogEntry[];
  vehicleAnswers: Record<string, string>;
  confirmations: Record<string, Confirmation>;
}

export function newId(): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `log-${Date.now().toString(36)}-${rnd}`;
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sortEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function buildExport(
  entries: LogEntry[],
  vehicleAnswers: Record<string, string>,
  confirmations: Record<string, Confirmation>,
  now = new Date(),
): ExportFile {
  return {
    app: "toyota-yaris-atlas",
    format: 1,
    exportedAt: now.toISOString(),
    entries: sortEntries(entries),
    vehicleAnswers: { ...vehicleAnswers },
    confirmations: { ...confirmations },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";

export type ImportResult =
  | { ok: true; data: ExportFile; warnings: string[] }
  | { ok: false; errors: string[] };

/** Validate an imported file. Unknown component IDs are dropped with a warning, not fatal. */
export function validateImport(raw: unknown): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ["The file is not a JSON object."] };
  if (raw.app !== "toyota-yaris-atlas") errors.push("This does not look like a Toyota Yaris Atlas export (missing app marker).");
  if (raw.format !== 1) errors.push(`Unsupported format version: ${String(raw.format)}.`);
  if (!Array.isArray(raw.entries)) errors.push("Missing 'entries' list.");
  if (errors.length) return { ok: false, errors };

  const entries: LogEntry[] = [];
  (raw.entries as unknown[]).forEach((e, i) => {
    if (!isObj(e)) {
      errors.push(`Entry ${i + 1} is not an object.`);
      return;
    }
    if (!isStr(e.id) || !e.id) errors.push(`Entry ${i + 1}: missing id.`);
    if (!isStr(e.date) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push(`Entry ${i + 1}: date must be YYYY-MM-DD.`);
    if (!isStr(e.title)) errors.push(`Entry ${i + 1}: missing title.`);
    const kind = (LOG_KINDS as readonly string[]).includes(e.kind as string) ? (e.kind as LogKind) : "other";
    if (kind !== e.kind) warnings.push(`Entry ${i + 1}: unknown kind "${String(e.kind)}" imported as "other".`);
    const comps = Array.isArray(e.components) ? e.components.filter(isStr) : [];
    const known = comps.filter((c) => COMPONENT_BY_ID[c]);
    if (known.length !== comps.length) warnings.push(`Entry ${i + 1}: dropped unknown component IDs.`);
    const odo = typeof e.odometerKm === "number" && Number.isFinite(e.odometerKm) && e.odometerKm >= 0 ? e.odometerKm : undefined;
    entries.push({
      id: String(e.id),
      createdAt: isStr(e.createdAt) ? e.createdAt : new Date().toISOString(),
      date: String(e.date),
      kind,
      title: String(e.title ?? ""),
      notes: isStr(e.notes) ? e.notes : "",
      odometerKm: odo,
      components: known,
      flowId: isStr(e.flowId) ? e.flowId : undefined,
      answers: isObj(e.answers) ? (Object.fromEntries(Object.entries(e.answers).filter(([, v]) => isStr(v))) as Record<string, string>) : undefined,
      codes: Array.isArray(e.codes) ? e.codes.filter(isStr) : undefined,
    });
  });
  if (errors.length) return { ok: false, errors };

  const vehicleAnswers = isObj(raw.vehicleAnswers)
    ? (Object.fromEntries(Object.entries(raw.vehicleAnswers).filter(([, v]) => isStr(v))) as Record<string, string>)
    : {};
  const confirmations: Record<string, Confirmation> = {};
  if (isObj(raw.confirmations)) {
    for (const [k, v] of Object.entries(raw.confirmations)) {
      if (COMPONENT_BY_ID[k] && isObj(v) && typeof v.confirmed === "boolean") {
        confirmations[k] = { confirmed: v.confirmed, note: isStr(v.note) ? v.note : undefined, at: isStr(v.at) ? v.at : "" };
      }
    }
  }
  return {
    ok: true,
    warnings,
    data: { app: "toyota-yaris-atlas", format: 1, exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : "", entries, vehicleAnswers, confirmations },
  };
}

/** Merge imported entries into existing ones. Entries with the same id keep the existing copy. */
export function mergeEntries(existing: LogEntry[], incoming: LogEntry[]): { entries: LogEntry[]; added: number; skipped: number } {
  const ids = new Set(existing.map((e) => e.id));
  const fresh = incoming.filter((e) => !ids.has(e.id));
  return { entries: sortEntries([...existing, ...fresh]), added: fresh.length, skipped: incoming.length - fresh.length };
}
