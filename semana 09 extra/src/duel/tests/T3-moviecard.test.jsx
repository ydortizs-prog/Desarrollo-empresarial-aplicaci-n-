import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { movies } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { MovieCard } = await loadSource();

describe(`[${source}] T3 MovieCard`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("no produce avisos de React en la consola", () => {
    render(<MovieCard movie={movies[0]} />);
    expect(warnings()).toEqual([]);
  });

  test("es un artículo (rol article)", () => {
    render(<MovieCard movie={movies[0]} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  test("la imagen tiene como texto alternativo el título de la película", () => {
    for (const movie of movies) {
      const { unmount } = render(<MovieCard movie={movie} />);
      expect(screen.getByAltText(movie.title)).toBeInTheDocument();
      expect(screen.getByRole("img", { name: movie.title })).toHaveAttribute("src", movie.image);
      unmount();
    }
  });

  test("el título es un encabezado de nivel 3", () => {
    render(<MovieCard movie={movies[3]} />);
    expect(screen.getByRole("heading", { level: 3, name: movies[3].title })).toBeInTheDocument();
  });

  test("la valoración se muestra como texto con una estrella", () => {
    render(<MovieCard movie={movies[0]} />);
    expect(screen.getByText("★ 4.5")).toBeInTheDocument();
  });

  test("con otra película muestra los datos de esa película", () => {
    render(<MovieCard movie={movies[6]} />);
    expect(screen.getByText("★ 4.9")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Mi Vecino el Robot" })).toBeInTheDocument();
    expect(screen.queryByText(movies[0].title)).not.toBeInTheDocument();
  });
});
