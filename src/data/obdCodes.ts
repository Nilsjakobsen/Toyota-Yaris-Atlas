/**
 * A small table of GENERIC (SAE J2012 / ISO 15031-6) powertrain codes with their standard
 * descriptions, linked to the systems they concern. Manufacturer-specific codes (the second
 * character is 1 or 3, e.g. P1xxx) are deliberately not interpreted.
 *
 * A code says what the engine computer detected. It does not name a failed part.
 */
export interface ObdCodeInfo {
  code: string;
  description: string;
  components: string[];
  note?: string;
}

export const OBD_CODES: ObdCodeInfo[] = [
  { code: "P0010", description: "'A' camshaft position actuator circuit (bank 1)", components: ["engine", "ecu"] },
  { code: "P0011", description: "'A' camshaft position — timing over-advanced or system performance (bank 1)", components: ["engine", "oil-dipstick"], note: "Variable valve timing is oil-pressure operated on many engines, so oil level and condition are often checked first." },
  { code: "P0012", description: "'A' camshaft position — timing over-retarded (bank 1)", components: ["engine", "oil-dipstick"] },
  { code: "P0100", description: "Mass or volume air flow circuit", components: ["air-filter", "throttle-body", "ecu"] },
  { code: "P0101", description: "Mass or volume air flow circuit range/performance", components: ["air-filter", "throttle-body"] },
  { code: "P0105", description: "Manifold absolute pressure / barometric pressure circuit", components: ["throttle-body", "ecu"] },
  { code: "P0115", description: "Engine coolant temperature circuit", components: ["coolant-hoses", "ecu"] },
  { code: "P0116", description: "Engine coolant temperature circuit range/performance", components: ["coolant-hoses", "ecu"] },
  { code: "P0117", description: "Engine coolant temperature circuit low", components: ["coolant-hoses", "ecu"] },
  { code: "P0118", description: "Engine coolant temperature circuit high", components: ["coolant-hoses", "ecu"] },
  { code: "P0120", description: "Throttle/pedal position sensor/switch 'A' circuit", components: ["throttle-body"] },
  { code: "P0128", description: "Coolant thermostat (coolant temperature below thermostat regulating temperature)", components: ["coolant-hoses", "engine"] },
  { code: "P0130", description: "O2 sensor circuit (bank 1, sensor 1)", components: ["oxygen-sensors"] },
  { code: "P0134", description: "O2 sensor circuit — no activity detected (bank 1, sensor 1)", components: ["oxygen-sensors"] },
  { code: "P0136", description: "O2 sensor circuit (bank 1, sensor 2)", components: ["oxygen-sensors"] },
  { code: "P0171", description: "System too lean (bank 1)", components: ["throttle-body", "air-filter", "fuel-injectors", "oxygen-sensors"], note: "Lean means more air than expected relative to fuel — for example an air leak or low fuel delivery." },
  { code: "P0172", description: "System too rich (bank 1)", components: ["fuel-injectors", "air-filter", "oxygen-sensors"] },
  { code: "P0201", description: "Injector circuit/open — cylinder 1", components: ["fuel-injectors", "ecu"] },
  { code: "P0202", description: "Injector circuit/open — cylinder 2", components: ["fuel-injectors", "ecu"] },
  { code: "P0203", description: "Injector circuit/open — cylinder 3", components: ["fuel-injectors", "ecu"] },
  { code: "P0204", description: "Injector circuit/open — cylinder 4", components: ["fuel-injectors", "ecu"] },
  { code: "P0300", description: "Random/multiple cylinder misfire detected", components: ["ignition-coils", "fuel-injectors", "throttle-body"] },
  { code: "P0301", description: "Cylinder 1 misfire detected", components: ["ignition-coils", "fuel-injectors"], note: "Tells you which cylinder, not which part. Cylinder numbering for your engine is in workshop data." },
  { code: "P0302", description: "Cylinder 2 misfire detected", components: ["ignition-coils", "fuel-injectors"] },
  { code: "P0303", description: "Cylinder 3 misfire detected", components: ["ignition-coils", "fuel-injectors"] },
  { code: "P0304", description: "Cylinder 4 misfire detected", components: ["ignition-coils", "fuel-injectors"] },
  { code: "P0335", description: "Crankshaft position sensor 'A' circuit", components: ["engine", "ecu"] },
  { code: "P0340", description: "Camshaft position sensor 'A' circuit (bank 1 or single sensor)", components: ["engine", "ecu"] },
  { code: "P0351", description: "Ignition coil 'A' primary/secondary circuit", components: ["ignition-coils"] },
  { code: "P0352", description: "Ignition coil 'B' primary/secondary circuit", components: ["ignition-coils"] },
  { code: "P0353", description: "Ignition coil 'C' primary/secondary circuit", components: ["ignition-coils"] },
  { code: "P0354", description: "Ignition coil 'D' primary/secondary circuit", components: ["ignition-coils"] },
  { code: "P0420", description: "Catalyst system efficiency below threshold (bank 1)", components: ["exhaust-manifold-cat", "oxygen-sensors"], note: "Often investigated together with the downstream O2 sensor and any misfire history." },
  { code: "P0441", description: "Evaporative emission system incorrect purge flow", components: ["fuel-tank"] },
  { code: "P0455", description: "Evaporative emission system leak detected (large leak)", components: ["fuel-tank"], note: "A loose or missing fuel cap is a common, simple thing to rule out first." },
  { code: "P0456", description: "Evaporative emission system leak detected (very small leak)", components: ["fuel-tank"] },
  { code: "P0500", description: "Vehicle speed sensor 'A'", components: ["transmission", "abs-unit"] },
  { code: "P0505", description: "Idle air control system", components: ["throttle-body"] },
  { code: "P0562", description: "System voltage low", components: ["battery", "alternator"] },
  { code: "P0563", description: "System voltage high", components: ["alternator", "battery"] },
  { code: "P0606", description: "Control module processor", components: ["ecu"] },
  { code: "P2135", description: "Throttle/pedal position sensor/switch 'A'/'B' voltage correlation", components: ["throttle-body"] },
];

const BY_CODE = new Map(OBD_CODES.map((c) => [c.code, c]));

export type CodeLookup =
  | { kind: "invalid"; input: string }
  | { kind: "generic"; code: string; info: ObdCodeInfo }
  | { kind: "generic-unlisted"; code: string }
  | { kind: "manufacturer"; code: string }
  | { kind: "other-domain"; code: string };

/** Normalise and classify a manually entered code like "p0301" or "P0301 ". */
export function lookupCode(raw: string): CodeLookup {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[PBCU][0-3][0-9A-F]{3}$/.test(code)) return { kind: "invalid", input: raw };
  if (code[0] !== "P") return { kind: "other-domain", code };
  // P0, P2 (mostly), P34-P39 are generic; P1 and P30-P33 are manufacturer-controlled.
  if (code[1] === "1" || (code[1] === "3" && "0123".includes(code[2]))) return { kind: "manufacturer", code };
  const info = BY_CODE.get(code);
  return info ? { kind: "generic", code, info } : { kind: "generic-unlisted", code };
}
