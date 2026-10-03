import type { SourceRecord } from "./types";

/**
 * Every source the app cites. Add a source here before referencing it from a component,
 * fact or flow — the data-integrity test fails on unknown source IDs.
 *
 * `appliesTo` must say which variant the source covers. A brochure for the XP130 is not
 * evidence about an XP90, and vice versa.
 */
export const SOURCES: SourceRecord[] = [
  {
    id: "owner-registration",
    title: "Norwegian vehicle registration data, as supplied by the owner",
    publisher: "Owner (transcribed from the Norwegian registry record)",
    kind: "owner",
    appliesTo: "This specific car",
    notes:
      "Includes dimensions, engine displacement and power, tyre sizes, emissions class, CO₂ and inspection dates. Private identifiers are kept in config/vehicle.local.json only.",
  },
  {
    id: "owner-observed",
    title: "Checked on the car by the owner",
    publisher: "Owner",
    kind: "owner",
    appliesTo: "This specific car",
    notes: "Things the owner has seen on the car itself. 3 October 2026: manual gearbox (clutch pedal).",
  },
  {
    id: "generic-automotive",
    title: "General automotive knowledge",
    publisher: "Not a vehicle-specific source",
    kind: "generic",
    appliesTo: "Most petrol, front-wheel-drive cars of this era — not checked for this car",
    notes:
      "Used for plain-language explanations of what a component does. Not evidence of how this particular car is built.",
  },
  {
    id: "tyre-designation",
    title: "Metric tyre size designation, load index and speed symbol tables",
    publisher: "ETRTO / ISO 4000-1 convention (generic standard)",
    kind: "standard",
    appliesTo: "Any tyre marked in the metric format (e.g. 185/60 R15 78S)",
    notes:
      "Load index 78 = 425 kg per tyre; speed symbol S = 180 km/h. Overall diameter is calculated from the size code.",
  },
  {
    id: "obd-generic-codes",
    title: "Generic OBD-II / EOBD diagnostic trouble code descriptions",
    publisher: "SAE J2012 / ISO 15031-6 (generic code meanings)",
    kind: "standard",
    appliesTo: "Generic P0xxx codes on any EOBD-compliant petrol car; manufacturer codes (P1xxx etc.) are not covered",
    notes:
      "A code describes a condition the engine computer detected. It does not by itself identify a failed part.",
  },
  /* ---- Variant research (accessed 2 October 2026). "Checked" = re-read directly while building. */
  {
    id: "toyota-uk-2009-release",
    title: "2009 Toyota Yaris: Less Is So Much More (press release, 5 Feb 2009)",
    publisher: "Toyota (GB) — media.toyota.co.uk",
    url: "https://media.toyota.co.uk/2009-toyota-yaris-less-is-so-much-more/",
    kind: "manufacturer",
    appliesTo: "Yaris XP90 facelift, UK market, 2009 launch specification",
    accessed: "2026-10-02",
    notes:
      "Checked: 1.33 = 1NR-FE, 1,329 cc; six-speed manual or six-speed MultiMode; Stop & Start on manual only; length 3,785 mm; 185/60R15 on 1.33 grades; MacPherson front with anti-roll bar, torsion-beam rear; 258 mm ventilated front discs, 203 mm rear drums. Launch power 100/101 hp and CO₂ 119 (120 for SR) — the later Euro 5 version differs.",
  },
  {
    id: "toyota-uk-2009-brochure",
    title: "Toyota Yaris brochure GBNGV-079YA-VB (July 2009)",
    publisher: "Toyota (GB), hosted on a third-party site",
    url: "https://xr793.com/wp-content/uploads/2022/12/2010-Toyota-Yaris-UK.pdf",
    kind: "manufacturer",
    appliesTo: "Yaris XP90 facelift, UK market, 2009–2010",
    accessed: "2026-10-02",
    notes:
      "Read during the research step (not re-checked): 1.33 '16 valve DOHC chain drive'; CO₂ 120 g/km manual / 119 MultiMode; ABS with EBD and Brake Assist standard; rear discs come with the optional VSC. The engine-code cell reads '2SZ-FE', which appears to be a brochure error.",
  },
  {
    id: "adac-xp90-manual",
    title: "Toyota Yaris 1.33 Life 5-door (10/10–10/11), ADAC Autokatalog",
    publisher: "ADAC (Germany) — secondary database",
    url: "https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/toyota/yaris/xp9-facelift/226031/",
    kind: "secondary",
    appliesTo: "Yaris XP90 facelift 1.33, 6-speed manual, German market, built 10/2010–10/2011",
    accessed: "2026-10-02",
    notes:
      "Checked: 73 kW (99 PS), 1329 cc, Euro 5, CO₂ 120 g/km, 6-speed manual with Start-Stopp as standard, length 3785 / width 1695 / height 1530 mm, wheelbase 2460 mm, 185/60R15, rear disc brakes, kerb weight 1115 kg (EU method).",
  },
  {
    id: "adac-xp90-multimode",
    title: "Toyota Yaris 1.33 MultiMode 5-door (XP90 facelift), ADAC Autokatalog",
    publisher: "ADAC (Germany) — secondary database",
    url: "https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/toyota/yaris/xp9-facelift/226032/",
    kind: "secondary",
    appliesTo: "Yaris XP90 facelift 1.33 MultiMode, German market",
    accessed: "2026-10-02",
    notes: "Read during the research step (not re-checked): MultiMode version listed at 119 g/km CO₂.",
  },
  {
    id: "toyota-uk-gen3-pack-2011",
    title: "New Yaris (third generation) launch pack, August 2011",
    publisher: "Toyota (GB) — media.toyota.co.uk",
    url: "https://media.toyota.co.uk/wp-content/uploads/sites/5/pdf/Yaris-Gen3-Launch-Pack-2011.pdf",
    kind: "manufacturer",
    appliesTo: "Yaris XP130, UK market, 2011 launch — used only for comparison",
    accessed: "2026-10-02",
    notes: "Read during the research step: XP130 is 3,885 mm long (100 mm longer than XP90) and came on 175/65R15 or 195/50R16 — not 185/60R15.",
  },
  {
    id: "toyota-fr-xp130-start",
    title: "La première Toyota Yaris de troisième génération est sortie de l'usine d'Onnaing (15 Jul 2011)",
    publisher: "Toyota France — media.toyota.fr",
    url: "https://media.toyota.fr/la-premire-toyota-yaris-de-troisime-gnration-est-sortie-de-lusine-donnaing/",
    kind: "manufacturer",
    appliesTo: "Yaris XP130 production start at the French plant (TMMF)",
    accessed: "2026-10-02",
    notes: "Read during the research step: first XP130 built 13 July 2011.",
  },
  {
    id: "tv2-broom-2011",
    title: "Test: Toyota Yaris — denne skal mange nordmenn kjøpe (30 Oct 2011)",
    publisher: "TV 2 Broom (Norway) — secondary",
    url: "https://www.tv2.no/broom/test-toyota-yaris-denne-skal-mange-nordmenn-kjope/13196184/",
    kind: "secondary",
    appliesTo: "Yaris XP130, Norwegian launch timing",
    accessed: "2026-10-02",
    notes: "Read during the research step: XP130 demonstrators were on their way to Norwegian dealers at the end of October 2011.",
  },
  {
    id: "wheel-size-2011",
    title: "Toyota Yaris 2011 wheel and tyre sizes",
    publisher: "wheel-size.com — secondary database",
    url: "https://www.wheel-size.com/size/toyota/yaris/2011/",
    kind: "secondary",
    appliesTo: "Yaris XP90 facelift (European market listings)",
    accessed: "2026-10-02",
    notes: "Read during the research step: 1.33 on 5.5Jx15 ET45 with 185/60R15 (listed as 84H); XP130 15-inch wheels listed at ET39.",
  },
  {
    id: "parts-catalogue-nsp90",
    title: "Toyota Europe parts catalogue listing for NSP90L / NSP130L",
    publisher: "Amayama (third-party catalogue) — secondary, seen in search snippets only",
    url: "https://www.amayama.com/en/genuine-catalogs/epc/toyota-europe/yaris/NSP90L",
    kind: "secondary",
    appliesTo: "Yaris NSP90 (1NR-FE, XP90) built 2008.11–2011.07; NSP130L from 2011.07",
    accessed: "2026-10-02",
    notes: "The page itself returned HTTP 403; model codes were taken from search-result snippets. Treat as a pointer, not proof.",
  },
  {
    id: "toyota-uk-vin-guide",
    title: "Toyota VIN: where to find your vehicle identification number",
    publisher: "Toyota (GB) magazine — mag.toyota.co.uk",
    url: "https://mag.toyota.co.uk/toyota-vin-vehicle-identification-number/",
    kind: "manufacturer",
    appliesTo: "Generic guidance for modern Toyotas — not Yaris-XP90 specific",
    accessed: "2026-10-02",
    notes: "Read during the research step: VIN visible at the base of the windscreen, stamped in the floor under a front seat, and on a label on the lower B-pillar.",
  },
  {
    id: "wmi-vnk",
    title: "World Manufacturer Identifier VNK",
    publisher: "dot.report (WMI listing derived from NHTSA data) — secondary",
    url: "https://dot.report/wmi/VNK",
    kind: "secondary",
    appliesTo: "Any VIN beginning VNK — shared by every car from that plant, so it identifies the factory, not the car",
    accessed: "2026-10-02",
    notes: "Lists VNK as Toyota Motor Manufacturing, France (Valenciennes/Onnaing). Only the first three VIN characters are decoded, and only locally.",
  },
  {
    id: "owners-manual",
    title: "Toyota Yaris owner's manual for your exact variant",
    publisher: "Toyota (not yet consulted for this app)",
    kind: "pending",
    appliesTo: "Must match your car's generation, engine and transmission",
    notes:
      "The best next source for warning-lamp meanings, fuse box locations, jacking points and fluid specifications. Add details here once you have a copy that matches your car.",
  },
];

export const SOURCE_BY_ID: Record<string, SourceRecord> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);
