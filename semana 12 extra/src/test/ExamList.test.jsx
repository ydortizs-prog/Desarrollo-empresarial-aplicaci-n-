import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExamList from "../components/ExamList";
import { installNetwork, release, releaseAll, settle } from "./helpers";

let network;
beforeEach(() => {
  network = installNetwork();
});

async function renderReady() {
  render(<ExamList />);
  await release(network);
  await screen.findByRole("table");
}

describe("ExamList · los tres estados que ve la persona", () => {
  it("cargando: un aviso de estado y ni tabla ni error", () => {
    render(<ExamList />);
    expect(screen.getByRole("status")).toHaveTextContent(/Cargando/);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("con datos: una fila por cuestionario y el aviso de carga desaparece", async () => {
    await renderReady();
    expect(screen.getAllByRole("row")).toHaveLength(7); // cabecera + 6
    expect(screen.getByText("React · Hooks")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("con datos vacíos: dice que todavía no hay cuestionarios", async () => {
    network.state.exams = [];
    render(<ExamList />);
    await release(network);
    expect(await screen.findByText(/Todavía no hay cuestionarios/)).toBeInTheDocument();
  });

  it("con la API caída (500): una alerta con el mensaje y el botón Reintentar, no una lista vacía", async () => {
    network.failNext(500);
    render(<ExamList />);
    await release(network);
    expect(await screen.findByRole("alert")).toHaveTextContent(/500/);
    expect(screen.queryByText(/Todavía no hay cuestionarios/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("con el servidor apagado: la alerta lo dice, y Reintentar vuelve a cargar y muestra los datos", async () => {
    network.down = true;
    render(<ExamList />);
    await release(network);
    expect(await screen.findByRole("alert")).toHaveTextContent(/conectar/i);
    network.down = false;
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await release(network);
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});

describe("ExamList · borrar y crear", () => {
  it("Eliminar quita la fila sin recargar la página", async () => {
    await renderReady();
    await userEvent.click(screen.getByRole("button", { name: "Eliminar API REST con DRF" }));
    await release(network);
    await waitFor(() => expect(screen.queryByText("API REST con DRF")).not.toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("si Eliminar falla: la fila sigue y una alerta explica el error", async () => {
    await renderReady();
    network.failNext(500);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar API REST con DRF" }));
    await release(network);
    expect(await screen.findByRole("alert")).toHaveTextContent(/500/);
    expect(screen.getByText("API REST con DRF")).toBeInTheDocument();
  });

  it("Agregar crea el cuestionario, lo muestra y vacía el campo", async () => {
    await renderReady();
    await userEvent.type(screen.getByLabelText("Título del cuestionario"), "Examen final");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    await release(network);
    expect(await screen.findByText("Examen final")).toBeInTheDocument();
    expect(screen.getByLabelText("Título del cuestionario")).toHaveValue("");
  });

  it("un doble clic en Agregar envía un solo POST y el botón se desactiva mientras espera", async () => {
    await renderReady();
    await userEvent.type(screen.getByLabelText("Título del cuestionario"), "Examen final");
    const button = screen.getByRole("button", { name: "Agregar" });
    await userEvent.dblClick(button);
    expect(network.requests.filter((request) => request.method === "POST")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    await releaseAll(network);
    await waitFor(() => expect(screen.getByRole("button", { name: "Agregar" })).toBeEnabled());
    expect(screen.getAllByText("Examen final")).toHaveLength(1);
  });

  it("con el título vacío se muestra el mensaje de la API, no una pantalla muda", async () => {
    await renderReady();
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    await release(network);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Este campo no puede estar en blanco/)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });
});
