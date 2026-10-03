import { describe, expect, it } from "vitest";
import { buildIndex, fold, search } from "../src/lib/search";
import { COMPONENTS } from "../src/data/components";
import { buildExport, mergeEntries, validateImport, type LogEntry } from "../src/lib/log";
import { FLOW_BY_ID } from "../src/data/symptoms";
import { activeSafety, evaluateFlow } from "../src/lib/flowEval";
import { lookupCode } from "../src/data/obdCodes";
import { maskRegistration, maskVin } from "../src/lib/privateConfig";

const index = buildIndex(COMPONENTS);
const top = (q: string) => search(index, q)[0]?.record.id;

describe("search", () => {
  it("folds Norwegian letters and casual spellings together", () => {
    expect(fold("Kjølevifte")).toBe("kjolevifte");
    expect(fold("kjoelevifte")).toBe("kjolevifte");
    expect(fold("Bremsevæske")).toBe(fold("bremsevaeske"));
    expect(fold("Påfylling")).toBe(fold("paafylling"));
  });

  it("finds parts by Norwegian names and synonyms", () => {
    expect(top("peilepinne")).toBe("oil-dipstick");
    expect(top("dynamo")).toBe("alternator");
    expect(top("lyddemper")).toBe("exhaust-silencer");
    expect(top("kjolevifte")).toBe("cooling-fan");
    expect(top("girkasse")).toBe("transmission");
    expect(top("bremseskive")).toBe("front-brakes");
    expect(top("tennplugg")).toBe("ignition-coils");
    expect(top("ekspansjonstank")).toBe("coolant-reservoir");
  });

  it("finds parts by English names and prefixes", () => {
    expect(top("battery")).toBe("battery");
    expect(top("radiat")).toBe("radiator");
    expect(top("catalytic")).toBe("exhaust-manifold-cat");
    expect(top("lambda")).toBe("oxygen-sensors");
  });

  it("finds every component by its own English and Norwegian name", () => {
    for (const c of COMPONENTS) {
      expect(search(index, c.name.en).slice(0, 3).map((h) => h.record.id), c.name.en).toContain(c.id);
      expect(search(index, c.name.no).slice(0, 3).map((h) => h.record.id), c.name.no).toContain(c.id);
    }
  });

  it("returns nothing for empty or nonsense queries", () => {
    expect(search(index, "   ")).toEqual([]);
    expect(search(index, "qzxv")).toEqual([]);
  });
});

const entry = (id: string, date: string, extra: Partial<LogEntry> = {}): LogEntry => ({
  id,
  createdAt: `${date}T10:00:00.000Z`,
  date,
  kind: "observation",
  title: `Entry ${id}`,
  notes: "Looked at it",
  components: ["battery"],
  ...extra,
});

describe("log export / import", () => {
  it("round-trips entries, answers and confirmations", () => {
    const exp = buildExport([entry("a", "2026-09-01"), entry("b", "2026-09-20", { odometerKm: 148200, codes: ["P0301"] })], { transmission: "manual" }, {
      battery: { confirmed: true, note: "front left", at: "2026-09-20T10:00:00Z" },
    });
    const r = validateImport(JSON.parse(JSON.stringify(exp)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.entries.map((e) => e.id)).toEqual(["b", "a"]);
    expect(r.data.entries[0].odometerKm).toBe(148200);
    expect(r.data.vehicleAnswers.transmission).toBe("manual");
    expect(r.data.confirmations.battery.confirmed).toBe(true);
  });

  it("never includes private identifiers in an export", () => {
    const text = JSON.stringify(buildExport([entry("a", "2026-09-01")], {}, {}));
    expect(text).not.toMatch(/"vin"|"registration"/i);
  });

  it("rejects files that are not exports", () => {
    expect(validateImport(null).ok).toBe(false);
    expect(validateImport([]).ok).toBe(false);
    expect(validateImport({ app: "other", format: 1, entries: [] }).ok).toBe(false);
    expect(validateImport({ app: "toyota-yaris-atlas", format: 2, entries: [] }).ok).toBe(false);
    expect(validateImport({ app: "toyota-yaris-atlas", format: 1, entries: [{ id: "x", date: "1/2/2026", title: "t" }] }).ok).toBe(false);
  });

  it("drops unknown component IDs with a warning", () => {
    const r = validateImport({ app: "toyota-yaris-atlas", format: 1, entries: [entry("a", "2026-09-01", { components: ["battery", "flux-capacitor"] })] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.entries[0].components).toEqual(["battery"]);
    expect(r.warnings.length).toBe(1);
  });

  it("merges without duplicating existing entries", () => {
    const m = mergeEntries([entry("a", "2026-09-01")], [entry("a", "2026-09-01"), entry("c", "2026-09-05")]);
    expect(m.added).toBe(1);
    expect(m.skipped).toBe(1);
    expect(m.entries.map((e) => e.id)).toEqual(["c", "a"]);
  });
});

describe("symptom evaluation", () => {
  it("leaves everything unassessed with no answers", () => {
    const ev = evaluateFlow(FLOW_BY_ID["no-crank"], {});
    expect(ev.every((e) => e.fit === "open")).toBe(true);
    expect(ev.find((e) => e.possibility.id === "starter-engagement")).toBeUndefined(); // showIf hides it
  });

  it("groups possibilities by how the answers line up", () => {
    const ev = evaluateFlow(FLOW_BY_ID["no-crank"], { dash: "dim", sound: "rapid-click" });
    expect(ev[0].possibility.id).toBe("battery-low");
    expect(ev[0].fit).toBe("fits");
    expect(ev[0].supporting.length).toBe(2);
    const starter = ev.find((e) => e.possibility.id === "starter-circuit")!;
    expect(starter.fit).toBe("less");
  });

  it("raises stop-driving guidance from specific answers", () => {
    const ov = FLOW_BY_ID["overheating"];
    expect(activeSafety(ov, {}).some((s) => s.level === "stop" && /Never open/.test(s.text))).toBe(true);
    expect(activeSafety(ov, { gauge: "red" }).filter((s) => s.level === "stop").length).toBe(2);
    const wl = FLOW_BY_ID["warning-light"];
    expect(activeSafety(wl, { lamp: "oil" })[0].level).toBe("stop");
    const br = FLOW_BY_ID["braking"];
    expect(activeSafety(br, { symptom: "sinks" })[0].text).toMatch(/do not drive/i);
  });

  it("classifies manually entered OBD codes without over-interpreting them", () => {
    expect(lookupCode(" p0301 ")).toMatchObject({ kind: "generic", code: "P0301" });
    expect(lookupCode("P1349").kind).toBe("manufacturer");
    expect(lookupCode("P3000").kind).toBe("manufacturer");
    expect(lookupCode("P0999").kind).toBe("generic-unlisted");
    expect(lookupCode("B1234").kind).toBe("other-domain");
    expect(lookupCode("X123").kind).toBe("invalid");
    expect(lookupCode("P03011").kind).toBe("invalid");
  });
});

describe("private identifier masking", () => {
  it("hides all but a few characters", () => {
    expect(maskVin("ABCDEFGHJK1234567")).toBe("ABC••••••••••4567");
    expect(maskRegistration("AB12345")).toBe("AB•••••");
  });
});
