// Copies the AI answers (src/duel/ai) to src/duel/fixed, the folder the team edits.
// Usage: npm run fixed:init        (refuses to overwrite)
//        npm run fixed:init -- --force
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "src", "duel", "ai");
const to = path.join(root, "src", "duel", "fixed");
const force = process.argv.includes("--force");

if (!fs.existsSync(from)) {
  console.error("No encuentro src/duel/ai: ejecuta el comando desde la raíz del proyecto.");
  process.exit(1);
}
if (fs.existsSync(to) && !force) {
  console.error("src/duel/fixed ya existe y tiene tus arreglos. Si quieres empezar de cero: npm run fixed:init -- --force");
  process.exit(1);
}
fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log("Copiadas las respuestas de la IA a src/duel/fixed/");
console.log("Ahora: npm run duel:fixed (rojo) → arregla los archivos de src/duel/fixed/ → repite hasta el verde.");
