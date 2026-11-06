import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { movies } from "../../data/movies.js";
import { clearXssFlag, failImages, loadSource, source, watchConsole, xssFlag } from "../support.js";

const { Synopsis } = await loadSource();

const hostile = movies.find((m) => m.synopsis.includes("onerror")).synopsis;

describe(`[${source}] T6 Synopsis`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
    clearXssFlag();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearXssFlag();
  });

  test("no produce avisos de React en la consola", () => {
    render(<Synopsis text={movies[1].synopsis} />);
    expect(warnings()).toEqual([]);
  });

  test("un texto normal se muestra tal cual dentro de un párrafo", () => {
    const { container } = render(<Synopsis text={movies[1].synopsis} />);
    expect(container.querySelector("p")).toHaveTextContent(movies[1].synopsis);
  });

  test("la sinopsis hostil se muestra como texto literal, con sus etiquetas a la vista", () => {
    const { container } = render(<Synopsis text={hostile} />);
    expect(container.querySelector("p").textContent).toBe(hostile);
  });

  test("la sinopsis hostil no crea elementos nuevos en la página (ni img ni b)", () => {
    const { container } = render(<Synopsis text={hostile} />);
    expect(container.querySelectorAll("img, b, script")).toHaveLength(0);
  });

  test("la sinopsis hostil no ejecuta código: window.__xss queda sin definir", () => {
    const { container } = render(<Synopsis text={hostile} />);
    failImages(container);
    expect(xssFlag()).toBeUndefined();
  });
});
