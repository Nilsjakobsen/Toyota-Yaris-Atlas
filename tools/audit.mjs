// End-to-end audit of the production build in a real browser (Edge or Chrome via Playwright).
//   npm run build && npm run audit
// Starts `vite preview` itself, drives the UI with real mouse/keyboard input, writes
// screenshots and results to test-output/, and exits non-zero if any check fails.
// Uses the system's Microsoft Edge by default; set ATLAS_BROWSER=chrome to use Chrome.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "test-output");
mkdirSync(out, { recursive: true });
if (!existsSync(join(root, "dist", "index.html"))) {
  console.error("dist/ is missing — run `npm run build` first.");
  process.exit(1);
}

const IDS = JSON.parse(readFileSync(join(root, "blender", "component-ids.json"), "utf8")).components.map((c) => c.id);
const NAMES = Object.fromEntries(JSON.parse(readFileSync(join(root, "blender", "component-ids.json"), "utf8")).components.map((c) => [c.id, c.name]));
const localCfgPath = join(root, "config", "vehicle.local.json");
const privateCfg = existsSync(localCfgPath) ? JSON.parse(readFileSync(localCfgPath, "utf8")) : null;

const PORT = 4179;
const server = await preview({ root, logLevel: "silent", preview: { port: PORT, host: "127.0.0.1", strictPort: true } });
const URL_ = `http://127.0.0.1:${PORT}/?debug=1`;

let browser;
for (const channel of [process.env.ATLAS_BROWSER, "msedge", "chrome"].filter(Boolean)) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    console.log(`browser: ${channel}`);
    break;
  } catch {
    /* try the next one */
  }
}
if (!browser) {
  console.error("Could not start Edge or Chrome. Install one, or set ATLAS_BROWSER.");
  await server.close();
  process.exit(1);
}

/* ------------------------------------------------------------------ harness */
const results = [];
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
async function check(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✔ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message, ms: Date.now() - t0 });
    console.log(`  ✘ ${name}\n      ${e.message}`);
  }
}

const IGNORED_CONSOLE = [/X4122/, /\(2[01]\d,/, /Download the React DevTools/];
async function openPage(context, opts = {}) {
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const loc = m.location()?.url ?? "";
    if (/models\/yaris-atlas\.glb|__local\/vehicle\.json|asset-manifest\.json/.test(loc) && /404|Failed to load/.test(m.text())) return; // optional files
    if (IGNORED_CONSOLE.some((r) => r.test(m.text()))) return;
    page.errors.push(`console: ${m.text()}`);
  });
  if (opts.routes) for (const [pattern, handler] of opts.routes) await page.route(pattern, handler);
  await page.goto(URL_, { waitUntil: "networkidle" });
  await ready(page);
  return page;
}
const ready = (page) => page.waitForFunction(() => window.__atlas?.viewer?.assetStatus, null, { timeout: 30000 });
const info = (page) => page.evaluate(() => window.__atlas.viewer.debugInfo());
const state = (page) =>
  page.evaluate(() => {
    const s = window.__atlas.store.get();
    return {
      selectedId: s.selectedId,
      hoveredId: s.hoveredId,
      explode: s.explode,
      bodyMode: s.bodyMode,
      visibleSystems: s.visibleSystems,
      panel: s.panel,
      log: s.log.map((e) => e.title),
      vehicleAnswers: s.vehicleAnswers,
      confirmations: s.confirmations,
      linkedIds: s.linkedIds,
      assetStatus: s.assetStatus,
    };
  });
const project = (page, id) => page.evaluate((i) => window.__atlas.viewer.projectComponent(i), id);
const pickAt = (page, p) => page.evaluate(({ x, y }) => window.__atlas.viewer.pickAt(x, y), p);
const act = (page, js) => page.evaluate(js);
const settle = (page, ms = 1300) => page.waitForTimeout(ms);
const shot = (page, name) => page.screenshot({ path: join(out, `${name}.png`) });
const maxDisplacement = (inf) => Math.max(0, ...inf.components.flatMap((c) => c.units.map((u) => Math.hypot(u.position[0] - u.home[0], u.position[1] - u.home[1], u.position[2] - u.home[2]))));
async function clickPart(page, id) {
  const p = await project(page, id);
  assert(p, `${id} is not on screen`);
  const hit = await pickAt(page, p);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(150);
  return { hit, p };
}

