import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { contact } from "../../data/movies.js";
import { loadSource, source, watchConsole } from "../support.js";

const { Footer } = await loadSource();

describe(`[${source}] T2 Footer`, () => {
  let warnings;
  beforeEach(() => {
    warnings = watchConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // First on purpose: React prints "Invalid DOM property" once per file.
  test("no produce avisos de React en la consola (usa className, no class)", () => {
    render(<Footer contact={contact} />);
    expect(warnings()).toEqual([]);
  });

  test("es el pie de la página (rol contentinfo)", () => {
    render(<Footer contact={contact} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  test("muestra la dirección", () => {
    render(<Footer contact={contact} />);
    expect(screen.getByText(contact.address)).toBeInTheDocument();
  });

  test("el teléfono es un enlace tel:", () => {
    render(<Footer contact={contact} />);
    expect(screen.getByRole("link", { name: contact.phone })).toHaveAttribute("href", `tel:${contact.phone}`);
  });

  test("el correo es un enlace mailto:", () => {
    render(<Footer contact={contact} />);
    expect(screen.getByRole("link", { name: contact.email })).toHaveAttribute("href", `mailto:${contact.email}`);
  });

  test("con otros datos de contacto muestra esos datos", () => {
    const other = { address: "Calle Uno 123", phone: "+5112345678", email: "otro@cine.example" };
    render(<Footer contact={other} />);
    expect(screen.getByText("Calle Uno 123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+5112345678" })).toHaveAttribute("href", "tel:+5112345678");
    expect(screen.getByRole("link", { name: "otro@cine.example" })).toHaveAttribute("href", "mailto:otro@cine.example");
  });
});
