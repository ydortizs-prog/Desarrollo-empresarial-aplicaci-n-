import { useState } from "react";
import useExams from "@client/useExams";

// The exams screen (already written). It draws the three states of the request and calls the hook for everything else.
export default function ExamList() {
  const { status, exams, error, actionError, saving, reload, remove, create } = useExams();
  const [title, setTitle] = useState("");

  async function handleSubmit(event) {
    event.preventDefault(); // the browser must not reload the page
    // The title goes to the API as it is, even if it is empty: the validation message comes from the server.
    const created = await create(title);
    if (created) setTitle("");
  }

  return (
    <section className="exams">
      <h2>Cuestionarios</h2>

      {status === "loading" && (
        <div role="status" className="skeleton">
          Cargando cuestionarios…
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="banner banner-error">
          <p>{error}</p>
          <button type="button" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ready" && exams.length === 0 && <p className="empty">Todavía no hay cuestionarios.</p>}

      {status === "ready" && exams.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Preguntas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>{exam.question_count}</td>
                <td>
                  <button type="button" aria-label={`Eliminar ${exam.title}`} onClick={() => remove(exam.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {actionError && (
        <p role="alert" className="banner banner-error">
          {actionError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="new-exam">
        <label htmlFor="exam-title">Título del cuestionario</label>
        <input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Agregar"}
        </button>
      </form>
    </section>
  );
}
