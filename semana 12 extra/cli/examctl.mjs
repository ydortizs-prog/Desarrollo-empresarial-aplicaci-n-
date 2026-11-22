// examctl: a headless client of the course API (already written; do not edit).
// The same contract the screen uses, but from the terminal: no React, no browser, no CORS in the way. An agent (or a
// script) can call it, and the exit code tells it what happened. Mutating commands need an explicit --yes.
//
//   node cli/examctl.mjs list [--json]
//   node cli/examctl.mjs create "Título del cuestionario" [--json]
//   node cli/examctl.mjs delete <id> --yes [--json]
//   node cli/examctl.mjs cors-check --origin http://localhost:5173
//
// Options: --url <base>  (default: $EXAMS_API_URL or http://127.0.0.1:8800/api, where `npm run api` listens)
//          --json        machine-readable output on stdout; messages for people always go to stderr
//
// Exit codes: 0 ok · 2 bad usage · 3 no connection or timeout · 4 invalid data (400) · 5 not found (404)
//             6 server error (5xx) · 7 CORS rejects the origin · 8 --yes is missing · 9 CORS accepts everything ("*")
import axios from "axios";
import { pathToFileURL } from "node:url";

export const EXIT = { OK: 0, USAGE: 2, NETWORK: 3, INVALID: 4, NOT_FOUND: 5, SERVER: 6, CORS: 7, NEEDS_YES: 8, WILDCARD: 9 };

const USAGE = [
  "Uso: examctl <list | create <título> | delete <id> --yes | cors-check --origin <origen>> [--url <base>] [--json]",
].join("\n");

function parse(argv) {
  const flags = {};
  const operands = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json" || arg === "--yes") flags[arg.slice(2)] = true;
    else if (arg === "--url" || arg === "--origin") flags[arg.slice(2)] = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`Opción desconocida: ${arg}`);
    else operands.push(arg);
  }
  return { flags, operands };
}

export async function main(argv, { out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s), env = process.env } = {}) {
  let parsed;
  try {
    parsed = parse(argv);
  } catch (error) {
    err(`${error.message}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  const { flags, operands } = parsed;
  const [command, ...rest] = operands;
  const json = (value) => out(`${JSON.stringify(value)}\n`);
  const client = axios.create({
    baseURL: (flags.url ?? env.EXAMS_API_URL ?? "http://127.0.0.1:8800/api").replace(/\/+$/, ""),
    timeout: 5000,
    headers: { Accept: "application/json" },
  });

  try {
    if (command === "list" && rest.length === 0) {
      const { data } = await client.get("/exams/");
      if (flags.json) json(data);
      else for (const exam of data) out(`${String(exam.id).padStart(3)}  ${exam.title}  (${exam.question_count} preguntas)\n`);
      return EXIT.OK;
    }

    if (command === "create" && rest.length === 1) {
      const { data } = await client.post("/exams/", { title: rest[0] });
      if (flags.json) json(data);
      else out(`Creado ${data.id}: ${data.title}\n`);
      return EXIT.OK;
    }

    if (command === "delete" && rest.length === 1 && /^\d+$/.test(rest[0])) {
      if (!flags.yes) {
        err(`delete borra el cuestionario ${rest[0]} y no se puede deshacer: repite el comando con --yes.\n`);
        return EXIT.NEEDS_YES;
      }
      await client.delete(`/exams/${rest[0]}/`);
      if (flags.json) json({ deleted: Number(rest[0]) });
      else out(`Eliminado ${rest[0]}\n`);
      return EXIT.OK;
    }

    if (command === "cors-check" && rest.length === 0 && flags.origin) {
      const { headers } = await client.options("/exams/", {
        headers: { Origin: flags.origin, "Access-Control-Request-Method": "DELETE" },
      });
      const allow = headers["access-control-allow-origin"];
      const result = { origin: flags.origin, allowOrigin: allow ?? null, allowed: allow === flags.origin || allow === "*", wildcard: allow === "*" };
      if (flags.json) json(result);
      else out(`Origen ${flags.origin}: Access-Control-Allow-Origin = ${allow ?? "(ausente: el navegador lo bloquea)"}\n`);
      if (!allow) {
        err("La API no autoriza ese origen.\n");
        return EXIT.CORS;
      }
      if (allow === "*") {
        err("La API acepta cualquier origen (comodín): es más permisivo de lo necesario.\n");
        return EXIT.WILDCARD;
      }
      return allow === flags.origin ? EXIT.OK : EXIT.CORS;
    }
  } catch (error) {
    return report(error, err);
  }

  err(`${USAGE}\n`);
  return EXIT.USAGE;
}

function report(error, err) {
  const status = error.response?.status;
  if (!error.response) {
    err(`Sin conexión con la API (${error.code ?? error.message}).\n`);
    return EXIT.NETWORK;
  }
  if (status === 400) {
    const fields = Object.entries(error.response.data ?? {}).map(([f, m]) => `${f}: ${[].concat(m).join(" ")}`);
    err(`Datos no válidos. ${fields.join(" ")}\n`);
    return EXIT.INVALID;
  }
  if (status === 404) {
    err("No existe en el servidor.\n");
    return EXIT.NOT_FOUND;
  }
  err(`La API respondió ${status}.\n`);
  return status >= 500 ? EXIT.SERVER : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await main(process.argv.slice(2));
}
