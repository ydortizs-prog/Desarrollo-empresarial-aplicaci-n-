import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

// Where the components live for each Vite mode (`--mode <name>`).
// The demo app imports "@cartelera", which points to one of these folders.
const SOURCES = {
  team: "src/duel/team",
  ai: "src/duel/ai",
  fixed: "src/duel/fixed",
  solutions: "teacher/solutions",
};

export default defineConfig(({ mode }) => {
  const wanted = path.join(root, SOURCES[mode] ?? SOURCES.team);
  // The alias is conditional on purpose: the student copy has no teacher/ and
  // no fixed/ until `npm run fixed:init`, and it must still build.
  const cartelera = fs.existsSync(wanted) ? wanted : path.join(root, SOURCES.team);

  return {
    plugins: [react()],
    resolve: { alias: { "@cartelera": cartelera } },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
    },
  };
});
