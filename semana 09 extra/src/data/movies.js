// Fixed sample data for the lab. The tests rely on these exact values, so do not edit them.
// - movie 5 has no showtimes today (the empty-list case).
// - movie 1 has a hostile synopsis: HTML written by a third party (the "untrusted data" case).
export const movies = [
  {
    id: 1,
    title: "La Última Función",
    image: "/posters/1.svg",
    synopsis: 'Gran estreno <img src=x onerror="window.__xss=1"> <b>no te lo pierdas</b>',
    rating: 4.5,
    showtimes: ["16:00", "19:30", "22:00"],
  },
  {
    id: 2,
    title: "Noche en el Altiplano",
    image: "/posters/2.svg",
    synopsis: "Una familia cruza el altiplano en una noche sin luna para llegar a tiempo a una boda.",
    rating: 4.2,
    showtimes: ["15:30", "18:00"],
  },
  {
    id: 3,
    title: "Código Fantasma",
    image: "/posters/3.svg",
    synopsis: "Un programador hereda un sistema que nadie se atreve a apagar.",
    rating: 3.8,
    showtimes: ["17:00", "20:15", "22:45"],
  },
  {
    id: 4,
    title: "El Jardín de Vidrio",
    image: "/posters/4.svg",
    synopsis: "Una botánica descubre que sus plantas guardan los recuerdos de quien las riega.",
    rating: 4.7,
    showtimes: ["14:00", "16:30"],
  },
  {
    id: 5,
    title: "Ruta 91",
    image: "/posters/5.svg",
    synopsis: "Dos hermanos recorren una carretera olvidada en busca de un camión perdido.",
    rating: 3.5,
    showtimes: [],
  },
  {
    id: 6,
    title: "Mares de Ceniza",
    image: "/posters/6.svg",
    synopsis: "Tras la erupción, un pueblo costero aprende a vivir bajo un cielo gris.",
    rating: 4.0,
    showtimes: ["19:00", "21:30"],
  },
  {
    id: 7,
    title: "Mi Vecino el Robot",
    image: "/posters/7.svg",
    synopsis: "Una niña y un robot jubilado se alían para salvar su edificio.",
    rating: 4.9,
    showtimes: ["13:00", "15:15", "17:30"],
  },
  {
    id: 8,
    title: "Medianoche en Lima",
    image: "/posters/8.svg",
    synopsis: "Una taxista recoge en una sola noche a cinco pasajeros que se conocen sin saberlo.",
    rating: 3.9,
    showtimes: ["20:00", "22:30"],
  },
];

export const contact = {
  address: "Av. Cascanueces 2221, Santa Anita, Lima",
  phone: "+51987654321",
  email: "hola@cinetecsup.example",
};

export const links = [
  { href: "#cartelera", label: "Cartelera" },
  { href: "#proximamente", label: "Próximamente" },
  { href: "#contacto", label: "Contacto" },
];
