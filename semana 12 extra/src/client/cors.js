// PART 2 - the CORS policy of the API.
// In the real project this is django-cors-headers: CORS_ALLOWED_ORIGINS in settings.py. Here it is the object that
// the simulated network (and the headless client's fake server) consult before answering a browser.
// Run it with:  npm test -- cors
//
// Only the origin of this project: scheme + host + port, no trailing slash, no wildcard, no other ports.
// http://localhost:5173 and http://localhost:3000 are different origins even on the same machine.
export const corsPolicy = {
  allowedOrigins: ["http://localhost:5173"],
  allowCredentials: false,
};