/* ------------------------------------------------------------------ main run */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await openPage(ctx);
console.log("\nCore");

await check("app loads and builds every component from its data record", async () => {
  const inf = await info(page);
  const built = inf.components.map((c) => c.id).sort();
  assert(JSON.stringify(built) === JSON.stringify([...IDS].sort()), `built components differ from records: ${built.length} vs ${IDS.length}`);
  assert(inf.components.every((c) => c.source === "placeholder"), "expected placeholders when no GLB is present");
  const s = await state(page);
  assert(s.assetStatus.results[0]?.status === "missing", `optional GLB status: ${s.assetStatus.results[0]?.status}`);
  await shot(page, "01-overview");
});

await check("every pickable mesh belongs to a component with a data record", async () => {
  const bad = await page.evaluate((ids) => {
    const known = new Set(ids);
    const found = [];
    window.__atlas.viewer["scene"].traverse((o) => {
      if (o.isMesh && !o.name.startsWith("__") && !o.userData.atlasHelper && !known.has(o.userData.atlasId)) found.push(o.name);
    });
    return found;
  }, IDS);
  assert(bad.length === 0, `meshes without a record: ${bad.slice(0, 5).join(", ")}`);
});

await check("clicking a part selects it and opens the inspector", async () => {
  await act(page, "window.__atlas.actions.preset('side', 'solid')");
  await settle(page);
  const { hit } = await clickPart(page, "front-wheels");
  const s = await state(page);
  assert(hit === "front-wheels", `ray hit ${hit}`);
  assert(s.selectedId === "front-wheels", `selected ${s.selectedId}`);
  const name = await page.textContent('[data-testid="inspector-name"]');
  assert(name === NAMES["front-wheels"], `inspector shows ${name}`);
  await act(page, "window.__atlas.store.set({ bodyMode: 'hidden' }); window.__atlas.actions.preset('engine-bay')");
  await settle(page);
  const r = await clickPart(page, "battery");
  const s2 = await state(page);
  assert(s2.selectedId === r.hit && r.hit === "battery", `clicked battery, ray hit ${r.hit}, selected ${s2.selectedId}`);
  await shot(page, "02-engine-bay-selected");
});

await check("hover highlights the part and shows its label", async () => {
  const p = await project(page, "radiator");
  const hit = await pickAt(page, p);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(400);
  const s = await state(page);
  assert(hit && s.hoveredId === hit, `hovered ${s.hoveredId}, ray ${hit}`);
  const label = await page.textContent(".atlas-label.is-hovered");
  assert(label === NAMES[hit], `hover label "${label}"`);
});

await check("clicking empty space deselects", async () => {
  const box = await page.locator('[data-testid="viewer"]').boundingBox();
  await page.mouse.click(box.x + box.width - 30, box.y + 30);
  await page.waitForTimeout(150);
  assert((await state(page)).selectedId === null, "still selected");
});

await check("search works in English and Norwegian", async () => {
  for (const [q, id] of [["lyddemper", "exhaust-silencer"], ["peilepinne", "oil-dipstick"], ["dynamo", "alternator"], ["kjolevifte", "cooling-fan"], ["brake fluid", "brake-master"], ["girkasse", "transmission"]]) {
    await page.fill('input[type="search"]', q);
    const first = await page.textContent(".result .result-name");
    assert(first === NAMES[id], `"${q}" → first result "${first}"`);
    await page.press('input[type="search"]', "Enter");
    await page.waitForTimeout(150);
    const s = await state(page);
    assert(s.selectedId === id, `"${q}" selected ${s.selectedId}`);
    assert(s.visibleSystems && s.bodyMode !== "solid", "search should make the part visible");
  }
  await page.fill('input[type="search"]', "");
});

