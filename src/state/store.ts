import { useSyncExternalStore } from "react";
import type { SystemId } from "../data/types";
import { SYSTEM_IDS } from "../data/systems";
import type { BodyMode } from "../data/presets";
import type { AssetStatus } from "../viewer/assets";
import type { ColourMode } from "../viewer/AtlasViewer";
import type { Confirmation, LogEntry } from "../lib/log";
import { sortEntries } from "../lib/log";
import type { PrivateConfig } from "../lib/privateConfig";
import { loadJSON, saveJSON } from "../lib/storage";

/**
 * One small external store for the whole app (no extra dependency). React components read
 * slices with useApp(selector); the 3D viewer subscribes directly.
 */

export type Panel = "inspect" | "symptoms" | "log" | "vehicle" | "about";

export interface LogDraft {
  kind?: LogEntry["kind"];
  title?: string;
  notes?: string;
  components?: string[];
  flowId?: string;
  answers?: Record<string, string>;
  codes?: string[];
}

export interface AppState {
  selectedId: string | null;
  hoveredId: string | null;
  visibleSystems: Record<SystemId, boolean>;
  bodyMode: BodyMode;
  colourMode: ColourMode;
  labels: boolean;
  isolate: boolean;
  explode: number;
  explodeCm: number;
  activePreset: string | null;
  panel: Panel;
  query: string;
  linkedIds: string[];
  /** Incremented to ask the viewer to fly somewhere. */
  camRequest: { kind: "preset" | "reset" | "focus"; id?: string; nonce: number } | null;
  assetStatus: AssetStatus | null;
  vehicleAnswers: Record<string, string>;
  confirmations: Record<string, Confirmation>;
  log: LogEntry[];
  logDraft: LogDraft | null;
  privateConfig: PrivateConfig | null;
  storageOk: boolean;
  toast: { text: string; nonce: number } | null;
  symptom: SymptomState;
}

export interface SymptomState {
  flowId: string | null;
  answers: Record<string, string>;
  codes: string[];
}

const allSystems = (): Record<SystemId, boolean> => Object.fromEntries(SYSTEM_IDS.map((s) => [s, true])) as Record<SystemId, boolean>;

const prefs = loadJSON<{ colourMode?: ColourMode; labels?: boolean }>("prefs", {});

const initial: AppState = {
  selectedId: null,
  hoveredId: null,
  visibleSystems: allSystems(),
  bodyMode: "solid",
  colourMode: prefs.colourMode === "system" ? "system" : "realistic",
  labels: prefs.labels ?? true,
  isolate: false,
  explode: 0,
  explodeCm: 0,
  activePreset: "overview",
  panel: "inspect",
  query: "",
  linkedIds: [],
  camRequest: null,
  assetStatus: null,
  vehicleAnswers: loadJSON<Record<string, string>>("vehicle-answers", {}),
  confirmations: loadJSON<Record<string, Confirmation>>("confirmations", {}),
  log: sortEntries(loadJSON<LogEntry[]>("log", [])),
  logDraft: null,
  privateConfig: null,
  storageOk: true,
  toast: null,
  symptom: { flowId: null, answers: {}, codes: [] },
};

type Listener = () => void;
let state = initial;
const listeners = new Set<Listener>();

export const store = {
  get: () => state,
  set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    const prev = state;
    state = { ...state, ...p };
    persist(prev, state);
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

function persist(prev: AppState, next: AppState) {
  let ok = true;
  if (prev.log !== next.log) ok = saveJSON("log", next.log) && ok;
  if (prev.vehicleAnswers !== next.vehicleAnswers) ok = saveJSON("vehicle-answers", next.vehicleAnswers) && ok;
  if (prev.confirmations !== next.confirmations) ok = saveJSON("confirmations", next.confirmations) && ok;
  if (prev.colourMode !== next.colourMode || prev.labels !== next.labels) ok = saveJSON("prefs", { colourMode: next.colourMode, labels: next.labels }) && ok;
  if (!ok && next.storageOk) state = { ...state, storageOk: false };
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(state), () => selector(state));
}

/* ---------------------------------------------------------------- actions */

let nonce = 0;
export const actions = {
  select(id: string | null, opts: { openInspector?: boolean } = {}) {
    store.set((s) => ({ selectedId: id, panel: id && (opts.openInspector ?? true) && s.panel !== "inspect" && s.panel !== "symptoms" ? "inspect" : s.panel }));
  },
  focus(id: string) {
    store.set({ selectedId: id, camRequest: { kind: "focus", id, nonce: ++nonce } });
  },
  preset(id: string, body?: BodyMode) {
    store.set((s) => ({ activePreset: id, bodyMode: body ?? s.bodyMode, camRequest: { kind: "preset", id, nonce: ++nonce } }));
  },
  reset() {
    store.set({
      selectedId: null,
      visibleSystems: allSystems(),
      bodyMode: "solid",
      isolate: false,
      explode: 0,
      activePreset: "overview",
      linkedIds: [],
      query: "",
      camRequest: { kind: "reset", nonce: ++nonce },
    });
  },
  toggleSystem(id: SystemId) {
    store.set((s) => ({ visibleSystems: { ...s.visibleSystems, [id]: !s.visibleSystems[id] } }));
  },
  /** Show only one system (the body shell is hidden too, so the system is unobstructed). */
  soloSystem(id: SystemId) {
    store.set({ visibleSystems: Object.fromEntries(SYSTEM_IDS.map((k) => [k, k === id])) as Record<SystemId, boolean> });
  },
  allSystems(on: boolean) {
    store.set({ visibleSystems: Object.fromEntries(SYSTEM_IDS.map((k) => [k, on])) as Record<SystemId, boolean> });
  },
  toast(text: string) {
    store.set({ toast: { text, nonce: ++nonce } });
  },
  openFlow(flowId: string | null) {
    store.set((s) => ({ panel: "symptoms", symptom: { flowId, answers: s.symptom.flowId === flowId ? s.symptom.answers : {}, codes: s.symptom.flowId === flowId ? s.symptom.codes : [] }, linkedIds: [] }));
  },
  answer(q: string, a: string) {
    store.set((s) => {
      const answers = { ...s.symptom.answers };
      if (answers[q] === a) delete answers[q];
      else answers[q] = a;
      return { symptom: { ...s.symptom, answers } };
    });
  },
  draftLog(draft: LogDraft) {
    store.set({ logDraft: draft, panel: "log" });
  },
};
