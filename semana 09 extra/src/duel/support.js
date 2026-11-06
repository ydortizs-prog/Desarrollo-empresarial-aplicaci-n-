import { format } from "node:util";
import { vi } from "vitest";

// Which folder of components the tests run against is decided by the Vite mode
// (`vitest run --mode <name>` reads .env.<name>, which sets VITE_DUEL_SOURCE).
// The globs are lazy and may match nothing: that is how the student copy
// (no teacher/) and a fresh clone (no fixed/ yet) keep working.
const CANDIDATES = {
  team: import.meta.glob("./team/index.jsx"),
  ai: import.meta.glob("./ai/index.jsx"),
  fixed: import.meta.glob("./fixed/index.jsx"),
  solutions: import.meta.glob("../../teacher/solutions/index.jsx"),
};

const MISSING = {
  fixed: "No existe src/duel/fixed/. Primero copia las respuestas de la IA con: npm run fixed:init",
  solutions: "El modo solutions no está disponible en esta copia: las soluciones viven en teacher/, que solo tiene el docente.",
};

export const source = import.meta.env.VITE_DUEL_SOURCE || "team";

export async function loadSource() {
  const matches = Object.values(CANDIDATES[source] ?? {});
  if (matches.length === 0) {
    throw new Error(MISSING[source] ?? `Origen desconocido: «${source}». Usa team, ai, fixed o solutions.`);
  }
  return matches[0]();
}

// Spies on console.error so a test can read the warnings React prints in development
// (class instead of className, a missing key...). Call it in beforeEach.
export function watchConsole() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => spy.mock.calls.map((args) => format(...args).split("\n")[0]);
}

// A browser fires "error" on an <img> whose file cannot be loaded, and that runs its onerror
// handler. jsdom never downloads images, so the tests fire the event themselves.
export function failImages(container) {
  container.querySelectorAll("img").forEach((img) => img.dispatchEvent(new Event("error")));
}

// The page's own `window`. Inline handlers such as onerror="window.__xss=1" run inside the jsdom
// window, which vitest exposes as `jsdom.window` (the test's global `window` is a different object).
const pageWindow = () => globalThis.jsdom?.window ?? window;
export const xssFlag = () => pageWindow().__xss;
export const clearXssFlag = () => {
  delete pageWindow().__xss;
};
