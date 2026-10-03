import type { VehicleFact, VehicleQuestion } from "./types";

/**
 * The vehicle profile. Three kinds of fact are kept apart on purpose:
 *  - OWNER_FACTS:   transcribed from the registration record by the owner
 *  - VARIANT_FACTS: what independent sources say about the variant those facts point to
 *  - DERIVED_FACTS: generic calculations from owner data (e.g. tyre code tables)
 * Private identifiers (registration, VIN) are NOT here. See config/vehicle.example.json.
 */

export const OWNER_FACTS: VehicleFact[] = [
  { id: "make-model", label: "Make / model", value: "Toyota Yaris", level: "owner", sources: ["owner-registration"] },
  { id: "colour", label: "Colour", value: "Silver", level: "owner", sources: ["owner-registration"] },
  { id: "fuel", label: "Fuel", value: "Petrol", level: "owner", sources: ["owner-registration"] },
  { id: "seats", label: "Seats", value: "5", level: "owner", sources: ["owner-registration"] },
  {
    id: "first-reg",
    label: "First registered in Norway",
    value: "15 August 2011",
    level: "owner",
    sources: ["owner-registration"],
    note: "A registration date is not a model year and does not by itself identify the generation.",
  },
  { id: "displacement", label: "Displacement", value: "1329 cm³", level: "owner", sources: ["owner-registration"] },
  { id: "power", label: "Power", value: "73 kW / 99 hp", level: "owner", sources: ["owner-registration"] },
  { id: "length", label: "Length", value: "3790 mm", level: "owner", sources: ["owner-registration"] },
  { id: "width", label: "Width", value: "1700 mm", level: "owner", sources: ["owner-registration"] },
  { id: "kerb", label: "Kerb weight", value: "1070 kg", level: "owner", sources: ["owner-registration"] },
  { id: "gvw", label: "Max permitted weight", value: "1480 kg", level: "owner", sources: ["owner-registration"] },
  { id: "tyres", label: "Tyres front / rear", value: "185/60 R15", level: "owner", sources: ["owner-registration"] },
  { id: "offset", label: "Wheel offset front / rear", value: "45 mm", level: "owner", sources: ["owner-registration"] },
  { id: "tyre-index", label: "Listed load / speed index", value: "78 / S", level: "owner", sources: ["owner-registration"] },
  { id: "euro", label: "Emissions class", value: "Euro 5L", level: "owner", sources: ["owner-registration"] },
  { id: "co2", label: "CO₂", value: "120 g/km", level: "owner", sources: ["owner-registration"] },
  { id: "last-eu", label: "Last approved inspection", value: "28 January 2025", level: "owner", sources: ["owner-registration"] },
  { id: "next-eu", label: "Next inspection deadline", value: "31 January 2027", level: "owner", sources: ["owner-registration"] },
];

export const INSPECTION_DEADLINE = "2027-01-31";

