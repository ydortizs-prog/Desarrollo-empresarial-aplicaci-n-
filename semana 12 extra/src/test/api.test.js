import axios from "axios";
import { api, createExam, deleteExam, describeError, listExams } from "@client/api";
import { installNetwork, release, settle } from "./helpers";

let network;
beforeEach(() => {
  network = installNetwork();
});

// A call that waits for the simulated network and answers.
async function answered(promise, index) {
  await settle();
  await release(network, index);
  return promise;
}

describe("api · el cliente está configurado en un solo sitio", () => {
  it("es una instancia de Axios con la dirección base de la API, sin barra final", () => {
    expect(api.defaults.baseURL).toMatch(/^https?:\/\/[^/]+(\/[a-z]+)*$/);
    expect(api.defaults.baseURL).toContain("/api");
  });

  it("tiene un tiempo de espera máximo", () => {
    expect(api.defaults.timeout).toBeGreaterThan(0);
  });

  it("todas las llamadas salen hacia la dirección base (cambiarla las mueve a todas)", async () => {
    const original = api.defaults.baseURL;
    api.defaults.baseURL = "http://api.prueba.test:9000/api";
    try {
      await answered(listExams());
      await answered(createExam("X"));
      await answered(deleteExam(1));
      expect(network.requests.map((r) => new URL(r.url).host)).toEqual(Array(3).fill("api.prueba.test:9000"));
    } finally {
      api.defaults.baseURL = original;
    }
  });
});

describe("api · listExams, createExam y deleteExam", () => {
  it("listExams hace GET /exams/ (con la barra final) y devuelve el arreglo, no la respuesta", async () => {
    const exams = await answered(listExams());
    expect(network.requests[0]).toMatchObject({ method: "GET" });
    expect(network.requests[0].path).toMatch(/\/exams\/$/);
    expect(Array.isArray(exams)).toBe(true);
    expect(exams).toHaveLength(6);
    expect(exams[0]).toMatchObject({ id: 1, title: expect.any(String) });
  });

  it("listExams entrega la señal a Axios: al abortar, la petición se cancela", async () => {
    const controller = new AbortController();
    const promise = listExams({ signal: controller.signal });
    await settle();
    controller.abort();
    await settle();
    expect(network.requests[0].aborted).toBe(true);
    await expect(promise).rejects.toSatisfy((error) => axios.isCancel(error));
  });

  it("createExam hace POST /exams/ con { title } y devuelve el cuestionario creado", async () => {
    const created = await answered(createExam("Examen final"));
    expect(network.requests[0]).toMatchObject({ method: "POST", body: { title: "Examen final" } });
    expect(network.requests[0].path).toMatch(/\/exams\/$/);
    expect(created).toMatchObject({ id: 7, title: "Examen final" });
  });

  it("deleteExam hace DELETE /exams/<id>/ y no devuelve nada", async () => {
    const result = await answered(deleteExam(3));
    expect(network.requests[0]).toMatchObject({ method: "DELETE" });
    expect(network.requests[0].path).toMatch(/\/exams\/3\/$/);
    expect(result).toBeUndefined();
    expect(network.state.exams.map((e) => e.id)).not.toContain(3);
  });

  it("un título vacío rechaza con el 400 de la API (el cliente no lo oculta)", async () => {
    const assertion = expect(createExam("   ")).rejects.toMatchObject({ response: { status: 400 } });
    await settle();
    await release(network);
    await assertion;
  });
});

describe("api · describeError", () => {
  async function failure(run, how) {
    if (how === "network") network.down = true;
    else if (how) network.failNext(how);
    const promise = run().catch((error) => error);
    await settle();
    await release(network);
    return promise;
  }

  it("sin conexión (o CORS): dice que no pudo conectar y menciona el servidor y CORS", async () => {
    const message = describeError(await failure(() => listExams(), "network"));
    expect(message).toMatch(/conectar/i);
    expect(message).toMatch(/servidor/i);
    expect(message).toMatch(/CORS/);
  });

  it("tiempo agotado: dice que tardó demasiado", () => {
    const error = Object.assign(new Error("timeout of 8000ms exceeded"), { code: "ECONNABORTED" });
    expect(describeError(error)).toMatch(/tard/i);
  });

  it("400: muestra el mensaje de la API para el campo", async () => {
    const message = describeError(await failure(() => createExam("")));
    expect(message).toMatch(/title/);
    expect(message).toMatch(/Este campo no puede estar en blanco/);
  });

  it("404: dice que el recurso ya no existe", async () => {
    expect(describeError(await failure(() => deleteExam(99)))).toMatch(/ya no existe/i);
  });

  it("500: incluye el número del estado", async () => {
    expect(describeError(await failure(() => listExams(), 500))).toMatch(/500/);
  });

  it("un error cualquiera da una frase, nunca una cadena vacía", () => {
    expect(describeError(new Error("algo raro")).length).toBeGreaterThan(10);
    expect(describeError(undefined).length).toBeGreaterThan(10);
  });
});