await check("system toggles hide parts and stop them being picked", async () => {
  await act(page, "window.__atlas.actions.reset()");
  await act(page, "window.__atlas.actions.preset('front-corner', 'ghost')");
  await settle(page);
  const before = await info(page);
  await page.click('[data-system="brakes"]');
  await page.waitForTimeout(200);
  const inf = await info(page);
  for (const id of ["front-brakes", "rear-brakes", "brake-master", "abs-unit"]) assert(!inf.components.find((c) => c.id === id).visible, `${id} still visible`);
  assert(inf.pickable < before.pickable, "pick list did not shrink");
  const p = await project(page, "front-brakes");
  if (p) assert((await pickAt(page, p)) !== "front-brakes", "hidden brakes can still be picked");
  await page.click('[data-system="brakes"]');
  await page.waitForTimeout(200);
  assert((await info(page)).components.find((c) => c.id === "front-brakes").visible, "brakes did not come back");
  await page.hover('[data-system="cooling"]');
  await page.click('[data-system="cooling"] + .solo');
  const solo = (await state(page)).visibleSystems;
  assert(Object.entries(solo).every(([k, v]) => v === (k === "cooling")), `solo: ${JSON.stringify(solo)}`);
  await page.click("text=All");
  assert(Object.values((await state(page)).visibleSystems).every(Boolean), "All did not restore systems");
});

await check("explode moves parts smoothly and restore returns them exactly (no drift)", async () => {
  await act(page, "window.__atlas.actions.reset()");
  await settle(page);
  const slider = page.locator("#explode");
  for (let cycle = 0; cycle < 3; cycle++) {
    await slider.focus();
    await page.keyboard.press("End");
    await page.waitForTimeout(250);
    const mid = await info(page);
    assert(mid.explode.amount > 0 && mid.explode.amount < 1, `explode should animate, amount ${mid.explode.amount}`);
    await settle(page, 2200);
    const full = await info(page);
    assert(full.explode.amount === 1, `amount ${full.explode.amount}`);
    assert(maxDisplacement(full) > 0.5, `max displacement ${maxDisplacement(full)}`);
    const readout = await page.textContent(".readout");
    assert(/^\+\d+ cm$/.test(readout), `readout "${readout}"`);
    if (cycle === 0) await shot(page, "03-exploded");
    if (cycle === 1) await page.click("text=Assemble");
    else {
      await slider.focus();
      await page.keyboard.press("Home");
    }
    await settle(page, 2400);
    const back = await info(page);
    assert(back.explode.amount === 0, `amount after restore ${back.explode.amount}`);
    const d = maxDisplacement(back);
    assert(d === 0, `parts are ${d} m away from their assembled positions after restore`);
  }
  assert((await page.textContent(".readout")) === "0 cm", "readout not reset");
});

