// The "server" of the lab (already written): the contract of the course API (week 8) as pure functions.
// There is no Django here. Both the simulated network (tests and `npm run dev`) and the headless client's fake
// HTTP server (cli/fake-api.mjs) call `handle`, so the browser and the terminal see the SAME API.
//
//   GET    /exams/        -> 200 [ { id, title, created_at, question_count } ]
//   POST   /exams/        -> 201 { ... }   |  400 { title: ["Este campo no puede estar en blanco."] }
//   DELETE /exams/<id>/   -> 204           |  404 { detail: "No encontrado." }
//
// As in Django REST Framework, the paths end with a slash: without it the server answers 404.

export function seedExams() {
  return [
    { id: 1, title: "Django · Modelos y migraciones", created_at: "2026-09-12T10:00:00Z", question_count: 6 },
    { id: 2, title: "Django · Plantillas", created_at: "2026-09-19T10:00:00Z", question_count: 4 },
    { id: 3, title: "Django · ORM y consultas", created_at: "2026-09-26T10:00:00Z", question_count: 8 },
    { id: 4, title: "API REST con DRF", created_at: "2026-10-03T10:00:00Z", question_count: 5 },
    { id: 5, title: "React · Componentes y eventos", created_at: "2026-10-24T10:00:00Z", question_count: 7 },
    { id: 6, title: "React · Hooks", created_at: "2026-10-31T10:00:00Z", question_count: 3 },
  ];
}

export function createApiState(exams = seedExams()) {
  const list = exams.map((exam) => ({ ...exam }));
  return { exams: list, nextId: Math.max(0, ...list.map((exam) => exam.id)) + 1 };
}

const EXAMS = /^\/exams\/(?:(\d+)\/)?$/;

/**
 * @param {{ exams: object[], nextId: number }} state  mutated by POST and DELETE
 * @param {{ method: string, path: string, body?: any }} request  `path` is relative to the API root
 * @returns {{ status: number, data?: any }}
 */
export function handle(state, { method, path, body }) {
  const match = EXAMS.exec(path);
  if (!match) return { status: 404, data: { detail: "No encontrado." } };
  const id = match[1] === undefined ? null : Number(match[1]);

  if (id === null && method === "GET") {
    return { status: 200, data: state.exams.map((exam) => ({ ...exam })) };
  }

  if (id === null && method === "POST") {
    const errors = validateTitle(body?.title);
    if (errors) return { status: 400, data: { title: errors } };
    const exam = {
      id: state.nextId++,
      title: body.title.trim(),
      created_at: new Date().toISOString(),
      question_count: 0,
    };
    state.exams.push(exam);
    return { status: 201, data: { ...exam } };
  }

  if (id !== null && method === "DELETE") {
    const index = state.exams.findIndex((exam) => exam.id === id);
    if (index === -1) return { status: 404, data: { detail: "No encontrado." } };
    state.exams.splice(index, 1);
    return { status: 204 };
  }

  return { status: 405, data: { detail: `Método "${method}" no permitido.` } };
}

function validateTitle(title) {
  if (title === undefined || title === null) return ["Este campo es requerido."];
  if (typeof title !== "string") return ["Not a valid string."];
  if (title.trim() === "") return ["Este campo no puede estar en blanco."];
  if (title.length > 200) return ["Asegúrese de que este campo no tenga más de 200 caracteres."];
  return null;
}
