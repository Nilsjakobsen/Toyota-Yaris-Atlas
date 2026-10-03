import type { SystemDef, SystemId } from "./types";

/** Display order matters: this is the order of the system toggles. */
export const SYSTEMS: SystemDef[] = [
  {
    id: "engine",
    name: { en: "Engine & intake", no: "Motor og innsug" },
    colour: "#d9822b",
    blurb: "Burns petrol and air to turn the crankshaft. Air comes in through the filter and throttle.",
    fan: [0, 1, 0.25],
    spread: 1.0,
  },
  {
    id: "fuel-ignition",
    name: { en: "Fuel & ignition", no: "Drivstoff og tenning" },
    colour: "#c94f4f",
    blurb: "Stores and meters fuel, fires the spark plugs, and runs the engine management.",
    fan: [0, 1, 0],
    spread: 1.15,
  },
  {
    id: "cooling",
    name: { en: "Cooling", no: "Kjøling" },
    colour: "#3b8fd9",
    blurb: "Carries engine heat to the radiator with coolant and a fan.",
    fan: [0, 0.25, 1],
    spread: 1.0,
  },
  {
    id: "electrical",
    name: { en: "Battery, charging & starting", no: "Batteri, lading og start" },
    colour: "#d4b72c",
    blurb: "12 V battery, the alternator that recharges it, the starter motor and fuses.",
    fan: [0.6, 0.7, 0.15],
    spread: 1.0,
  },
  {
    id: "drivetrain",
    name: { en: "Transmission & drivetrain", no: "Girkasse og drivverk" },
    colour: "#8a6fc9",
    blurb: "Gearbox and drive shafts take engine power to the front wheels.",
    fan: [0.45, -0.5, 0],
    spread: 0.9,
  },
  {
    id: "brakes",
    name: { en: "Brakes", no: "Bremser" },
    colour: "#d94f8a",
    blurb: "Hydraulic brakes at each wheel, controlled from the pedal, with ABS.",
    fan: [0, 0.15, 0],
    spread: 1.0,
  },
  {
    id: "steering-suspension",
    name: { en: "Steering & suspension", no: "Styring og hjuloppheng" },
    colour: "#3fae8c",
    blurb: "Points the front wheels and keeps all four on the road over bumps.",
    fan: [0, -0.35, 0],
    spread: 0.9,
  },
  {
    id: "wheels",
    name: { en: "Wheels & tyres", no: "Hjul og dekk" },
    colour: "#5c6670",
    blurb: "Rims and tyres. Size from your registration: 185/60 R15.",
    fan: [0, 0, 0],
    spread: 1.25,
  },
  {
    id: "exhaust",
    name: { en: "Exhaust & emissions", no: "Eksos og utslipp" },
    colour: "#9a7b5a",
    blurb: "Carries exhaust gas from the engine, cleans it in the catalyst and quietens it.",
    fan: [0, -0.8, -0.35],
    spread: 0.9,
  },
  {
    id: "body",
    name: { en: "Body (approximate shell)", no: "Karosseri (omtrentlig)" },
    colour: "#b9bfc6",
    blurb: "Placeholder silhouette sized to the registered length and width. Not a scan.",
    fan: [0, 1, 0],
    spread: 1.0,
  },
];

export const SYSTEM_BY_ID: Record<SystemId, SystemDef> = Object.fromEntries(
  SYSTEMS.map((s) => [s.id, s]),
) as Record<SystemId, SystemDef>;

export const SYSTEM_IDS: SystemId[] = SYSTEMS.map((s) => s.id);
