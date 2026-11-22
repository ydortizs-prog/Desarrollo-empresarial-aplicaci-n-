// @vitest-environment node
// The headless client does not depend on the team's code: these tests pass in every mode.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { startFakeApi } from "../../cli/fake-api.mjs";
import { EXIT, main } from "../../cli/examctl.mjs";

const run = promisify(execFile);
const ORIGIN = "http://localhost:5173";
let api;

beforeEach(async () => {
  api = await startFakeApi({ origins: [ORIGIN] });
});
afterEach(() => api.close());

async function examctl(...args) {
  let stdout = "";
  let stderr = "";
  const code = await main(args, { out: (s) => (stdout += s), err: (s) => (stderr += s), env: {} });
  return { code, stdout, stderr };
}

describe("examctl · lista, crea y elimina sin pantalla", () => {
  it("list --json imprime el arreglo de cuestionarios y sale con 0", async () => {
    const { code, stdout } = await examctl("list", "--json", "--url", api.url);
    expect(code).toBe(EXIT.OK);
    const exams = JSON.parse(stdout);
    expect(exams).toHaveLength(6);
    expect(exams[0]).toMatchObject({ id: 1, question_count: 6 });
  });

  it("list sin --json imprime una línea por cuestionario", async () => {
    const { code, stdout } = await examctl("list", "--url", api.url);
    expect(code).toBe(0);
    expect(stdout.trim().split("\n")).toHaveLength(6);
    expect(stdout).toContain("React · Hooks");
  });

  it("la dirección también puede venir de EXAMS_API_URL", async () => {
    let stdout = "";
    const code = await main(["list", "--json"], { out: (s) => (stdout += s), err: () => {}, env: { EXAMS_API_URL: api.url } });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toHaveLength(6);
  });

  it("create --json crea el cuestionario y lo devuelve", async () => {
    const { code, stdout } = await examctl("create", "Examen final", "--json", "--url", api.url);
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ id: 7, title: "Examen final" });
    expect(api.state.exams).toHaveLength(7);
  });

  it("create con un título vacío sale con 4 y dice lo que dijo la API", async () => {
    const { code, stderr } = await examctl("create", "", "--url", api.url);
    expect(code).toBe(EXIT.INVALID);
    expect(stderr).toMatch(/Este campo no puede estar en blanco/);
  });

  it("delete sin --yes no borra nada y sale con 8", async () => {
    const { code, stderr } = await examctl("delete", "1", "--url", api.url);
    expect(code).toBe(EXIT.NEEDS_YES);
    expect(stderr).toMatch(/--yes/);
    expect(api.state.exams.map((e) => e.id)).toContain(1);
  });

  it("delete 1 --yes lo borra; repetirlo sale con 5 (ya no existe)", async () => {
    expect((await examctl("delete", "1", "--yes", "--url", api.url)).code).toBe(0);
    expect(api.state.exams.map((e) => e.id)).not.toContain(1);
    expect((await examctl("delete", "1", "--yes", "--url", api.url)).code).toBe(EXIT.NOT_FOUND);
  });

  it("con el servidor apagado sale con 3, sin pantalla en blanco ni traza de pila", async () => {
    const { code, stderr } = await examctl("list", "--url", "http://127.0.0.1:1/api");
    expect(code).toBe(EXIT.NETWORK);
    expect(stderr).toMatch(/Sin conexión/);
    expect(stderr).not.toMatch(/\n\s+at /);
  });

  it("un comando desconocido o sin argumentos sale con 2 y muestra el uso", async () => {
    expect((await examctl("borrar-todo", "--url", api.url)).code).toBe(EXIT.USAGE);
    const none = await examctl();
    expect(none.code).toBe(EXIT.USAGE);
    expect(none.stderr).toMatch(/Uso:/);
    expect((await examctl("list", "--rapido")).code).toBe(EXIT.USAGE);
  });
});

describe("examctl · cors-check mira la política desde fuera", () => {
  it("el origen del proyecto está autorizado: sale con 0", async () => {
    const { code, stdout } = await examctl("cors-check", "--origin", ORIGIN, "--json", "--url", api.url);
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ allowed: true, wildcard: false, allowOrigin: ORIGIN });
  });

  it("un origen ajeno no recibe la cabecera: sale con 7", async () => {
    const { code, stdout } = await examctl("cors-check", "--origin", "https://sitio-malo.example", "--url", api.url);
    expect(code).toBe(EXIT.CORS);
    expect(stdout).toMatch(/ausente/);
  });

  it("una API con el comodín acepta cualquier origen: sale con 9", async () => {
    const open = await startFakeApi({ wildcard: true });
    try {
      const { code, stderr } = await examctl("cors-check", "--origin", "https://sitio-malo.example", "--url", open.url);
      expect(code).toBe(EXIT.WILDCARD);
      expect(stderr).toMatch(/comodín/);
    } finally {
      await open.close();
    }
  });
});

describe("examctl · como proceso", () => {
  it("node cli/examctl.mjs list --json imprime JSON en stdout y termina con código 0", async () => {
    const { stdout } = await run(process.execPath, ["cli/examctl.mjs", "list", "--json", "--url", api.url]);
    expect(JSON.parse(stdout)).toHaveLength(6);
  });

  it("y con el servidor apagado termina con código 3", async () => {
    await expect(run(process.execPath, ["cli/examctl.mjs", "list", "--url", "http://127.0.0.1:1/api"])).rejects.toMatchObject({ code: 3 });
  });
});
