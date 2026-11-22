import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { installNetwork, release } from "./helpers";

describe("App · la pantalla completa con la red simulada", () => {
  it("dibuja el título y, tras la carga, la lista de cuestionarios", async () => {
    const network = installNetwork();
    render(<App network={network} />);
    expect(screen.getByRole("heading", { name: "Servicios web con React" })).toBeInTheDocument();
    await release(network);
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("con el servidor apagado la pantalla muestra el error; al encenderlo y Reintentar, vuelven los datos", async () => {
    const network = installNetwork();
    network.down = true;
    render(<App network={network} />);
    await release(network);
    expect(await screen.findByRole("alert")).toHaveTextContent(/conectar/i);
    const panel = screen.getByLabelText("Apagar el servidor");
    expect(panel).toBeChecked();
    await userEvent.click(panel);
    expect(network.down).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await release(network);
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("sin red simulada (API real) no aparece el panel", () => {
    installNetwork();
    render(<App network={null} />);
    expect(screen.queryByLabelText("Apagar el servidor")).not.toBeInTheDocument();
  });
});
