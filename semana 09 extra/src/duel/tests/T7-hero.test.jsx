import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { movies } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { Hero } = await loadSource();

describe(`[${source}] T7 Hero`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("con una película correcta se dibuja sin lanzar ningún error", () => {
    expect(() => render(<Hero movie={movies[0]} />)).not.toThrow();
  });

  test("no produce avisos de React en la consola", () => {
    render(<Hero movie={movies[0]} />);
    expect(warnings()).toEqual([]);
  });

  test("es una región llamada «Destacada»", () => {
    render(<Hero movie={movies[0]} />);
    expect(screen.getByRole("region", { name: "Destacada" })).toBeInTheDocument();
  });

  test("el título de la película es un encabezado de nivel 2", () => {
    render(<Hero movie={movies[3]} />);
    expect(screen.getByRole("heading", { level: 2, name: movies[3].title })).toBeInTheDocument();
  });

  test("el enlace «Ver horarios» apunta a #horarios- seguido del id de la película", () => {
    const { rerender } = render(<Hero movie={movies[0]} />);
    expect(screen.getByRole("link", { name: "Ver horarios" })).toHaveAttribute("href", "#horarios-1");
    rerender(<Hero movie={movies[6]} />);
    expect(screen.getByRole("link", { name: "Ver horarios" })).toHaveAttribute("href", "#horarios-7");
  });
});
