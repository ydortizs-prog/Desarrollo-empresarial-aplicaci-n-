import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { links } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { Header } = await loadSource();

describe(`[${source}] T1 Header`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // This test goes first on purpose: React prints each kind of warning once per file.
  test("no produce avisos de React en la consola", () => {
    render(<Header name="Cine Tecsup" links={links} />);
    expect(warnings()).toEqual([]);
  });

  test("es el encabezado de la página (rol banner)", () => {
    render(<Header name="Cine Tecsup" links={links} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  test("el nombre del cine es un encabezado de nivel 1", () => {
    render(<Header name="Cine Tecsup" links={links} />);
    expect(screen.getByRole("heading", { level: 1, name: "Cine Tecsup" })).toBeInTheDocument();
  });

  test("la navegación se llama «Principal» y lista un enlace por opción", () => {
    render(<Header name="Cine Tecsup" links={links} />);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const items = within(within(nav).getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(links.length);
    links.forEach((link, i) => {
      const anchor = within(items[i]).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
    });
  });

  test("con otros datos muestra esos datos y no los del ejemplo", () => {
    render(
      <Header
        name="Cine Norte"
        links={[
          { href: "#a", label: "Alfa" },
          { href: "#b", label: "Beta" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Cine Norte" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["Alfa", "Beta"]);
  });
});
