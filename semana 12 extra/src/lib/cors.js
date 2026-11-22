// How a browser decides about CORS (already written; the team's policy lives in src/client/cors.js).
//
// The page runs at one ORIGIN (scheme + host + port, e.g. http://localhost:5173) and the API at another
// (http://localhost:8000). The browser only hands the response to the page if the API says, in the
// Access-Control-Allow-Origin header, that this origin is welcome. In Django that list is CORS_ALLOWED_ORIGINS
// (django-cors-headers). This function is that decision, so the tests and the headless client run without a browser.

/** The origin where `npm run dev` serves the React app. */
export const PROJECT_ORIGIN = "http://localhost:5173";

/**
 * @param {string} origin  the origin of the page that makes the request
 * @param {{ allowedOrigins: string[], allowCredentials?: boolean }} policy
 * @returns {{ allowed: boolean, reason: string, headers: Record<string, string> }}
 */
export function checkCors(origin, policy) {
  const { allowedOrigins = [], allowCredentials = false } = policy ?? {};
  if (allowedOrigins.includes("*")) {
    if (allowCredentials) {
      // The browsers refuse "*" together with credentials.
      return { allowed: false, reason: "wildcard-with-credentials", headers: {} };
    }
    return { allowed: true, reason: "wildcard", headers: { "access-control-allow-origin": "*" } };
  }
  if (allowedOrigins.includes(origin)) {
    const headers = { "access-control-allow-origin": origin, vary: "Origin" };
    if (allowCredentials) headers["access-control-allow-credentials"] = "true";
    return { allowed: true, reason: "listed", headers };
  }
  return { allowed: false, reason: "not-listed", headers: {} };
}