await check("reset restores the opening view", async () => {
  const box = await page.locator('[data-testid="viewer"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 60, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const moved = await info(page);
  await act(page, "window.__atlas.store.set({ bodyMode: 'hidden', explode: 0.6 }); window.__atlas.actions.toggleSystem('engine'); window.__atlas.actions.select('battery')");
  await page.click("text=Reset");
  await settle(page, 2600);
  const inf = await info(page);
  const s = await state(page);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  assert(dist(moved.camera.position, [4.6, 2.5, 5.6]) > 0.2, "the drag did not move the camera");
  assert(dist(inf.camera.position, [4.6, 2.5, 5.6]) < 0.01, `camera at ${inf.camera.position}`);
  assert(dist(inf.camera.target, [0, 0.62, 0.05]) < 0.01, `target at ${inf.camera.target}`);
  assert(inf.explode.amount === 0 && maxDisplacement(inf) === 0, "not assembled");
  assert(s.bodyMode === "solid" && s.selectedId === null && Object.values(s.visibleSystems).every(Boolean), "state not reset");
});

console.log("\nSymptoms");
await check("symptom flow: follow-up questions, evidence for/against, linked 3D parts", async () => {
  await page.click('[data-tab="symptoms"]');
  await page.click('[data-flow="no-crank"]');
  await page.click('[data-q="dash"][data-a="dim"]');
  await page.click('[data-q="sound"][data-a="rapid-click"]');
  const first = page.locator('[data-fit="fits"] [data-testid="possibility"]').first();
  assert((await first.getAttribute("data-id")) === "battery-low", "battery-low should be first among consistent possibilities");
  assert((await first.locator("li.sup").count()) === 2, "expected two supporting answers");
  assert((await page.locator('[data-fit="less"] [data-id="starter-circuit"]').count()) === 1, "starter circuit should be less consistent");
  const text = await page.textContent('[data-testid="flow"]');
  assert(!/\d+\s?%/.test(text), "a percentage appeared in the flow");
  await first.hover();
  await page.waitForTimeout(200);
  assert((await state(page)).linkedIds.includes("battery"), "hovering a possibility should highlight its parts");
  await first.locator(".part-chip", { hasText: NAMES.battery }).click();
  const s = await state(page);
  assert(s.selectedId === "battery" && s.panel === "symptoms", `chip click: selected ${s.selectedId}, panel ${s.panel}`);
  await shot(page, "04-symptom-flow");
});

await check("stop-driving guidance appears for dangerous answers", async () => {
  await page.click("text=← All symptoms");
  await page.click('[data-flow="overheating"]');
  assert((await page.locator('[data-testid="safety-stop"]').count()) === 1, "hot-coolant warning should always show");
  await page.click('[data-q="gauge"][data-a="red"]');
  assert((await page.locator('[data-testid="safety-stop"]').count()) === 2, "gauge in red should add a stop note");
  await page.click("text=← All symptoms");
  await page.click('[data-flow="braking"]');
  await page.click('[data-q="symptom"][data-a="sinks"]');
  assert(/do not drive/i.test(await page.textContent('[data-testid="safety-stop"]')), "sinking pedal should say do not drive");
});

await check("manual OBD code entry describes generic codes and refuses to over-interpret", async () => {
  await page.click("text=← All symptoms");
  await page.click('[data-flow="warning-light"]');
  await page.click('[data-q="lamp"][data-a="oil"]');
  assert((await page.locator('[data-testid="safety-stop"]').count()) >= 1, "oil lamp should show a stop note");
  for (const code of ["p0301", "P1349"]) {
    await page.fill('input[aria-label="Fault code"]', code);
    await page.click("text=Add code");
  }
  const items = await page.locator('[data-testid="code-item"]').allTextContents();
  assert(items[0].includes("Cylinder 1 misfire detected"), `P0301 → ${items[0]}`);
  assert(/manufacturer-specific/.test(items[1]), `P1349 → ${items[1]}`);
  await page.fill('input[aria-label="Fault code"]', "X1");
  await page.click("text=Add code");
  assert((await page.locator('[data-testid="code-item"]').count()) === 2, "invalid code should not be added");
  await page.click("text=Save to log");
  await page.waitForSelector('[data-testid="log-form"]');
  await page.click("text=Save entry");
  assert((await state(page)).log.some((t) => t === "Warning light on"), "investigation not saved to log");
});

console.log("\nPersistence");
await check("log entries, vehicle answers and confirmations survive a reload", async () => {
  await page.click('[data-tab="log"]');
  await page.click("text=New entry");
  await page.fill('[data-testid="log-form"] input[placeholder^="e.g. Checked"]', "Audit: checked oil level");
  await page.fill('[data-testid="log-form"] input[placeholder="e.g. 148200"]', "148200");
  await page.selectOption('[data-testid="log-form"] select >> nth=1', "oil-dipstick");
  await page.click("text=Save entry");
  const openBefore = parseInt(await page.textContent('[data-testid="open-questions"]'), 10);
  await page.click('[data-tab="vehicle"]');
  await page.click('[data-question="vsc"] .opt >> text=Yes');
  await act(page, "window.__atlas.actions.select('battery')");
  await page.click('[data-tab="inspect"]');
  await page.check("text=I have found this on my car");
  await page.reload({ waitUntil: "networkidle" });
  await ready(page);
  const s = await state(page);
  assert(s.log.includes("Audit: checked oil level"), `log after reload: ${s.log}`);
  assert(s.vehicleAnswers.vsc === "yes", "VSC answer lost");
  assert(s.confirmations.battery?.confirmed === true, "confirmation lost");
  const openAfter = parseInt(await page.textContent('[data-testid="open-questions"]'), 10);
  assert(openAfter === openBefore - 1, `open questions ${openBefore} → ${openAfter}`);
});

let exportedPath = join(out, "log-export.json");
await check("JSON export contains the log but no private identifiers; import restores it", async () => {
  await page.click('[data-tab="log"]');
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("text=Export JSON")]);
  await dl.saveAs(exportedPath);
  const raw = readFileSync(exportedPath, "utf8");
  const data = JSON.parse(raw);
  assert(data.app === "toyota-yaris-atlas" && data.entries.length >= 2, "export incomplete");
  assert(!/"vin"|"registration"/i.test(raw), "export has identifier keys");
  if (privateCfg) for (const k of ["vin", "registration"]) if (privateCfg[k]) assert(!raw.toUpperCase().includes(String(privateCfg[k]).toUpperCase()), `export contains the ${k}`);
  await act(page, "localStorage.clear()");
  await page.reload({ waitUntil: "networkidle" });
  await ready(page);
  assert((await state(page)).log.length === 0, "storage not cleared");
  await page.click('[data-tab="log"]');
  await page.setInputFiles('[data-testid="import-input"]', exportedPath);
  await page.waitForTimeout(400);
  const s = await state(page);
  assert(s.log.length === data.entries.length, `imported ${s.log.length} of ${data.entries.length}`);
  assert(s.vehicleAnswers.vsc === "yes", "answers not imported");
  await page.setInputFiles('[data-testid="import-input"]', exportedPath);
  await page.waitForTimeout(300);
  assert((await state(page)).log.length === data.entries.length, "re-import duplicated entries");
  await shot(page, "05-log");
});

