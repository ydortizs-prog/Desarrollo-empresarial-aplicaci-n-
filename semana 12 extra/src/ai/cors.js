// AI-written CORS policy, reviewed and fixed.
//
// Fix: it used the wildcard "*", which lets ANY site call the API. It now lists only the project's origin,
// with scheme + host + port and no trailing slash.
export const corsPolicy = {
  allowedOrigins: ["http://localhost:5173"],
  allowCredentials: false,
};
