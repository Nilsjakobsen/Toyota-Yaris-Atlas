import type { ComponentRecord } from "./types";

/**
 * The component catalogue. Each record's `id` is the stable key shared with the 3D
 * placeholder layout (src/viewer/placeholders.ts) and with any GLB you export from Blender.
 *
 * Writing rules for this file:
 *  - Explanations are generic unless a cited source says otherwise.
 *  - Locations are "approximate" (placed by estimate) or "unknown" until you confirm them.
 *  - No part numbers, torque settings, fluid specifications, fuse assignments, wiring or
 *    service intervals. Those belong to the owner's manual / workshop data for your variant.
 */
export const COMPONENTS: ComponentRecord[] = [
  /* ------------------------------------------------------------ ENGINE & INTAKE */
  {
    id: "engine",
    name: { en: "Engine (block, head and sump)", no: "Motor (blokk, topp og bunnpanne)" },
    aliases: {
      en: ["motor", "cylinder block", "cylinder head", "cam cover", "oil pan", "sump"],
      no: ["motorblokk", "sylinderblokk", "sylinderhode", "topplokk", "ventildeksel", "bunnpanne", "oljetråg"],
    },
    system: "engine",
    function:
      "The engine burns a petrol–air mixture in its cylinders to turn the crankshaft. The block holds the cylinders and crankshaft, the head carries the valves and camshafts, and the sump at the bottom holds the engine oil.",
    location: {
      text: "Across the front of the car under the bonnet (a transverse engine is typical for a front-wheel-drive car of this size). Placeholder position and size are estimates.",
      status: "approximate",
    },
    presence: {
      status: "verified",
      note: "Registration: petrol, 1329 cm³, 73 kW. Sources for the XP90 1.33 name this engine 1NR-FE (DOHC 16-valve, chain-driven camshafts). Applies if the generation identification is right.",
    },
    related: ["throttle-body", "air-filter", "ignition-coils", "fuel-injectors", "engine-mounts", "oil-dipstick", "exhaust-manifold-cat", "transmission"],
    symptoms: ["Rough running or misfire", "Oil leaks (spots under the front)", "Knocking or ticking noises", "Overheating", "Blue or white exhaust smoke"],
    checks: [
      "With the engine off and cool, look for wet oil around the cam cover and sump.",
      "Note any oil spots under the front of the car after it has been parked overnight.",
    ],
    safety: ["Do not reach into the engine bay while the engine is running; the cooling fan can start on its own."],
    unknowns: ["Model code on the vehicle label (confirms the engine)", "Whether the intake faces the front or the rear of the car"],
    sources: ["owner-registration", "toyota-uk-2009-release", "toyota-uk-2009-brochure", "adac-xp90-manual", "generic-automotive"],
  },
  {
    id: "air-filter",
    name: { en: "Air filter housing", no: "Luftfilterhus" },
    aliases: { en: ["air box", "air cleaner", "intake duct"], no: ["luftfilter", "luftfilterboks", "luftinntak"] },
    system: "engine",
    function:
      "Filters the air the engine breathes. A paper element inside the housing catches dust; a heavily blocked filter can reduce power and economy.",
    location: { text: "On or near the top of the engine bay, connected to the throttle by a large duct. Exact position not confirmed.", status: "approximate" },
    presence: { status: "generic" },
    related: ["throttle-body", "engine"],
    symptoms: ["Reduced power", "Higher fuel consumption", "Hissing from a loose intake duct"],
    checks: ["Engine off: check that the housing clips are closed and the duct is not split or loose."],
    sources: ["generic-automotive"],
  },
  {
    id: "throttle-body",
    name: { en: "Throttle body & intake manifold", no: "Gasspjeldhus og innsugsmanifold" },
    aliases: { en: ["throttle", "intake manifold", "inlet manifold"], no: ["gasspjeld", "innsugningsmanifold", "innsugsrør"] },
    system: "engine",
    function:
      "The throttle valve controls how much air enters the engine; the intake manifold distributes that air to each cylinder. Modern throttles are usually electronically controlled from the accelerator pedal.",
    location: {
      text: "Between the air filter duct and the engine. The placeholder puts the manifold at the front of the engine — this orientation is NOT verified for your engine.",
      status: "approximate",
    },
    presence: { status: "generic", note: "Electronic (drive-by-wire) throttle is likely for this era but is not confirmed." },
    related: ["air-filter", "engine", "fuel-injectors", "ecu"],
    symptoms: ["Unstable or high idle", "Hesitation", "Engine warning lamp"],
    sources: ["generic-automotive"],
  },
  {
    id: "oil-dipstick",
    name: { en: "Oil filler cap & dipstick", no: "Oljelokk og peilepinne" },
    aliases: { en: ["dipstick", "oil cap", "engine oil level"], no: ["oljepeilepinne", "oljepåfylling", "motorolje", "oljenivå"] },
    system: "engine",
    function:
      "The dipstick shows the engine oil level between its MIN and MAX marks; the filler cap is where oil is added. Checking the level is one of the most useful owner checks.",
    location: { text: "On top of the engine; the dipstick usually has a brightly coloured handle. Position in the model is an estimate.", status: "approximate" },
    presence: { status: "generic" },
    related: ["engine"],
    symptoms: ["Oil pressure warning lamp", "Low oil level", "Milky residue under the cap (can indicate coolant contamination or condensation)"],
    checks: [
      "Car on level ground, engine off for several minutes: pull the dipstick, wipe, reinsert fully, pull again and read the level.",
      "Look at the underside of the filler cap (engine cool) for creamy or milky residue and note what you see.",
    ],
    unknowns: ["Correct oil grade and capacity — take these from the owner's manual for your variant, not from this app."],
    sources: ["generic-automotive"],
  },

  /* ------------------------------------------------------------ FUEL & IGNITION */
  {
    id: "fuel-tank",
    name: { en: "Fuel tank & in-tank pump", no: "Drivstofftank og tankpumpe" },
    aliases: { en: ["petrol tank", "gas tank", "fuel pump", "fuel gauge sender"], no: ["bensintank", "bensinpumpe", "drivstoffpumpe", "tank"] },
    system: "fuel-ignition",
    function:
      "Stores the petrol. On most modern cars an electric fuel pump sits inside the tank and pushes fuel forward to the engine; many pumps hum briefly when the ignition is switched on.",
    location: { text: "Under the rear seat area, ahead of the rear axle (typical layout). Shape and position are estimates.", status: "approximate" },
    presence: { status: "generic" },
    related: ["fuel-injectors", "ecu", "fuse-box"],
    symptoms: ["Cranks but will not start", "Engine cuts out or hesitates under load", "Fuel smell", "Engine warning lamp (evaporative-system codes)"],
    checks: ["Listen (from the driver's seat) for a short hum from the rear when switching the ignition on.", "Check that the fuel cap clicks closed after refuelling."],
    safety: ["Fuel-system work is not a DIY job here. If you smell strong petrol, do not start the engine; ventilate and get help."],
    unknowns: ["Which side the filler flap is on — check your car and record it."],
    sources: ["generic-automotive"],
  },
  {
    id: "fuel-injectors",
    name: { en: "Fuel rail & injectors", no: "Drivstoffskinne og innsprøytingsdyser" },
    aliases: { en: ["injector", "fuel rail"], no: ["dyse", "dyser", "innsprøyting", "bensindyse"] },
    system: "fuel-ignition",
    function:
      "Injectors spray precisely timed amounts of fuel, commanded by the engine control unit. The fuel rail feeds them under pressure.",
    location: { text: "On the intake side of the engine. Which side that is on this engine is not verified.", status: "approximate" },
    presence: { status: "generic", note: "Port injection is common for this class of engine but is not confirmed." },
    related: ["fuel-tank", "throttle-body", "ecu", "engine"],
    symptoms: ["Misfire on one cylinder", "Rough idle", "Fuel smell", "Starting problems"],
    safety: ["The fuel system is pressurised. Do not open fuel lines or remove injectors yourself."],
    sources: ["generic-automotive"],
  },
  {
    id: "ignition-coils",
    name: { en: "Ignition coils & spark plugs", no: "Tennspoler og tennplugger" },
    aliases: { en: ["coil pack", "spark plug", "coil-on-plug"], no: ["tennspole", "tennplugg", "tenning"] },
    system: "fuel-ignition",
    function:
      "Each coil turns 12 V into the high voltage that jumps the spark plug gap and ignites the mixture. Many engines of this era use one coil per cylinder sitting directly on the plug.",
    location: { text: "On top of the cylinder head, in a row. The placeholder shows four coils; the cylinder count is consistent with a 1.3-litre engine but not confirmed.", status: "approximate" },
    presence: { status: "generic" },
    related: ["engine", "ecu"],
    symptoms: ["Misfire or shaking at idle", "Flashing engine warning lamp", "Poor starting in damp weather"],
    safety: ["Ignition systems produce very high voltage. Do not touch coils or leads with the engine running."],
    sources: ["generic-automotive"],
  },
  {
    id: "ecu",
    name: { en: "Engine control unit (ECU)", no: "Motorstyringsenhet (ECU)" },
    aliases: { en: ["ECM", "engine computer", "PCM", "immobiliser"], no: ["styreenhet", "motorstyring", "startsperre", "elektronikk"] },
    system: "fuel-ignition",
    function:
      "The engine computer reads the sensors and controls fuel, ignition and throttle. It also stores diagnostic trouble codes and turns on the engine warning lamp when it detects a fault.",
    location: { text: "UNKNOWN for this car. Shown floating behind the dashboard area as a reminder only — do not use this position to find it.", status: "unknown" },
    presence: { status: "generic" },
    related: ["obd-port", "throttle-body", "fuel-injectors", "ignition-coils", "oxygen-sensors"],
    symptoms: ["Engine warning lamp", "No start with security lamp flashing (immobiliser)", "Several unrelated faults at once"],
    unknowns: ["Location on this car", "Immobiliser arrangement"],
    sources: ["generic-automotive"],
  },
  {
    id: "obd-port",
    name: { en: "OBD diagnostic connector", no: "OBD-kontakt (diagnosekontakt)" },
    aliases: { en: ["OBD2", "OBD-II", "EOBD", "diagnostic socket", "DLC"], no: ["diagnoseuttak", "OBD2", "feilkodeleser"] },
    system: "fuel-ignition",
    function:
      "A standard 16-pin socket where a code reader or workshop tool connects to read fault codes. This app does not connect to it — you can enter codes manually in the Symptoms panel.",
    location: { text: "Usually under the dashboard on the driver's side (generic for EOBD cars). Exact spot on your car not confirmed.", status: "approximate" },
    presence: { status: "generic", note: "EOBD is expected on a Euro 5 petrol car; confirm by finding the socket." },
    related: ["ecu"],
    symptoms: [],
    checks: ["Look under the driver's side of the dashboard for a trapezoid-shaped 16-pin socket and record where it is."],
    sources: ["generic-automotive", "obd-generic-codes"],
  },

  /* ------------------------------------------------------------ COOLING */
  {
    id: "radiator",
    name: { en: "Radiator", no: "Radiator" },
    aliases: { en: ["cooler", "heat exchanger"], no: ["kjøler", "radiatoren"] },
    system: "cooling",
    function:
      "Hot coolant from the engine flows through the radiator's thin tubes and fins, where air passing through the front grille carries the heat away.",
    location: { text: "At the very front, behind the grille and bumper. Size is an estimate.", status: "approximate" },
    presence: { status: "generic" },
    related: ["cooling-fan", "coolant-hoses", "coolant-reservoir", "engine"],
    symptoms: ["Overheating, especially at speed", "Coolant leaks at the front", "Sweet smell"],
    safety: ["Never open the cooling system when the engine is warm. Hot coolant is under pressure and can cause serious burns."],
    sources: ["generic-automotive"],
  },
  {
    id: "cooling-fan",
    name: { en: "Electric cooling fan", no: "Kjølevifte" },
    aliases: { en: ["radiator fan", "fan"], no: ["radiatorvifte", "vifte", "elektrisk vifte"] },
    system: "cooling",
    function:
      "Pulls air through the radiator when the car is slow or stationary. It is switched on automatically by temperature and can start even after the engine is switched off.",
    location: { text: "Directly behind the radiator, facing the engine. Size and count of fans are estimates.", status: "approximate" },
    presence: { status: "generic" },
    related: ["radiator", "fuse-box", "ecu"],
    symptoms: ["Overheating in traffic but fine at speed", "Fan running constantly", "Loud whirring"],
    checks: ["After a drive, standing outside the car with the bonnet closed, listen for the fan running at the front."],
    safety: ["Keep hands away from the fan at all times — it can start without warning."],
    sources: ["generic-automotive"],
  },
  {
    id: "coolant-reservoir",
    name: { en: "Coolant reservoir (expansion tank)", no: "Ekspansjonstank (kjølevæskebeholder)" },
    aliases: { en: ["expansion tank", "coolant tank", "overflow bottle", "coolant level"], no: ["kjølevæske", "kjølevæskenivå", "frostvæske", "ekspansjonsbeholder"] },
    system: "cooling",
    function:
      "A translucent tank with MIN and MAX marks that shows the coolant level and absorbs expansion as the coolant warms up.",
    location: { text: "In the engine bay, usually beside or near the radiator. Position not confirmed.", status: "approximate" },
    presence: { status: "generic" },
    related: ["radiator", "coolant-hoses", "engine"],
    symptoms: ["Level dropping over weeks", "Overheating", "Coolant warning or high temperature gauge"],
    checks: ["Engine fully cold (several hours): read the level against the MIN/MAX marks through the tank wall. Do not open the cap to check."],
    safety: ["Do not open the cap when the engine is warm. Coolant is toxic — keep it away from children and pets."],
    unknowns: ["Correct coolant type — take this from the owner's manual for your variant."],
    sources: ["generic-automotive"],
  },
  {
    id: "coolant-hoses",
    name: { en: "Radiator hoses", no: "Kjøleslanger" },
    aliases: { en: ["coolant hose", "top hose", "bottom hose", "thermostat"], no: ["radiatorslange", "kjølevæskeslange", "termostat"] },
    system: "cooling",
    function:
      "Rubber hoses carry coolant between the engine and the radiator. A thermostat (inside the engine's coolant outlet, not modelled separately) controls when coolant flows to the radiator.",
    location: { text: "Between the engine and the radiator. Routing is illustrative only.", status: "approximate" },
    presence: { status: "generic" },
    related: ["radiator", "engine", "coolant-reservoir"],
    symptoms: ["Coolant drips or white crusty residue at joints", "Overheating", "Heater blowing cold"],
    checks: ["Engine cold: look for wet patches, cracks or crusty deposits at hose ends."],
    safety: ["Do not squeeze or loosen hoses on a warm engine."],
    sources: ["generic-automotive"],
  },

  /* ------------------------------------------------------------ ELECTRICAL */
  {
    id: "battery",
    name: { en: "12 V battery", no: "12 V-batteri" },
    aliases: { en: ["car battery", "starter battery", "accumulator"], no: ["batteri", "startbatteri", "akkumulator", "batteripol"] },
    system: "electrical",
    function:
      "Supplies power to start the engine and runs electrics when the engine is off. The alternator recharges it while driving.",
    location: { text: "In the engine bay (typical). The placeholder puts it front-left; confirm on your car.", status: "approximate" },
    presence: { status: "generic", note: "If your car has Stop & Start, it may use a battery type designed for it — check the label before replacing." },
    related: ["alternator", "starter-motor", "fuse-box"],
    symptoms: ["Engine will not crank, or cranks slowly", "Clicking when trying to start", "Dim dashboard lights", "Battery warning lamp"],
    checks: [
      "Engine off: look for white or green corrosion on the terminals and check that clamps look tight (do not use metal tools across the terminals).",
      "Read any date or type label on the battery and record it in the log.",
    ],
    safety: [
      "Batteries can release explosive gas. No sparks or flames nearby.",
      "Do not jump-start a battery that is cracked, leaking or swollen.",
    ],
    unknowns: ["Battery size and type actually fitted"],
    sources: ["generic-automotive"],
  },
  {
    id: "alternator",
    name: { en: "Alternator", no: "Dynamo (generator)" },
    aliases: { en: ["generator", "charging", "accessory belt", "drive belt"], no: ["generator", "lading", "ladestrøm", "reim", "viftereim", "aggregatreim"] },
    system: "electrical",
    function:
      "Driven by the engine's accessory belt, the alternator generates electricity to recharge the battery and power the car while the engine runs.",
    location: { text: "On the front or side of the engine, driven by a belt. Position is an estimate.", status: "approximate" },
    presence: { status: "generic" },
    related: ["battery", "fuse-box", "engine"],
    symptoms: ["Battery warning lamp while driving", "Flat battery after driving", "Squeal from the belt", "Dimming lights"],
    safety: ["Never touch belts or pulleys with the engine running."],
    sources: ["generic-automotive"],
  },
  {
    id: "starter-motor",
    name: { en: "Starter motor", no: "Startmotor" },
    aliases: { en: ["starter", "solenoid", "cranking"], no: ["starter", "startrelé", "solenoid"] },
    system: "electrical",
    function:
      "A powerful electric motor that turns the engine over (cranks it) until it starts. A solenoid on the starter engages it with the flywheel.",
    location: { text: "Low on the engine, where the engine meets the transmission. Exact side not confirmed.", status: "approximate" },
    presence: { status: "generic" },
    related: ["battery", "engine", "transmission", "fuse-box"],
    symptoms: ["Single click and no crank with bright dashboard lights", "Grinding or whirring without the engine turning"],
    safety: ["Do not try to bypass the starter or bridge its terminals."],
    sources: ["generic-automotive"],
  },
  {
    id: "fuse-box",
    name: { en: "Engine-bay fuse & relay box", no: "Sikringsboks i motorrommet" },
    aliases: { en: ["fuses", "relays", "fusebox"], no: ["sikringer", "sikring", "relé", "releer", "sikringsskap"] },
    system: "electrical",
    function:
      "Protects circuits with fuses and switches high-current loads with relays. Cars usually also have a second fuse panel inside the cabin.",
    location: { text: "Engine bay, often near the battery. Position is an estimate; the cabin fuse panel is not modelled.", status: "approximate" },
    presence: { status: "generic" },
    related: ["battery", "alternator", "starter-motor", "cooling-fan", "fuel-tank"],
    symptoms: ["One electrical item stops working", "Fan or fuel pump not running"],
    safety: ["Only replace a fuse with the same rating, ignition off. A fuse that blows again points to a fault — get it checked."],
    unknowns: ["Fuse assignments — read the diagram on the lid or in the owner's manual. This app deliberately does not list them."],
    sources: ["generic-automotive", "owners-manual"],
  },

  /* ------------------------------------------------------------ DRIVETRAIN */
  {
    id: "transmission",
    name: { en: "Transmission (manual gearbox)", no: "Girkasse (manuell)" },
    aliases: {
      en: ["gearbox", "manual", "gear lever", "gear stick", "transaxle", "differential"],
      no: ["girkasse", "manuell", "gir", "girspak", "gearkasse", "differensial"],
    },
    system: "drivetrain",
    function:
      "Changes the gear ratio between engine and wheels. Yours is a manual: you choose the gear with the lever while pressing the clutch. On a front-wheel-drive car the gearbox and differential are combined in one unit (a transaxle) beside the engine.",
    location: { text: "Beside the engine at the front, in line with the crankshaft. The placeholder puts it on the left side; confirm on your car.", status: "approximate" },
    presence: {
      status: "owner",
      note: "You confirmed a manual gearbox. Sources list the XP90 1.33 manual as 6-speed.",
    },
    related: ["clutch", "drive-shafts", "engine", "engine-mounts", "starter-motor"],
    symptoms: ["Difficulty selecting gears, or grinding when changing", "Whining that changes with road speed", "Jumping out of gear", "Oil leak between engine and gearbox"],
    checks: ["Parked, engine off: look under the gearbox area (front, behind the left wheel) for fresh oil drips and note them."],
    unknowns: ["Gearbox oil type — do not guess; take it from the owner's manual or Toyota service information."],
    sources: ["owner-observed", "toyota-uk-2009-release", "adac-xp90-manual", "generic-automotive"],
  },
  {
    id: "clutch",
    name: { en: "Clutch", no: "Clutch (kobling)" },
    aliases: { en: ["clutch disc", "pressure plate", "clutch pedal"], no: ["kobling", "clutchpedal", "lamell", "kløtsj"] },
    system: "drivetrain",
    function:
      "Connects and disconnects the engine from the gearbox when you press the clutch pedal, so you can change gear and pull away smoothly. It wears gradually with use.",
    location: { text: "Between engine and gearbox, inside the bell housing (hidden).", status: "approximate" },
    presence: { status: "owner", note: "Your car has a manual gearbox (you confirmed), so it has a pedal-operated clutch." },
    related: ["transmission", "engine"],
    symptoms: ["Slipping (revs rise without acceleration)", "Judder on take-off", "Burning smell after hill starts", "Clutch biting very high, or a pedal that feels different"],
    checks: ["While driving normally, notice where the clutch starts to bite as you lift the pedal, and record it in the log so you can spot changes over time."],
    sources: ["owner-observed", "generic-automotive"],
    explode: { dir: [0.15, 1, 0.35], spread: 0.78 },
  },
  {
    id: "drive-shafts",
    name: { en: "Drive shafts & CV joints", no: "Drivaksler og drivknuter" },
    aliases: { en: ["driveshaft", "half shaft", "CV boot", "constant velocity joint"], no: ["drivaksel", "drivknute", "mansjett", "drivakselmansjett"] },
    system: "drivetrain",
    function:
      "Carry power from the transmission to each front wheel. Constant-velocity (CV) joints at each end let the wheels steer and move up and down; rubber boots keep grease in and dirt out.",
    location: { text: "From the transmission out to each front wheel hub. Routing is illustrative.", status: "approximate" },
    presence: { status: "generic", note: "Front-wheel drive is expected for this car but is not yet confirmed from a variant source." },
    related: ["transmission", "front-wheels", "front-suspension"],
    symptoms: ["Clicking when turning at full lock (outer CV joint)", "Vibration under acceleration", "Grease sprayed inside the wheel"],
    checks: ["Parked with wheels turned, look behind the front wheels for split boots or grease splatter (do not go under the car)."],
    sources: ["generic-automotive"],
    sides: true,
    explode: { dir: [1, -0.25, 0], spread: 0.22 },
  },
  {
    id: "engine-mounts",
    name: { en: "Engine & gearbox mounts", no: "Motorfester" },
    aliases: { en: ["engine mount", "torque rod", "gearbox mount"], no: ["motoroppheng", "motorfeste", "girkassefeste", "momentstag"] },
    system: "drivetrain",
    function:
      "Rubber-and-metal mounts hold the engine and gearbox to the body and absorb vibration. Worn mounts let the engine rock.",
    location: { text: "Typically one at each end of the engine/gearbox and a torque rod lower down. Positions are estimates.", status: "approximate" },
    presence: { status: "generic" },
    related: ["engine", "transmission"],
    symptoms: ["Vibration at idle felt in the cabin", "Clunk when pulling away or changing gear"],
    sources: ["generic-automotive"],
  },

  /* ------------------------------------------------------------ BRAKES */
  {
    id: "front-brakes",
    name: { en: "Front brakes (discs & calipers)", no: "Bremser foran (skiver og kalipere)" },
    aliases: { en: ["brake disc", "rotor", "caliper", "brake pads"], no: ["bremseskive", "bremsekaliper", "bremseklosser", "skivebrems"] },
    system: "brakes",
    function:
      "When you press the pedal, hydraulic pressure makes each caliper squeeze brake pads against a disc that turns with the wheel. The front brakes do most of the stopping.",
    location: { text: "Inside each front wheel. Disc size is an estimate.", status: "approximate" },
    presence: { status: "verified", note: "XP90 facelift (UK spec): 258 mm ventilated discs. Norwegian-market spec not seen." },
    related: ["brake-master", "abs-unit", "front-wheels", "front-suspension"],
    symptoms: ["Squeal or grinding when braking", "Pulsing pedal or steering wheel when braking", "Car pulls to one side", "Burning smell from one wheel"],
    checks: ["Parked: look through the wheel spokes at the disc surface for deep grooves or a pronounced lip at the edge."],
    safety: ["Grinding, a sinking pedal or a brake warning lamp means: do not keep driving — get the brakes inspected."],
    sources: ["toyota-uk-2009-release", "generic-automotive"],
    sides: true,
    explode: { dir: [1, 0.12, 0], spread: 0.6 },
  },
  {
    id: "rear-brakes",
    name: { en: "Rear brakes (type unconfirmed)", no: "Bremser bak (type ikke bekreftet)" },
    aliases: { en: ["rear drum", "drum brake", "rear disc", "handbrake", "parking brake"], no: ["bremsetrommel", "trommelbrems", "håndbrekk", "parkeringsbrems"] },
    system: "brakes",
    function:
      "Rear brakes share the braking and usually also provide the parking brake. Depending on variant they may be drums or discs.",
    location: { text: "Inside each rear wheel.", status: "approximate" },
    presence: { status: "unknown", note: "UK spec: 203 mm drums as standard, discs with optional VSC. ADAC (Germany) lists discs for the 1.33 manual. Confirm by looking through a rear wheel." },
    related: ["brake-master", "abs-unit", "rear-wheels", "rear-suspension"],
    symptoms: ["Parking brake does not hold", "Scraping from the rear", "Uneven braking"],
    checks: ["Parked: look through a rear wheel. A flat shiny disc with a caliper means disc brakes; a closed drum means drum brakes. Record it in Vehicle → Open questions."],
    unknowns: ["Drum or disc"],
    sources: ["toyota-uk-2009-release", "toyota-uk-2009-brochure", "adac-xp90-manual", "generic-automotive"],
    sides: true,
    explode: { dir: [1, 0.12, 0], spread: 0.6 },
  },
  {
    id: "brake-master",
    name: { en: "Brake fluid reservoir, master cylinder & servo", no: "Bremsevæskebeholder, hovedsylinder og bremseservo" },
    aliases: { en: ["brake booster", "brake fluid", "master cylinder"], no: ["bremsevæske", "hovedsylinder", "servo", "bremseforsterker"] },
    system: "brakes",
    function:
      "The pedal pushes the master cylinder, assisted by the servo (booster), to create hydraulic pressure. The reservoir on top holds brake fluid; its level drops slowly as pads wear.",
    location: { text: "At the back of the engine bay on the driver's side, in line with the pedals (typical). Position is an estimate.", status: "approximate" },
    presence: { status: "generic" },
    related: ["front-brakes", "rear-brakes", "abs-unit"],
    symptoms: ["Brake warning lamp", "Soft or sinking pedal", "Hard pedal needing lots of force"],
    checks: ["Engine off: read the fluid level through the translucent reservoir against MIN/MAX. Do not open it."],
    safety: ["A sinking pedal or brake warning lamp with low fluid: do not drive. Brake fluid damages paint and eyes."],
    unknowns: ["Brake fluid specification — from the reservoir cap or owner's manual, not from this app."],
    sources: ["generic-automotive"],
  },
  {
    id: "abs-unit",
    name: { en: "ABS modulator", no: "ABS-enhet" },
    aliases: { en: ["ABS pump", "anti-lock", "ESP", "VSC", "wheel speed sensor"], no: ["ABS", "låsefrie bremser", "antispinn", "hjulsensor"] },
    system: "brakes",
    function:
      "Stops the wheels locking under hard braking by rapidly modulating brake pressure, using wheel-speed sensors at each wheel. Some variants add stability control.",
    location: { text: "UNKNOWN for this car. Usually in the engine bay with brake pipes attached; shown here only as a reminder.", status: "unknown" },
    presence: { status: "verified", note: "ABS with EBD and Brake Assist was standard on UK-market XP90s. The ABS lamp should light briefly at ignition-on." },
    related: ["brake-master", "front-brakes", "rear-brakes"],
    symptoms: ["ABS warning lamp stays on", "Pulsing pedal during normal braking"],
    checks: ["Switch the ignition on and note whether an ABS lamp lights briefly and then goes out."],
    unknowns: ["Location", "Whether stability control (VSC) is fitted"],
    sources: ["toyota-uk-2009-brochure", "generic-automotive"],
  },

  /* ------------------------------------------------------------ STEERING & SUSPENSION */
  {
    id: "steering",
    name: { en: "Steering rack, column & wheel", no: "Styring (tannstang, rattstamme og ratt)" },
    aliases: { en: ["steering rack", "power steering", "EPS", "tie rod", "track rod", "steering wheel"], no: ["styresnekke", "tannstang", "servostyring", "styrestag", "ratt", "rattstamme"] },
    system: "steering-suspension",
    function:
      "The steering wheel turns the column, which drives a rack-and-pinion that pushes the front wheels left and right through tie rods. Power assistance is usually electric on cars of this era.",
    location: { text: "Rack across the car behind the engine; column up to the driver's seat (left side in Norway). Positions are estimates.", status: "approximate" },
    presence: { status: "generic", note: "Whether assistance is electric, and where its motor sits, is not confirmed." },
    related: ["front-suspension", "front-wheels"],
    symptoms: ["Heavy steering with a warning lamp", "Knock felt through the wheel", "Car wanders or pulls"],
    safety: ["The steering wheel contains an airbag. Do not remove or work on it yourself."],
    sources: ["generic-automotive"],
  },
  {
    id: "front-suspension",
    name: { en: "Front suspension (struts & lower arms)", no: "Hjuloppheng foran (fjærben og bærearmer)" },
    aliases: { en: ["strut", "MacPherson", "shock absorber", "coil spring", "control arm", "wishbone", "anti-roll bar"], no: ["fjærben", "støtdemper", "fjær", "bærearm", "stabilisatorstag", "stabstag"] },
    system: "steering-suspension",
    function:
      "Each front wheel hangs from a strut (spring and shock absorber) and a lower arm. Together they let the wheel move over bumps while staying correctly aligned.",
    location: { text: "Inside each front wheel arch, from the hub up to the top mount under the bonnet. Positions are estimates.", status: "approximate" },
    presence: { status: "verified", note: "XP90 facelift: MacPherson struts with an anti-roll bar (Toyota UK)." },
    related: ["steering", "front-wheels", "front-brakes", "drive-shafts"],
    symptoms: ["Clunk over bumps", "Car keeps bouncing after a bump", "Uneven tyre wear", "One corner sits lower"],
    checks: ["Parked on level ground: compare the gap between each tyre and its arch. Note anything uneven."],
    safety: ["Never get under a car supported only by a jack."],
    sources: ["toyota-uk-2009-release", "generic-automotive"],
    sides: true,
    explode: { dir: [1, 0.35, 0], spread: 0.36 },
  },
  {
    id: "rear-suspension",
    name: { en: "Rear suspension (beam, springs & dampers)", no: "Hjuloppheng bak (aksel, fjærer og dempere)" },
    aliases: { en: ["torsion beam", "rear axle", "rear shock absorber", "rear spring"], no: ["bakaksel", "torsjonsaksel", "støtdemper bak", "fjær bak"] },
    system: "steering-suspension",
    function:
      "Many small front-wheel-drive cars use a torsion-beam rear axle: a cross-beam joining two trailing arms, with a spring and shock absorber at each side.",
    location: { text: "Under the rear of the car around the rear wheels. Positions are estimates.", status: "approximate" },
    presence: { status: "verified", note: "XP90 facelift: torsion-beam rear suspension (Toyota UK)." },
    related: ["rear-wheels", "rear-brakes", "fuel-tank"],
    symptoms: ["Knocking from the rear over bumps", "Rear bouncing", "Uneven rear tyre wear"],
    safety: ["Never get under a car supported only by a jack."],
    sources: ["toyota-uk-2009-release", "generic-automotive"],
  },

  /* ------------------------------------------------------------ WHEELS & TYRES */
  {
    id: "front-wheels",
    name: { en: "Front wheels & tyres", no: "Forhjul og dekk" },
    aliases: { en: ["tyre", "tire", "rim", "wheel bearing", "tyre pressure"], no: ["dekk", "felg", "hjul", "hjullager", "lufttrykk", "dekktrykk"] },
    system: "wheels",
    function:
      "Tyres are the only contact with the road. Registered size 185/60 R15 (load index 78, speed S). The front wheels steer and drive.",
    location: { text: "Front corners. Tyre diameter (~603 mm) is calculated from the registered size; track width is an estimate.", status: "approximate" },
    presence: { status: "owner", note: "Tyre size and 45 mm wheel offset are from the registration data. The registered 78/S is a minimum; one database lists 84H as the original fitment — read your sidewalls." },
    related: ["front-brakes", "front-suspension", "steering", "drive-shafts"],
    symptoms: ["Vibration through the steering at certain speeds", "Pulling to one side", "Humming that rises with speed (can be a wheel bearing)", "Uneven wear"],
    checks: [
      "Parked: look for cuts, bulges or exposed cords on the sidewalls.",
      "Check tread depth and pressures when cold. The recommended pressures are on a label on the car (often the driver's door pillar) or in the manual.",
    ],
    safety: ["A bulge or exposed cord means the tyre must be replaced before driving."],
    unknowns: ["Recommended tyre pressures for your car (record them from the placard)", "Rim type"],
    sources: ["owner-registration", "tyre-designation", "wheel-size-2011"],
    sides: true,
    explode: { dir: [1, 0.05, 0], spread: 0.95 },
  },
  {
    id: "rear-wheels",
    name: { en: "Rear wheels & tyres", no: "Bakhjul og dekk" },
    aliases: { en: ["rear tyre", "rear rim"], no: ["bakdekk", "bakhjul", "felg bak"] },
    system: "wheels",
    function: "Rear wheels and tyres, registered 185/60 R15 like the front. They do not steer or drive on a front-wheel-drive car.",
    location: { text: "Rear corners. Wheelbase and track are estimates.", status: "approximate" },
    presence: { status: "owner" },
    related: ["rear-brakes", "rear-suspension"],
    symptoms: ["Humming from the rear", "Uneven wear", "Slow puncture"],
    checks: ["Parked: inspect sidewalls and tread; compare pressures with the placard values when cold."],
    sources: ["owner-registration", "tyre-designation"],
    sides: true,
    explode: { dir: [1, 0.05, 0], spread: 0.95 },
  },

  /* ------------------------------------------------------------ EXHAUST */
  {
    id: "exhaust-manifold-cat",
    name: { en: "Exhaust manifold & catalytic converter", no: "Eksosmanifold og katalysator" },
    aliases: { en: ["catalyst", "cat", "exhaust manifold", "heat shield"], no: ["katalysator", "kat", "eksosmanifold", "varmeskjold"] },
    system: "exhaust",
    function:
      "The manifold collects exhaust gas from each cylinder; the catalytic converter chemically cleans it. A severe misfire can overheat and damage the catalyst.",
    location: {
      text: "Attached to the exhaust side of the engine, then down under the floor. Whether the exhaust side faces the front or rear of the car is NOT verified; the placeholder puts it at the rear.",
      status: "approximate",
    },
    presence: { status: "generic", note: "Required for a Euro 5 petrol car." },
    related: ["engine", "oxygen-sensors", "exhaust-silencer"],
    symptoms: ["Rattle from under the car (loose heat shield)", "Rotten-egg smell", "Engine warning lamp (catalyst efficiency codes)"],
    safety: ["Exhaust parts get extremely hot. Do not touch them after driving, and do not park over dry grass."],
    sources: ["owner-registration", "generic-automotive"],
  },
  {
    id: "oxygen-sensors",
    name: { en: "Oxygen (lambda) sensors", no: "Lambdasonder" },
    aliases: { en: ["lambda sensor", "O2 sensor", "air-fuel sensor"], no: ["lambdasonde", "oksygensensor", "O2-sensor"] },
    system: "exhaust",
    function:
      "Measure oxygen in the exhaust so the engine computer can trim the fuel mixture. A second sensor after the catalyst checks that the catalyst is working.",
    location: { text: "Screwed into the exhaust before and after the catalyst. Positions are estimates.", status: "approximate" },
    presence: { status: "generic" },
    related: ["exhaust-manifold-cat", "ecu"],
    symptoms: ["Engine warning lamp", "Higher fuel consumption", "Failed emissions test"],
    sources: ["generic-automotive"],
  },
  {
    id: "exhaust-silencer",
    name: { en: "Exhaust pipe & rear silencer", no: "Eksosrør og lyddemper" },
    aliases: { en: ["muffler", "silencer", "tailpipe", "exhaust hanger"], no: ["lyddemper", "eksospotte", "eksosrør", "endrør", "eksosoppheng"] },
    system: "exhaust",
    function: "Pipes carry exhaust gas to the back of the car; silencers reduce the noise. Rubber hangers hold the system to the floor.",
    location: { text: "Along the underside to the rear bumper. Routing and tailpipe side are estimates.", status: "approximate" },
    presence: { status: "generic" },
    related: ["exhaust-manifold-cat", "oxygen-sensors", "rear-suspension"],
    symptoms: ["Louder exhaust", "Rattle or knock over bumps", "Exhaust smell in the cabin"],
    safety: ["Exhaust smell inside the car: open windows, stop when safe and get it checked — exhaust gas contains carbon monoxide."],
    sources: ["generic-automotive"],
  },

  /* ------------------------------------------------------------ BODY */
  {
    id: "body-shell",
    name: { en: "Body shell (approximate)", no: "Karosseri (omtrentlig)" },
    aliases: { en: ["body", "exterior", "silhouette", "bonnet", "hood", "doors"], no: ["karosseri", "panser", "dører", "lakk", "sølv"] },
    system: "body",
    function:
      "A placeholder silhouette of a five-door hatchback, sized to the registered length (3790 mm) and width (1700 mm), with height (1530 mm) and wheelbase (2460 mm) from a secondary database for the XP90 facelift. It is there for orientation only.",
    location: { text: "Whole vehicle. Overhangs, track width and shape are estimates — this is NOT a digital twin.", status: "approximate" },
    presence: { status: "owner", note: "Silver, 5 seats (registration data). Body style assumed to be a 5-door hatchback — confirm the door count." },
    related: [],
    symptoms: [],
    unknowns: ["Model code on the vehicle label (confirms generation)", "3-door or 5-door"],
    sources: ["owner-registration", "adac-xp90-manual"],
    explode: { dir: [0, 1, 0], spread: 1.3 },
  },
];

export const COMPONENT_BY_ID: Record<string, ComponentRecord> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

export const COMPONENT_IDS: string[] = COMPONENTS.map((c) => c.id);
