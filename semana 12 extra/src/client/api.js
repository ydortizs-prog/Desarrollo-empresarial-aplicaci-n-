// PART 1 - the API client module: the ONLY place that knows the API's address and how its errors look.
// No component writes a URL by hand; they all call these functions.
// Run it with:  npm test -- api
import axios from "axios";

// The base address lives here and nowhere else. A .env.local file can point the app at the real Django API;
// without it, the simulated API of the lab is used. No trailing slash: the paths below start with one.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// A real Axios instance: tests and `npm run dev` replace its adapter, so it must not be a plain object.
export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { Accept: "application/json" },
});

/** GET /exams/ -> the array of exams (response.data, not the whole response). The signal cancels the request. */
export function listExams({ signal } = {}) {
  const request = api.get("/exams/", { signal }).then((response) => response.data);
  // A cancelled request rejects on purpose. This passive handler only keeps Node from reporting it as
  // "unhandled" before the caller attaches its own handler; the caller still receives the rejection.
  request.catch(() => {});
  return request;
}

/** POST /exams/ with { title } -> the exam the server created (response.data). */
export function createExam(title) {
  return api.post("/exams/", { title }).then((response) => response.data);
}

/** DELETE /exams/<id>/ -> resolves with undefined. The API's paths end with a slash. */
export function deleteExam(id) {
  return api.delete(`/exams/${id}/`).then(() => undefined);
}

/**
 * Turns anything the client can throw into ONE sentence in Spanish for the person.
 * A catch that only logs to the console leaves the screen mute; this function is what the
 * components show instead.
 */
export function describeError(error) {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "La API tardó demasiado en responder. Intenta de nuevo.";
  }

  if (!error?.response) {
    if (error?.code === "ERR_NETWORK") {
      return "No se pudo conectar con la API. Revisa que el servidor esté encendido y que el origen esté autorizado en CORS.";
    }
    return "Ocurrió un error inesperado al llamar a la API.";
  }

  const { status, data } = error.response;

  if (status === 400 && data && typeof data === "object") {
    const lines = Object.entries(data).map(
      ([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`
    );
    return `Datos no válidos. ${lines.join(" ")}`;
  }

  if (status === 404) return "El recurso ya no existe en el servidor.";
  if (status >= 500) return `La API falló (error ${status}). Intenta de nuevo en unos minutos.`;
  return `La API respondió con el estado ${status}.`;
}
