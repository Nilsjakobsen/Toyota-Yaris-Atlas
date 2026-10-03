// Fails if a private identifier from config/vehicle.local.json appears in any file Git would
// commit, or in the production build (dist/). Prints file names only — never the values.
//   npm run check:privacy        (also runs automatically at the end of `npm run build`)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const localPath = join(root, "config", "vehicle.local.json");

if (!existsSync(localPath)) {
  console.log("privacy check: no config/vehicle.local.json — nothing private to look for.");
  process.exit(0);
}

let cfg;
try {
  cfg = JSON.parse(readFileSync(localPath, "utf8"));
} catch {
  console.error("privacy check: config/vehicle.local.json is not valid JSON.");
  process.exit(1);
}

const secrets = [];
for (const key of ["registration", "vin"]) {
  const v = typeof cfg[key] === "string" ? cfg[key].trim() : "";
  if (v.length >= 5 && !/^X+0*$/i.test(v)) secrets.push({ key, value: v.toUpperCase().replace(/[\s-]/g, "") });
}
if (!secrets.length) {
  console.log("privacy check: no identifiers configured.");
  process.exit(0);
}

// 1. Is the local file itself ignored by Git?
let ignored = true;
try {
  execFileSync("git", ["check-ignore", "-q", localPath], { cwd: root });
} catch {
  ignored = false;
}

// 2. Files Git would commit (tracked + untracked, excluding ignored).
let files = [];
try {
  files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
} catch {
  console.warn("privacy check: git not available; scanning src/, docs/, public/, config/ instead.");
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [relative(root, p)];
  });
  for (const d of ["src", "docs", "public", "config", "tools", "blender", "tests"]) if (existsSync(join(root, d))) files.push(...walk(join(root, d)));
  files = files.filter((f) => !f.endsWith("vehicle.local.json"));
}

// 3. The production build.
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [relative(root, p)];
});
if (existsSync(join(root, "dist"))) files.push(...walk(join(root, "dist")));

const normalise = (t) => t.toUpperCase().replace(/[\s-]/g, "");
const hits = [];
for (const f of new Set(files)) {
  const p = join(root, f);
  let buf;
  try {
    if (statSync(p).size > 20 * 1024 * 1024) continue;
    buf = readFileSync(p);
  } catch {
    continue;
  }
  const text = normalise(buf.toString("latin1"));
  for (const s of secrets) if (text.includes(s.value)) hits.push(`${f} (${s.key})`);
}

if (!ignored) console.error("privacy check: config/vehicle.local.json is NOT ignored by Git. Check .gitignore.");
if (hits.length) {
  console.error("privacy check FAILED — a private identifier appears in:");
  for (const h of hits) console.error("  " + h);
}
if (!ignored || hits.length) process.exit(1);
console.log(`privacy check passed: ${new Set(files).size} files scanned, ${secrets.length} identifiers, none found.`);