export const VARIANT_FACTS: VehicleFact[] = [
  {
    id: "generation",
    label: "Generation",
    value: "Second generation, XP90 facelift (2009–2011)",
    level: "verified",
    sources: ["toyota-uk-2009-release", "adac-xp90-manual", "toyota-uk-gen3-pack-2011", "toyota-fr-xp130-start", "tv2-broom-2011", "wheel-size-2011"],
    note:
      "Inferred by matching your registration data: length 3790 mm vs 3785 (XP90) and 3885 (XP130); 185/60 R15 with 45 mm offset matches the XP90 1.33; the XP130 only entered production on 13 July 2011 and reached Norwegian dealers in late October 2011. Not yet checked against the model code on the car itself.",
  },
  {
    id: "engine-code",
    label: "Engine",
    value: "1NR-FE 1.33 Dual VVT-i, DOHC 16-valve, chain-driven camshafts",
    level: "verified",
    sources: ["toyota-uk-2009-release", "toyota-uk-2009-brochure", "adac-xp90-manual"],
    note: "Toyota UK names the 1,329 cc XP90 engine 1NR-FE. ADAC lists the 73 kW / Euro 5 revision built 10/2010–10/2011, which matches your power figure.",
  },
  {
    id: "model-code",
    label: "Model code (expected)",
    value: "NSP90 (probably NSP90L for left-hand drive)",
    level: "unknown",
    sources: ["parts-catalogue-nsp90"],
    note: "Only seen in third-party catalogue snippets, and the 'L' meaning is an inference. Confirm on the vehicle label.",
  },
  {
    id: "transmission",
    label: "Transmission",
    value: "Manual (6-speed per sources)",
    level: "owner",
    sources: ["owner-observed", "toyota-uk-2009-release", "toyota-uk-2009-brochure", "adac-xp90-manual"],
    note: "You confirmed a manual gearbox. Sources list a 6-speed manual for the XP90 1.33, and your 120 g/km matches its published CO₂ (the MultiMode was 119).",
  },
  {
    id: "stop-start",
    label: "Stop & Start",
    value: "Likely, not yet confirmed",
    level: "unknown",
    sources: ["toyota-uk-2009-release", "adac-xp90-manual"],
    note: "Offered with the manual gearbox, which you have. ADAC lists it as standard on the 10/2010–10/2011 manual. Notice whether the engine stops by itself at traffic lights.",
  },
  {
    id: "drive",
    label: "Driven wheels",
    value: "Front-wheel drive (expected)",
    level: "generic",
    sources: ["generic-automotive"],
    note: "Not explicitly confirmed in the sources reviewed so far.",
  },
  {
    id: "suspension",
    label: "Suspension",
    value: "MacPherson struts with anti-roll bar (front), torsion beam (rear)",
    level: "verified",
    sources: ["toyota-uk-2009-release"],
    note: "UK-market XP90 facelift specification.",
  },
  {
    id: "front-brakes",
    label: "Front brakes",
    value: "Ventilated discs, 258 mm",
    level: "verified",
    sources: ["toyota-uk-2009-release"],
    note: "UK-market XP90 facelift specification. Norwegian specification not seen.",
  },
  {
    id: "rear-brakes",
    label: "Rear brakes",
    value: "Unresolved: 203 mm drums or discs",
    level: "unknown",
    sources: ["toyota-uk-2009-release", "toyota-uk-2009-brochure", "adac-xp90-manual"],
    note: "UK: drums as standard, discs with the optional VSC. ADAC (Germany) lists discs. Look through a rear wheel to settle it.",
  },
  {
    id: "abs",
    label: "ABS",
    value: "ABS with EBD and Brake Assist",
    level: "verified",
    sources: ["toyota-uk-2009-brochure"],
    note: "Standard on UK-market cars per the brochure. Stability control (VSC) was optional in the UK — unresolved for your car.",
  },
  {
    id: "dimensions",
    label: "Height / wheelbase",
    value: "1530 mm / 2460 mm",
    level: "verified",
    sources: ["adac-xp90-manual"],
    note: "Secondary database figure for the XP90 facelift 5-door. Used to size the placeholder; not on your registration data.",
  },
];

export const DERIVED_FACTS: VehicleFact[] = [
  {
    id: "tyre-diameter",
    label: "Tyre overall diameter",
    value: "≈ 603 mm",
    level: "generic",
    sources: ["tyre-designation"],
    note: "381 mm rim (15 in) + 2 × 111 mm sidewall (60 % of 185 mm). Calculated, not measured.",
  },
  {
    id: "load-index",
    label: "Load index 78",
    value: "425 kg per tyre",
    level: "generic",
    sources: ["tyre-designation"],
    note: "Your registration lists 78 / S as the minimum. The original fitment may have been higher (one database lists 84H) — read your tyre sidewall.",
  },
  { id: "speed-index", label: "Speed symbol S", value: "180 km/h", level: "generic", sources: ["tyre-designation"] },
];

