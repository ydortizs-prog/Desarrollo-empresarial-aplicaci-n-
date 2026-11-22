import { api, listExams } from "@client/api";
import { corsPolicy } from "@client/cors";
import { checkCors, PROJECT_ORIGIN } from "../lib/cors";
import { createFakeNetwork } from "../lib/fakeNetwork";
import { settle } from "./helpers";

describe("cors · la política de la API", () => {
  it("autoriza el origen del proyecto, http://localhost:5173", () => {
    expect(checkCors(PROJECT_ORIGIN, corsPolicy).allowed).toBe(true);
  });

  it("no usa el comodín: ninguna entrada es «*»", () => {
    expect(corsPolicy.allowedOrigins).not.toContain("*");
  });

  it("cada origen es esquema + host + puerto, sin barra final", () => {
    for (const origin of corsPolicy.allowedOrigins) expect(origin).toMatch(/^https?:\/\/[^/*]+$/);
  });

  it("un sitio ajeno queda fuera", () => {
    expect(checkCors("https://sitio-malo.example", corsPolicy).allowed).toBe(false);
  });

  it("otro puerto del mismo equipo también queda fuera (el origen incluye el puerto)", () => {
    expect(checkCors("http://localhost:3000", corsPolicy).allowed).toBe(false);
  });

  it("no mezcla credenciales con orígenes abiertos", () => {
    if (corsPolicy.allowCredentials) expect(corsPolicy.allowedOrigins).not.toContain("*");
  });
});

describe("cors · lo que ve la página (red simulada)", () => {
  async function callFrom(origin) {
    const network = createFakeNetwork({ origin, policy: corsPolicy });
    api.defaults.adapter = network.adapter;
    const promise = listExams().then(
      (data) => ({ data }),
      (error) => ({ error })
    );
    await settle();
    await settle();
    return { result: await promise, network };
  }

  it("desde el origen del proyecto la petición llega y devuelve los cuestionarios", async () => {
    const { result } = await callFrom(PROJECT_ORIGIN);
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(6);
  });

  it("desde un origen ajeno el navegador la bloquea: solo se ve «Network Error», sin respuesta", async () => {
    const { result, network } = await callFrom("https://sitio-malo.example");
    expect(network.requests[0].corsBlocked).toBe(true);
    expect(result.error?.code).toBe("ERR_NETWORK");
    expect(result.error?.response).toBeUndefined();
  });
});
