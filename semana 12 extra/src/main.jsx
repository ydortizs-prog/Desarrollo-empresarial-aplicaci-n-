import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { api } from "@client/api";
import { corsPolicy } from "@client/cors";
import { createFakeNetwork } from "./lib/fakeNetwork";
import "./styles.css";

// Without VITE_API_URL the network is simulated: the requests never leave the browser, they are answered by
// src/lib/fakeApi.js after the CORS check of the policy in src/client/cors.js. With VITE_API_URL (file .env.local)
// the app talks to the real Django API and there is no simulated network.
let network = null;
if (!import.meta.env.VITE_API_URL) {
  network = createFakeNetwork({ origin: window.location.origin, policy: corsPolicy, delayMs: 700 });
  api.defaults.adapter = network.adapter;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App network={network} />
  </StrictMode>
);
