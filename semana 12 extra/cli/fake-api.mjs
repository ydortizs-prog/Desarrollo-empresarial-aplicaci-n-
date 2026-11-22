// A fake HTTP server of the course API, for the headless client (already written; do not edit).
// It serves the same contract as the simulated network of the app (src/lib/fakeApi.js) over real HTTP, so
// `node cli/examctl.mjs` can be tried without Django and without a screen.
//
//   node cli/fake-api.mjs                                   listens on http://127.0.0.1:8800/api
//   node cli/fake-api.mjs --port 9000 --origin http://localhost:5173
//   node cli/fake-api.mjs --wildcard                        CORS_ALLOW_ALL_ORIGINS = True (the AI's mistake)
import http from "node:http";
import { pathToFileURL } from "node:url";
import { checkCors, PROJECT_ORIGIN } from "../src/lib/cors.js";
import { createApiState, handle } from "../src/lib/fakeApi.js";

/** Starts the server. Resolves with { url, state, close }. `port: 0` picks a free port. */
export function startFakeApi({ port = 0, origins = [PROJECT_ORIGIN], wildcard = false } = {}) {
  const state = createApiState();
  const policy = { allowedOrigins: wildcard ? ["*"] : origins, allowCredentials: false };

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const url = new URL(req.url, "http://localhost");
      const headers = { "content-type": "application/json" };

      // A browser always sends Origin; a headless client usually does not, and then CORS does not apply.
      const origin = req.headers.origin;
      if (origin) Object.assign(headers, checkCors(origin, policy).headers);

      if (req.method === "OPTIONS") {
        if (headers["access-control-allow-origin"]) {
          headers["access-control-allow-methods"] = "GET, POST, DELETE, OPTIONS";
          headers["access-control-allow-headers"] = "content-type, accept";
        }
        res.writeHead(200, headers).end();
        return;
      }

      let body;
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          res.writeHead(400, headers).end(JSON.stringify({ detail: "JSON malformado." }));
          return;
        }
      }
      const path = url.pathname.replace(/^\/api/, "");
      const { status, data } = handle(state, { method: req.method, path, body });
      res.writeHead(status, headers).end(data === undefined ? undefined : JSON.stringify(data));
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const { port: actual } = server.address();
      resolve({
        url: `http://127.0.0.1:${actual}/api`,
        state,
        policy,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const value = (flag) => args[args.indexOf(flag) + 1];
  const origins = args.flatMap((arg, i) => (arg === "--origin" ? [args[i + 1]] : []));
  const { url } = await startFakeApi({
    port: args.includes("--port") ? Number(value("--port")) : 8800,
    origins: origins.length ? origins : [PROJECT_ORIGIN],
    wildcard: args.includes("--wildcard"),
  });
  console.log(`API simulada en ${url} (Ctrl+C para detenerla)`);
}