await check("private identifiers are local-only and masked by default", async () => {
  await page.click('[data-tab="vehicle"]');
  if (!privateCfg?.vin) {
    assert(/Not configured/.test(await page.textContent('[data-testid="vehicle"]')), "should explain that identifiers are optional");
    return;
  }
  await page.waitForSelector('[data-testid="vin"]');
  const masked = await page.textContent('[data-testid="vin"]');
  assert(masked.includes("•") && masked !== privateCfg.vin, "VIN not masked");
  await page.click('[data-testid="vehicle"] >> text=Show');
  assert((await page.textContent('[data-testid="vin"]')) === privateCfg.vin, "Show did not reveal the VIN");
  await page.click('[data-testid="vehicle"] >> text=Hide');
  const html = await page.content();
  assert(!html.includes(privateCfg.vin), "VIN still in the DOM after Hide");
  await shot(page, "06-vehicle");
});

await check("no console or page errors during the run", async () => {
  assert(page.errors.length === 0, page.errors.slice(0, 5).join(" | "));
});
await page.close();

/* ------------------------------------------------------------------ assets */
console.log("\nAssets");
const glbRoute = (file) => [
  "**/models/yaris-atlas.glb",
  (route) => route.fulfill({ status: 200, contentType: "model/gltf-binary", body: readFileSync(file) }),
];

await check("a corrupt GLB falls back to placeholders without breaking anything", async () => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await openPage(c, { routes: [["**/models/yaris-atlas.glb", (r) => r.fulfill({ status: 200, contentType: "model/gltf-binary", body: "not a glb" })]] });
  const s = await state(p);
  assert(s.assetStatus.results[0].status === "error", `status ${s.assetStatus.results[0].status}`);
  assert(s.assetStatus.placeholders.length === IDS.length, "not all placeholders used");
  await p.evaluate("window.__atlas.actions.preset('side', 'solid')");
  await p.waitForTimeout(1300);
  const { hit } = await clickPart(p, "front-wheels");
  assert(hit === "front-wheels" && (await state(p)).selectedId === "front-wheels", "selection broken");
  assert(p.errors.length === 0, p.errors.join(" | "));
  await c.close();
});

await check("a missing asset manifest falls back to placeholders", async () => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await openPage(c, { routes: [["**/models/asset-manifest.json", (r) => r.fulfill({ status: 404, body: "" })]] });
  const s = await state(p);
  assert(s.assetStatus.manifest === "missing" && s.assetStatus.placeholders.length === IDS.length, JSON.stringify(s.assetStatus).slice(0, 200));
  await c.close();
});

const appGlb = join(out, "placeholders.glb");
await check("the app's placeholder GLB export loads back and maps every part", async () => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const p0 = await openPage(c);
  await p0.click('[data-tab="about"]');
  const [dl] = await Promise.all([p0.waitForEvent("download"), p0.click("text=Download placeholder GLB for Blender")]);
  await dl.saveAs(appGlb);
  await p0.close();
  await verifyGlb(c, appGlb, IDS.length);
  await c.close();
});

