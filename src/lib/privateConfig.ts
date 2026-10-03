/**
 * Private identifiers (registration, VIN) are read at runtime from the local dev server,
 * which serves config/vehicle.local.json at /__local/vehicle.json. Nothing here is bundled.
 * If the file is missing — or the app is served some other way — this returns null and the
 * app works without it.
 */
export interface PrivateConfig {
  registration?: string;
  vin?: string;
  nickname?: string;
}

const PLACEHOLDER = /^X+0*$/i;

export async function loadPrivateConfig(): Promise<PrivateConfig | null> {
  try {
    const res = await fetch("/__local/vehicle.json", { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("json")) return null;
    const raw: unknown = await res.json();
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() && !PLACEHOLDER.test(v.trim()) ? v.trim() : undefined);
    const cfg: PrivateConfig = { registration: str(r.registration), vin: str(r.vin), nickname: str(r.nickname) };
    return cfg.registration || cfg.vin || cfg.nickname ? cfg : null;
  } catch {
    return null;
  }
}

/** Show only enough to recognise the value: first 3 and last 4 characters of a VIN. */
export function maskVin(vin: string): string {
  if (vin.length <= 7) return "•".repeat(vin.length);
  return vin.slice(0, 3) + "•".repeat(vin.length - 7) + vin.slice(-4);
}

export function maskRegistration(reg: string): string {
  return reg.slice(0, 2) + "•".repeat(Math.max(0, reg.length - 2));
}

/** VIN checks that need no external lookup. */
export function vinShapeIssues(vin: string): string[] {
  const issues: string[] = [];
  if (vin.length !== 17) issues.push(`VIN has ${vin.length} characters (expected 17).`);
  if (/[IOQ]/i.test(vin)) issues.push("VIN contains I, O or Q, which are not used in VINs — check for a typo.");
  return issues;
}
