import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import useExams from "@client/useExams";
import { installNetwork, release, releaseAll, settle } from "./helpers";

let network;
beforeEach(() => {
  network = installNetwork();
});

// Mounts the hook and answers the first request, so the test starts from a screen with data.
async function mountReady(options = {}) {
  const utils = renderHook(() => useExams(), options);
  await release(network);
  await waitFor(() => expect(utils.result.current.status).toBe("ready"));
  return utils;
}

describe("useExams · los tres estados de la petición", () => {
  it("empieza en loading, sin datos ni error, y pide GET /exams/ una vez", () => {
    const { result } = renderHook(() => useExams());
    expect(result.current).toMatchObject({ status: "loading", exams: [], error: null });
    expect(network.requests).toHaveLength(1);
    expect(network.requests[0]).toMatchObject({ method: "GET" });
  });

  it("cuando llegan los datos pasa a ready con los cuestionarios", async () => {
    const { result } = await mountReady();
    expect(result.current.exams).toHaveLength(6);
    expect(result.current.exams[0].title).toMatch(/Django/);
    expect(result.current.error).toBeNull();
  });

  it("si la API responde 500 pasa a error, con una frase que dice el estado, y sin datos", async () => {
    network.failNext(500);
    const { result } = renderHook(() => useExams());
    await release(network);
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/500/);
    expect(result.current.exams).toEqual([]);
  });

  it("si el servidor está apagado (o CORS bloquea) pasa a error y lo explica", async () => {
    network.down = true;
    const { result } = renderHook(() => useExams());
    await release(network);
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/conectar/i);
  });

  it("reload vuelve a loading, pide otra vez y muestra lo nuevo", async () => {
    const { result } = await mountReady();
    network.state.exams.pop();
    act(() => result.current.reload());
    expect(result.current.status).toBe("loading");
    expect(network.requests).toHaveLength(2);
    await release(network);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.exams).toHaveLength(5);
  });

  it("reload después de un error: error, loading y ready", async () => {
    network.failNext(500);
    const { result } = renderHook(() => useExams());
    await release(network);
    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => result.current.reload());
    expect(result.current.status).toBe("loading");
    expect(result.current.error).toBeNull();
    await release(network);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.exams).toHaveLength(6);
  });
});

describe("useExams · limpieza y carrera de peticiones", () => {
  it("al desmontar aborta la petición en vuelo", () => {
    const { unmount } = renderHook(() => useExams());
    expect(network.requests[0].aborted).toBe(false);
    unmount();
    expect(network.requests[0].aborted).toBe(true);
  });

  it("al pedir otra vez (reload) aborta la petición anterior", () => {
    const { result } = renderHook(() => useExams());
    act(() => result.current.reload());
    expect(network.requests[0].aborted).toBe(true);
    expect(network.requests[1].aborted).toBe(false);
  });

  it("si la primera respuesta llega DESPUÉS de la segunda, no pisa a la nueva", async () => {
    const { result } = renderHook(() => useExams());
    // the first request left with the six exams; the server changes and the second one will bring only two
    network.state.exams = network.state.exams.slice(0, 2);
    act(() => result.current.reload());
    await release(network, 1); // the fast answer arrives first; the slow one is still on its way
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const fresh = result.current.exams.map((exam) => exam.id);
    await release(network, 0); // the slow answer finally arrives
    expect(result.current.exams.map((exam) => exam.id)).toEqual(fresh);
    expect(result.current.status).toBe("ready");
  });

  it("si la respuesta llega después de desmontar, no pasa nada (ni avisos en la consola)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useExams());
    unmount();
    await release(network);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("con StrictMode (el efecto corre dos veces) solo queda viva una petición y la pantalla acaba bien", async () => {
    const { result } = renderHook(() => useExams(), { wrapper: StrictMode });
    expect(network.requests.length).toBeGreaterThanOrEqual(2);
    expect(network.requests.filter((request) => !request.aborted)).toHaveLength(1);
    await releaseAll(network);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.exams).toHaveLength(6);
  });
});

describe("useExams · borrar", () => {
  it("remove(id) hace DELETE y el cuestionario desaparece de la lista sin recargar", async () => {
    const { result } = await mountReady();
    let outcome;
    act(() => {
      outcome = result.current.remove(3);
    });
    expect(network.requests.at(-1)).toMatchObject({ method: "DELETE" });
    await release(network);
    await expect(outcome).resolves.toBe(true);
    await waitFor(() => expect(result.current.exams.map((e) => e.id)).not.toContain(3));
    expect(result.current.exams).toHaveLength(5);
  });

  it("si la API falla (500), la fila se queda, se explica el error y remove devuelve false", async () => {
    const { result } = await mountReady();
    network.failNext(500);
    let outcome;
    act(() => {
      outcome = result.current.remove(3);
    });
    await release(network);
    await expect(outcome).resolves.toBe(false);
    await waitFor(() => expect(result.current.actionError).toMatch(/500/));
    expect(result.current.exams.map((e) => e.id)).toContain(3);
    expect(result.current.status).toBe("ready");
  });
});

describe("useExams · crear", () => {
  it("create(title) hace POST y añade el cuestionario creado al final", async () => {
    const { result } = await mountReady();
    let outcome;
    act(() => {
      outcome = result.current.create("Examen final");
    });
    expect(network.requests.at(-1)).toMatchObject({ method: "POST", body: { title: "Examen final" } });
    await release(network);
    await expect(outcome).resolves.toBe(true);
    await waitFor(() => expect(result.current.exams.at(-1)).toMatchObject({ id: 7, title: "Examen final" }));
  });

  it("mientras el POST está en vuelo saving es true, y vuelve a false al terminar", async () => {
    const { result } = await mountReady();
    expect(result.current.saving).toBe(false);
    act(() => {
      result.current.create("Examen final");
    });
    expect(result.current.saving).toBe(true);
    await release(network);
    await waitFor(() => expect(result.current.saving).toBe(false));
  });

  it("dos create seguidos, con el primero en vuelo, envían un solo POST", async () => {
    const { result } = await mountReady();
    let second;
    act(() => {
      result.current.create("Examen final");
      second = result.current.create("Examen final");
    });
    expect(network.requests.filter((request) => request.method === "POST")).toHaveLength(1);
    await releaseAll(network);
    await expect(second).resolves.toBe(false);
    await waitFor(() => expect(result.current.exams.filter((e) => e.title === "Examen final")).toHaveLength(1));
  });

  it("un título vacío: la API responde 400, se muestra su mensaje y la lista no cambia", async () => {
    const { result } = await mountReady();
    let outcome;
    act(() => {
      outcome = result.current.create("");
    });
    await release(network);
    await expect(outcome).resolves.toBe(false);
    await waitFor(() => expect(result.current.actionError).toMatch(/Este campo no puede estar en blanco/));
    expect(result.current.exams).toHaveLength(6);
  });

  it("después de un error se puede volver a crear (saving no se queda atascado)", async () => {
    const { result } = await mountReady();
    act(() => {
      result.current.create("");
    });
    await release(network);
    await waitFor(() => expect(result.current.saving).toBe(false));
    act(() => {
      result.current.create("Bueno");
    });
    await release(network);
    await waitFor(() => expect(result.current.exams.at(-1)?.title).toBe("Bueno"));
    expect(result.current.actionError).toBeNull();
  });
});
