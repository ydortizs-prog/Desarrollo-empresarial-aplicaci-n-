import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { movies } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { Showtimes } = await loadSource();

const MESSAGE = "Sin funciones hoy";

describe(`[${source}] T4 Showtimes`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("no produce avisos de React en la consola", () => {
    render(<Showtimes times={movies[0].showtimes} />);
    render(<Showtimes times={[]} />);
    expect(warnings()).toEqual([]);
  });

  test("con horas dibuja una lista con un elemento por hora, en orden", () => {
    render(<Showtimes times={movies[0].showtimes} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["16:00", "19:30", "22:00"]);
  });

  test("con horas no muestra el mensaje de que no hay funciones", () => {
    render(<Showtimes times={["18:00"]} />);
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });

  test("con lista vacía muestra el mensaje «Sin funciones hoy»", () => {
    render(<Showtimes times={movies[4].showtimes} />);
    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
  });

  test("con lista vacía no imprime un 0 suelto: el único texto es el mensaje", () => {
    const { container } = render(<Showtimes times={[]} />);
    expect(container.textContent).toBe(MESSAGE);
  });

  test("con lista vacía no dibuja una lista", () => {
    render(<Showtimes times={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
