import { movies, contact, links } from "./movies.js";

// Guards the data the whole duel depends on. These tests pass in every mode.
describe("Datos de la cartelera", () => {
  test("hay ocho películas con los campos que pide el laboratorio", () => {
    expect(movies).toHaveLength(8);
    for (const movie of movies) {
      expect(Object.keys(movie).sort()).toEqual(["id", "image", "rating", "showtimes", "synopsis", "title"]);
      expect(Array.isArray(movie.showtimes)).toBe(true);
    }
  });

  test("los id y los títulos no se repiten", () => {
    expect(new Set(movies.map((m) => m.id)).size).toBe(8);
    expect(new Set(movies.map((m) => m.title)).size).toBe(8);
  });

  test("exactamente una película no tiene funciones y exactamente una trae una sinopsis hostil", () => {
    expect(movies.filter((m) => m.showtimes.length === 0)).toHaveLength(1);
    expect(movies.filter((m) => m.synopsis.includes("onerror"))).toHaveLength(1);
  });

  test("los datos de contacto y la navegación están completos", () => {
    expect(Object.keys(contact).sort()).toEqual(["address", "email", "phone"]);
    expect(links.every((l) => l.href && l.label)).toBe(true);
  });
});