async function verifyGlb(c, file, expectFromGlb, expect = {}) {
  const p = await openPage(c, { routes: [glbRoute(file)] });
  const s = await state(p);
  const r = s.assetStatus.results[0];
  assert(r.status === "loaded", `status ${r.status}: ${r.message ?? ""}`);
  assert(Object.keys(s.assetStatus.fromGlb).length === expectFromGlb, `fromGlb ${Object.keys(s.assetStatus.fromGlb).length}, expected ${expectFromGlb}`);
  if (expect.unmapped) assert(expect.unmapped.every((u) => r.unmapped.some((x) => x.startsWith(u))), `unmapped ${JSON.stringify(r.unmapped)}`);
  else assert(r.unmapped.length === 0, `unmapped: ${r.unmapped.join(", ")}`);
  if (expect.empty) assert(JSON.stringify(r.empty) === JSON.stringify(expect.empty), `empty ${JSON.stringify(r.empty)}`);
  await p.evaluate("window.__atlas.actions.preset('side', 'solid')");
  await p.waitForTimeout(1300);
  const { hit } = await clickPart(p, "front-wheels");
  assert(hit === "front-wheels", `wheel click hit ${hit}`);
  await p.evaluate("window.__atlas.store.set({ explode: 1 })");
  await p.waitForTimeout(2200);
  assert(maxDisplacement(await info(p)) > 0.5, "GLB parts did not explode");
  await p.evaluate("window.__atlas.store.set({ explode: 0 })");
  await p.waitForTimeout(2400);
  assert(maxDisplacement(await info(p)) === 0, "GLB parts did not return exactly");
  assert(p.errors.length === 0, p.errors.join(" | "));
  await p.close();
}

const blenderGlb = join(out, "blender-roundtrip.glb");
const partialGlb = join(out, "blender-partial.glb");
// Optional: if Blender is installed, push the exported GLB through blender/yaris_atlas_tools.py.
const blenderExe = [process.env.BLENDER, "C:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe", "C:/Program Files/Blender Foundation/Blender/blender.exe", "/Applications/Blender.app/Contents/MacOS/Blender"].find(
  (p) => p && existsSync(p),
);
for (const f of [blenderGlb, partialGlb]) if (existsSync(f)) rmSync(f); // never test stale output
if (blenderExe && existsSync(appGlb)) {
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync(blenderExe, ["--background", "--factory-startup", "--python", join(root, "tools", "blender_selftest.py"), "--", appGlb, blenderGlb, partialGlb], {
      stdio: "pipe",
      timeout: 180000,
    });
    console.log("  · Blender found; round-trip and partial GLBs exported");
  } catch (e) {
    results.push({ name: "Blender self-test runs", ok: false, error: String(e.stderr || e.message).slice(-600) });
    console.log("  ✘ Blender self-test failed");
  }
}
if (existsSync(blenderGlb)) {
  await check("a GLB round-tripped through Blender keeps IDs, transforms, sides and explode", async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await verifyGlb(c, blenderGlb, IDS.length);
    await c.close();
  });
} else console.log("  – Blender round-trip GLB not found (run `node tools/blender-roundtrip.mjs`); skipped");
if (existsSync(partialGlb)) {
  await check("a partial GLB replaces only its parts; the rest stay placeholders", async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await verifyGlb(c, partialGlb, 2, { unmapped: ["Cube"], empty: ["radiator"] });
    await c.close();
  });
}

/* ------------------------------------------------------------------ layout */
console.log("\nLayout");
await check("usable at 1280×720 in dark mode, with no horizontal page scroll", async () => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: "dark" });
  const p = await openPage(c);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `page scrolls horizontally by ${overflow}px`);
  const dock = await p.locator(".dock").boundingBox();
  const stage = await p.locator(".stage").boundingBox();
  assert(dock.x >= stage.x && dock.x + dock.width <= stage.x + stage.width + 1, "dock overflows the viewer");
  await p.evaluate("window.__atlas.actions.preset('engine-bay', 'ghost'); window.__atlas.actions.select('alternator')");
  await p.waitForTimeout(1400);
  await p.screenshot({ path: join(out, "07-dark-1280.png") });
  await c.close();
});

await browser.close();
await server.close();

const failed = results.filter((r) => !r.ok);
writeFileSync(join(out, "audit-results.json"), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots in test-output/.`);
process.exit(failed.length ? 1 : 0);
