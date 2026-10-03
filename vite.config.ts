/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Private vehicle identifiers (registration, VIN) live in config/vehicle.local.json,
 * which is gitignored. This plugin serves that file at /__local/vehicle.json from the
 * local dev/preview server only. It is never imported by application code, so it can
 * never be bundled into dist/ — `npm run build` also runs tools/check-privacy.mjs to prove it.
 */
const LOCAL_CONFIG = fileURLToPath(new URL("./config/vehicle.local.json", import.meta.url));
const LOCAL_ROUTE = "/__local/vehicle.json";

function localVehicleConfig(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || req.url.split("?")[0] !== LOCAL_ROUTE) return next();
    // Only answer requests that arrive on the loopback interface.
    const remote = req.socket.remoteAddress ?? "";
    if (!/^(::1|127\.|::ffff:127\.)/.test(remote)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    try {
      const text = await readFile(LOCAL_CONFIG, "utf8");
      JSON.parse(text); // refuse to serve a malformed file
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(text);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  };
  return {
    name: "local-vehicle-config",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), localVehicleConfig()],
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
  build: { chunkSizeWarningLimit: 1200 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
