// A simulated network for Axios (already written). There is no server and no socket: it is an Axios *adapter*, the
// piece that really sends the request. Install it with `api.defaults.adapter = network.adapter` and every call of
// the API client (api.js) is answered by `handle` (fakeApi.js), after a CORS check like the browser's.
//
//   const network = createFakeNetwork({ origin: PROJECT_ORIGIN, policy: corsPolicy });
//   network.down = true;          // the server is off: Axios rejects with "Network Error" (ERR_NETWORK)
//   network.failNext(500);        // the next request answers 500
//   network.manual = true;        // the requests wait in network.requests until the test calls request.release()
//   network.delayMs = 800;        // every request takes 800 ms
//
// Each entry of `network.requests` is { method, path, body, signal, aborted, corsBlocked, released, release }.
import { AxiosError, CanceledError } from "axios";
import { checkCors } from "./cors";
import { createApiState, handle } from "./fakeApi";

export function createFakeNetwork({ origin, policy, exams, delayMs = 0, manual = false } = {}) {
  const state = createApiState(exams);
  const queue = []; // pending failures: a status code or "network"
  const network = {
    origin,
    policy,
    state,
    delayMs,
    manual,
    down: false,
    requests: [],
    failNext(kind) {
      queue.push(kind);
    },
    adapter,
  };

  function adapter(config) {
    return new Promise((resolve, reject) => {
      const url = new URL(joinUrl(config.baseURL, config.url));
      const request = {
        method: String(config.method ?? "get").toUpperCase(),
        url: url.href,
        path: url.pathname,
        body: parseBody(config.data),
        signal: config.signal,
        aborted: false,
        corsBlocked: false,
        released: false,
        release: () => {},
      };
      network.requests.push(request);

      if (config.signal?.aborted) {
        request.aborted = true;
        reject(new CanceledError(null, config, request));
        return;
      }

      // 1) The browser asks the API's CORS policy before it hands the response to the page.
      const cors = checkCors(network.origin, network.policy);
      request.corsBlocked = !cors.allowed;

      // 2) The "server" processes the request when it arrives (even if the page gives up waiting later).
      let outcome;
      if (network.down) {
        outcome = { network: true };
      } else {
        const failure = queue.shift();
        if (failure === "network") outcome = { network: true };
        else if (failure !== undefined) outcome = { status: failure, data: { detail: "Error interno del servidor." } };
        else outcome = handle(network.state, { method: request.method, path: apiPath(url.pathname), body: request.body });
      }

      // 3) The answer travels back: it waits for the delay or for the test to release it.
      const deliver = () => {
        request.released = true;
        if (request.aborted) return;
        if (request.corsBlocked || outcome.network) {
          reject(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, request));
          return;
        }
        const response = {
          data: outcome.data,
          status: outcome.status,
          statusText: String(outcome.status),
          headers: cors.headers,
          config,
          request,
        };
        const valid = config.validateStatus ? config.validateStatus(response.status) : response.status < 300;
        if (valid) {
          resolve(response);
          return;
        }
        const code = response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
        reject(new AxiosError(`Request failed with status code ${response.status}`, code, config, request, response));
      };

      let timer;
      if (network.manual) request.release = deliver;
      else timer = setTimeout(deliver, network.delayMs);

      config.signal?.addEventListener("abort", () => {
        request.aborted = true;
        clearTimeout(timer);
        reject(new CanceledError(null, config, request));
      });
    });
  }

  return network;
}

function joinUrl(baseURL, url) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${(baseURL ?? "").replace(/\/+$/, "")}/${String(url).replace(/^\/+/, "")}`;
}

// "/api/exams/3/" -> "/exams/3/": the API root is wherever the client's base URL ends.
function apiPath(pathname) {
  const at = pathname.indexOf("/exams");
  return at === -1 ? pathname : pathname.slice(at);
}

function parseBody(data) {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
