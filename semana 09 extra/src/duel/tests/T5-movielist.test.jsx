import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { movies } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { MovieList } = await loadSource();

// The <li> that holds a movie's card, found through the card's title.
const itemOf = (movie) => screen.getByRole("heading", { level: 3, name: movie.title }).closest("li");

describe(`[${source}] T5 MovieList`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // First on purpose: React prints the missing-key warning once per file.
  test("no produce avisos de React en la consola (cada elemento lleva su key)", () => {
    render(<MovieList movies={movies} />);
    expect(warnings()).toEqual([]);
  });

  test("dibuja una lista con un elemento por película, en el mismo orden", () => {
    render(<MovieList movies={movies} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(movies.length);
    items.forEach((li, i) => {
      expect(within(li).getByRole("heading", { level: 3 })).toHaveTextContent(movies[i].title);
    });
  });

  test("cada elemento contiene una tarjeta (un article)", () => {
    render(<MovieList movies={movies} />);
    expect(screen.getAllByRole("article")).toHaveLength(movies.length);
    expect(itemOf(movies[2])).toContainElement(screen.getAllByRole("article")[2]);
  });

  test("al invertir el orden, cada película conserva su propio nodo del DOM", () => {
    const { rerender } = render(<MovieList movies={movies} />);
    const before = movies.map(itemOf);
    rerender(<MovieList movies={[...movies].reverse()} />);
    movies.forEach((movie, i) => {
      expect(itemOf(movie)).toBe(before[i]);
    });
  });

  test("al quitar la primera película, las demás conservan su nodo del DOM", () => {
    const { rerender } = render(<MovieList movies={movies} />);
    const before = movies.map(itemOf);
    rerender(<MovieList movies={movies.slice(1)} />);
    movies.slice(1).forEach((movie, i) => {
      expect(itemOf(movie)).toBe(before[i + 1]);
    });
    expect(screen.queryByRole("heading", { name: movies[0].title })).not.toBeInTheDocument();
  });
});
