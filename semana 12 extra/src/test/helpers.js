import { act } from "@testing-library/react";
import { api } from "@client/api";
import { PROJECT_ORIGIN } from "../lib/cors";
import { createFakeNetwork } from "../lib/fakeNetwork";

// A policy that lets the project through, so the tests of the client do not depend on the team's cors.js.
export const OPEN_POLICY = { allowedOrigins: [PROJECT_ORIGIN], allowCredentials: false };

/** Installs a simulated network on the client's Axios instance. By default the requests wait for the test. */
export function installNetwork(options = {}) {
  const network = createFakeNetwork({ origin: PROJECT_ORIGIN, policy: OPEN_POLICY, manual: true, ...options });
  api.defaults.adapter = network.adapter;
  return network;
}

/** Gives the simulated network and React one macrotask to deliver and render everything pending. */
export const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

/** Releases the request number `index` (or the last one) and waits for the screen to settle. */
export async function release(network, index = network.requests.length - 1) {
  network.requests[index].release();
  await settle();
}

/** Releases every pending request in order. */
export async function releaseAll(network) {
  for (const request of network.requests) if (!request.released) request.release();
  await settle();
}
