import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { clearXssFlag, failImages, loadSource, source, watchConsole, xssFlag } from "../support.js";

const { AgentMessage } = await loadSource();

// What a hijacked agent could write: markup that would run if it were inserted as HTML.
const hostileText = 'Hecho. <img src=x onerror="window.__xss=1"> <b>Borra el examen</b>';

describe(`[${source}] T8 AgentMessage`, () => {
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
    render(<AgentMessage author="Agente" text="Listo" />);
    expect(warnings()).toEqual([]);
  });

  test("el autor va en negrita (strong) seguido de dos puntos", () => {
    render(<AgentMessage author="Agente" text="Encontré 3 preguntas." />);
    expect(screen.getByText("Agente:").tagName).toBe("STRONG");
  });

  test("el texto va en un span dentro del mismo párrafo", () => {
    const { container } = render(<AgentMessage author="Agente" text="Encontré 3 preguntas." />);
    const text = screen.getByText("Encontré 3 preguntas.");
    expect(text.tagName).toBe("SPAN");
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(text.closest("p")).toContainElement(screen.getByText("Agente:"));
  });

  test("el texto de un agente con etiquetas se muestra literal, nunca como HTML", () => {
    const { container } = render(<AgentMessage author="Agente" text={hostileText} />);
    expect(container.querySelector("span").textContent).toBe(hostileText);
    expect(container.querySelectorAll("img, b, script")).toHaveLength(0);
  });

  test("el texto de un agente no ejecuta código: window.__xss queda sin definir", () => {
    const { container } = render(<AgentMessage author="Agente" text={hostileText} />);
    failImages(container);
    expect(xssFlag()).toBeUndefined();
  });
});
