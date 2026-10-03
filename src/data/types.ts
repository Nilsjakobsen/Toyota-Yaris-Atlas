/**
 * Core data types. Everything the app knows about the car is typed here, and every
 * claim carries an evidence level so the UI can show how much to trust it.
 */

/**
 * How much a piece of information can be trusted, from strongest to weakest:
 *  - owner:       supplied by the owner (registration data, or something they checked on the car)
 *  - verified:    independently verified for this vehicle variant from a cited source
 *  - generic:     a generic automotive explanation; true of most cars, not checked for this one
 *  - approximate: position/shape is a placeholder estimate
 *  - unknown:     not known; configuration may differ on this car
 */
export type EvidenceLevel = "owner" | "verified" | "generic" | "approximate" | "unknown";

export type SystemId =
  | "engine"
  | "fuel-ignition"
  | "cooling"
  | "electrical"
  | "drivetrain"
  | "brakes"
  | "steering-suspension"
  | "wheels"
  | "exhaust"
  | "body";

export interface SystemDef {
  id: SystemId;
  name: { en: string; no: string };
  /** Colour used in "system colours" mode (sRGB hex). */
  colour: string;
  /** One-line orientation for beginners. */
  blurb: string;
  /** Explode fan direction for this system, blended with each part's radial direction. */
  fan: [number, number, number];
  /** Multiplier on how far this system travels when exploded. */
  spread: number;
}

export interface Bilingual {
  en: string;
  no: string;
}

export interface ComponentRecord {
  /** Stable ID. Matches the GLB node name or its `atlas_id` custom property. Never rename casually. */
  id: string;
  name: Bilingual;
  /** Extra search terms. Norwegian synonyms matter: people say "dynamo" and "generator". */
  aliases?: { en?: string[]; no?: string[] };
  system: SystemId;
  /** What it does, in plain language. */
  function: string;
  location: {
    text: string;
    /** "approximate" = placed by estimate; "unknown" = we do not know where it is on this car. */
    status: EvidenceLevel;
  };
  /** Is this component (in this form) actually fitted to this car? */
  presence: {
    status: EvidenceLevel;
    note?: string;
  };
  related: string[];
  /** Symptoms this component is commonly associated with (generic). */
  symptoms: string[];
  /** Safe, observational checks a beginner can make. Engine off and cool unless stated. */
  checks?: string[];
  /** Situation-specific safety notes. */
  safety?: string[];
  /** Things that must be confirmed on this specific car. */
  unknowns?: string[];
  sources: string[];
  /** True when the part exists on both sides of the car; each side explodes outward separately. */
  sides?: boolean;
  /** Optional explode overrides. */
  explode?: { dir?: [number, number, number]; spread?: number };
}

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  kind: "owner" | "manufacturer" | "regulation" | "standard" | "secondary" | "generic" | "pending";
  /** Which vehicle variant, market and years the source applies to. */
  appliesTo: string;
  accessed?: string;
  notes?: string;
}

export interface VehicleFact {
  id: string;
  label: string;
  value: string;
  level: EvidenceLevel;
  sources: string[];
  note?: string;
}

export interface VehicleQuestion {
  id: string;
  question: string;
  why: string;
  howToCheck: string[];
  options?: { id: string; label: string }[];
  /** Free-text answer instead of options. */
  freeText?: boolean;
  /** Component IDs this question affects. */
  affects: string[];
}

/* ------------------------------------------------------------------ */
/* Symptom investigation                                                */
/* ------------------------------------------------------------------ */

export interface FlowQuestion {
  id: string;
  text: string;
  help?: string;
  options: { id: string; label: string }[];
}

/** Matches when the answer to question `q` is one of `a`. */
export interface Condition {
  q: string;
  a: string[];
  /** Why this answer supports or weakens the possibility. */
  note: string;
}

export interface Possibility {
  id: string;
  title: string;
  explanation: string;
  components: string[];
  supports: Condition[];
  weakens: Condition[];
  nextObservation: string;
  professional?: string;
  /** Only show this possibility when any of these conditions match. */
  showIf?: Omit<Condition, "note">[];
}

export interface SafetyNote {
  level: "stop" | "caution" | "info";
  text: string;
  /** Show only when one of these conditions matches. Always shown when omitted. */
  when?: Omit<Condition, "note">[];
}

export interface SymptomFlow {
  id: string;
  title: string;
  titleNo: string;
  summary: string;
  questions: FlowQuestion[];
  safety: SafetyNote[];
  possibilities: Possibility[];
  /** Offer manual OBD code entry in this flow. */
  obd?: boolean;
}

/* ------------------------------------------------------------------ */
/* Placeholder geometry                                                 */
/* ------------------------------------------------------------------ */

export type Vec3 = [number, number, number];

export type PrimitiveSpec = (
  | { shape: "box"; size: Vec3; pos: Vec3; rot?: Vec3; mat: string; radius?: number }
  | { shape: "cylinder"; radius: number; length: number; axis: "x" | "y" | "z"; pos: Vec3; rot?: Vec3; mat: string; radiusTop?: number }
  | { shape: "tyre"; radius: number; width: number; sidewall: number; pos: Vec3; mat: string }
  | { shape: "torus"; radius: number; tube: number; axis: "x" | "y" | "z"; pos: Vec3; rot?: Vec3; mat: string }
  | { shape: "sphere"; radius: number; pos: Vec3; scale?: Vec3; mat: string }
  | { shape: "pipe"; points: Vec3[]; radius: number; mat: string }
) & { name?: string };

export interface PlaceholderSpec {
  /** Parts for the left (+X) side when `mirrorX` is set, otherwise the whole component. */
  parts: PrimitiveSpec[];
  /** Duplicate parts to the right side (−X), producing `<id>_L` and `<id>_R` explode units. */
  mirrorX?: boolean;
}
