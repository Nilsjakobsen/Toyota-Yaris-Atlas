import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COMPONENTS, COMPONENT_BY_ID, COMPONENT_IDS } from "../src/data/components";
import { SYSTEMS, SYSTEM_BY_ID } from "../src/data/systems";
import { SOURCE_BY_ID, SOURCES } from "../src/data/sources";
import { SYMPTOM_FLOWS } from "../src/data/symptoms";
import { DERIVED_FACTS, OWNER_FACTS, VARIANT_FACTS, VEHICLE_QUESTIONS } from "../src/data/vehicle";
import { OBD_CODES } from "../src/data/obdCodes";
import { PRESETS } from "../src/data/presets";
import { PLACEHOLDERS } from "../src/viewer/placeholders";

describe("component catalogue", () => {
  it("has unique, kebab-case IDs", () => {
    expect(new Set(COMPONENT_IDS).size).toBe(COMPONENT_IDS.length);
    for (const id of COMPONENT_IDS) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("covers every required system with roughly 20–35 parts", () => {
    expect(COMPONENTS.length).toBeGreaterThanOrEqual(20);
    expect(COMPONENTS.length).toBeLessThanOrEqual(36);
    for (const s of SYSTEMS) expect(COMPONENTS.some((c) => c.system === s.id), s.id).toBe(true);
  });

  it("every selectable 3D placeholder has a data record, and every record has geometry", () => {
    for (const id of Object.keys(PLACEHOLDERS)) expect(COMPONENT_BY_ID[id], `placeholder without record: ${id}`).toBeDefined();
    for (const id of COMPONENT_IDS) expect(id === "body-shell" || PLACEHOLDERS[id] !== undefined, `record without geometry: ${id}`).toBe(true);
  });

  it("has complete, bilingual records with valid references", () => {
    for (const c of COMPONENTS) {
      expect(c.name.en.trim(), c.id).not.toBe("");
      expect(c.name.no.trim(), c.id).not.toBe("");
      expect(c.function.length, c.id).toBeGreaterThan(40);
      expect(c.location.text.length, c.id).toBeGreaterThan(10);
      expect(SYSTEM_BY_ID[c.system], c.id).toBeDefined();
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      for (const r of c.related) expect(COMPONENT_BY_ID[r], `${c.id} → related ${r}`).toBeDefined();
      for (const s of c.sources) expect(SOURCE_BY_ID[s], `${c.id} → source ${s}`).toBeDefined();
      expect(c.related).not.toContain(c.id);
    }
  });

  it("marks sided parts consistently with mirrored placeholders", () => {
    for (const c of COMPONENTS) {
      if (c.id === "body-shell") continue;
      expect(!!c.sides, `${c.id}: sides flag vs mirrorX`).toBe(!!PLACEHOLDERS[c.id].mirrorX);
    }
  });

  it("matches the generated component-ids.json used by the Blender script", () => {
    // If this fails, run `npm run gen:ids`.
    const json = JSON.parse(readFileSync(new URL("../blender/component-ids.json", import.meta.url), "utf8")) as {
      components: { id: string; name: string; system: string; sides: boolean; location: string }[];
    };
    expect(json.components).toEqual(
      COMPONENTS.map((c) => ({ id: c.id, name: c.name.en, system: c.system, sides: !!c.sides, location: c.location.status })),
    );
  });
});

describe("sources", () => {
  it("are unique and say which variant they apply to", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      expect(s.appliesTo.length, s.id).toBeGreaterThan(5);
      if (s.url) expect(s.url, s.id).toMatch(/^https:\/\//);
    }
  });
});

describe("vehicle profile", () => {
  it("references known sources and components", () => {
    for (const f of [...OWNER_FACTS, ...VARIANT_FACTS, ...DERIVED_FACTS]) for (const s of f.sources) expect(SOURCE_BY_ID[s], `${f.id} → ${s}`).toBeDefined();
    for (const q of VEHICLE_QUESTIONS) {
      for (const a of q.affects) expect(COMPONENT_BY_ID[a], `${q.id} → ${a}`).toBeDefined();
      expect(!!q.options !== !!q.freeText, `${q.id}: options xor freeText`).toBe(true);
    }
  });

  it("keeps owner facts marked as owner-supplied", () => {
    for (const f of OWNER_FACTS) {
      expect(f.level).toBe("owner");
      expect(f.sources).toContain("owner-registration");
    }
  });
});

describe("symptom flows", () => {
  it("cover the required situations", () => {
    const ids = SYMPTOM_FLOWS.map((f) => f.id);
    for (const id of ["no-crank", "crank-no-start", "rough-running", "warning-light", "overheating", "noise-vibration", "braking"]) expect(ids).toContain(id);
  });

  it("only reference questions, options and components that exist", () => {
    for (const f of SYMPTOM_FLOWS) {
      const qs = new Map(f.questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]));
      expect(qs.size, `${f.id}: duplicate question ids`).toBe(f.questions.length);
      const check = (c: { q: string; a: string[] }, where: string) => {
        expect(qs.has(c.q), `${where}: unknown question ${c.q}`).toBe(true);
        expect(c.a.length, `${where}: empty answer list`).toBeGreaterThan(0);
        for (const a of c.a) expect(qs.get(c.q)!.has(a), `${where}: unknown option ${c.q}=${a}`).toBe(true);
      };
      expect(new Set(f.possibilities.map((p) => p.id)).size, `${f.id}: duplicate possibility ids`).toBe(f.possibilities.length);
      for (const p of f.possibilities) {
        const where = `${f.id}/${p.id}`;
        p.supports.forEach((c) => check(c, where));
        p.weakens.forEach((c) => check(c, where));
        p.showIf?.forEach((c) => check(c, where));
        for (const c of p.components) expect(COMPONENT_BY_ID[c], `${where} → ${c}`).toBeDefined();
        expect(p.nextObservation.length, where).toBeGreaterThan(10);
      }
      for (const s of f.safety) s.when?.forEach((c) => check(c, `${f.id}/safety`));
    }
  });

  it("never presents percentages or certainty language", () => {
    const text = JSON.stringify(SYMPTOM_FLOWS);
    expect(text).not.toMatch(/\d+\s?%/);
    expect(text.toLowerCase()).not.toMatch(/\b(definitely broken|is the cause|diagnosis:)\b/);
  });
});

describe("OBD table and presets", () => {
  it("links codes to real components", () => {
    for (const c of OBD_CODES) {
      expect(c.code).toMatch(/^P[02][0-9A-F]{3}$/);
      for (const id of c.components) expect(COMPONENT_BY_ID[id], `${c.code} → ${id}`).toBeDefined();
    }
  });

  it("has finite camera presets", () => {
    for (const p of PRESETS) for (const v of [...p.position, ...p.target]) expect(Number.isFinite(v)).toBe(true);
    expect(PRESETS[0].id).toBe("overview");
  });
});