/** Questions the owner can answer by looking at the car. Answers are stored locally. */
export const VEHICLE_QUESTIONS: VehicleQuestion[] = [
  {
    id: "model-code",
    question: "What model code is printed on the vehicle label?",
    why: "The model code (expected to start NSP90) confirms generation, engine and gearbox, and is what parts catalogues are indexed by.",
    howToCheck: [
      "Look for a manufacturer's label on the lower driver's-side door pillar (B-pillar) or under the bonnet; the owner's manual shows where.",
      "Write down the code that looks like 'NSP90L-…'. It is not a private identifier, but it is stored only on this computer.",
    ],
    freeText: true,
    affects: ["engine", "transmission", "body-shell"],
  },
  {
    id: "rear-brakes",
    question: "Are the rear brakes drums or discs?",
    why: "Both existed for the XP90 depending on market and on whether VSC was fitted.",
    howToCheck: [
      "Parked, look through the spokes of a rear wheel (a torch helps).",
      "A flat shiny disc with a caliper clamped on its edge = disc. A closed round drum = drum.",
    ],
    options: [
      { id: "drum", label: "Drum" },
      { id: "disc", label: "Disc" },
      { id: "unsure", label: "Not sure yet" },
    ],
    affects: ["rear-brakes"],
  },
  {
    id: "vsc",
    question: "Is stability control (VSC) fitted?",
    why: "VSC was optional in some markets and came with rear discs in the UK.",
    howToCheck: [
      "Look for a 'VSC OFF' button or a skidding-car symbol that lights briefly when you switch the ignition on.",
    ],
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "Not sure yet" },
    ],
    affects: ["abs-unit", "rear-brakes"],
  },
  {
    id: "stop-start",
    question: "Does the engine switch itself off when you stop (Stop & Start)?",
    why: "Stop & Start cars often need a specific battery type and use the starter much more.",
    howToCheck: ["Look for a Stop & Start button or an 'A' symbol with a circular arrow on the dashboard, or notice whether the engine stops at traffic lights."],
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "Not sure yet" },
    ],
    affects: ["battery", "starter-motor"],
  },
  {
    id: "doors",
    question: "How many doors does your car have?",
    why: "The XP90 existed as a 3-door and 5-door; the placeholder shell assumes 5 doors.",
    howToCheck: ["Count the side doors plus the tailgate (5-door = four side doors and a tailgate)."],
    options: [
      { id: "5", label: "5-door" },
      { id: "3", label: "3-door" },
    ],
    affects: ["body-shell"],
  },
  {
    id: "tyre-marking",
    question: "What does the tyre sidewall say?",
    why: "The registration lists a minimum; the tyres actually fitted may differ (e.g. 185/60 R15 84H).",
    howToCheck: ["Read the size and the load/speed code moulded on the sidewall of each tyre. Note summer/winter type too."],
    freeText: true,
    affects: ["front-wheels", "rear-wheels"],
  },
  {
    id: "tyre-pressure",
    question: "What tyre pressures does the car's placard recommend?",
    why: "Correct pressures matter for braking, wear and fuel use. This app does not supply them.",
    howToCheck: ["Look for a tyre-pressure label on the driver's door pillar, inside the fuel flap, or in the owner's manual."],
    freeText: true,
    affects: ["front-wheels", "rear-wheels"],
  },
  {
    id: "filler-side",
    question: "Which side is the fuel filler flap on?",
    why: "Useful at the pump, and it confirms where the filler neck runs to the tank.",
    howToCheck: ["Walk around the car — or look for a small arrow next to the fuel gauge pointing to the filler side."],
    options: [
      { id: "left", label: "Left (driver's side)" },
      { id: "right", label: "Right (passenger side)" },
    ],
    affects: ["fuel-tank"],
  },
  {
    id: "manual",
    question: "Do you have the owner's manual for this car?",
    why: "It is the right source for warning-lamp meanings, fuse layout, fluids and jacking points.",
    howToCheck: ["Check the glovebox. Toyota also publishes owner's manuals online; make sure it matches XP90 / your model code."],
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    affects: [],
  },
];
