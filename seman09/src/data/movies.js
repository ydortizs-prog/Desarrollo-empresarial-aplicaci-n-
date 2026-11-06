// Datos fijos de la cartelera. Cada película tiene los campos que consumen
// los componentes: título, imagen, sinopsis, clasificación, valoración y horarios.
export const movies = [
  {
    id: 1,
    title: 'La Última Función',
    image: '/posters/1.svg',
    synopsis:
      'Una proyeccionista descubre que la última copia de una película guarda un mensaje que nadie debió ver.',
    classification: 'Apta para todo público',
    rating: 4.5,
    showtimes: ['16:00', '19:30', '22:00'],
  },
  {
    id: 2,
    title: 'Noche en el Altiplano',
    image: '/posters/2.svg',
    synopsis:
      'Una familia cruza el altiplano en una noche sin luna para llegar a tiempo a una boda.',
    classification: 'Apta para todo público',
    rating: 4.2,
    showtimes: ['15:30', '18:00'],
  },
  {
    id: 3,
    title: 'Código Fantasma',
    image: '/posters/3.svg',
    synopsis:
      'Un programador hereda un sistema que nadie se atreve a apagar y empieza a recibir mensajes de una versión suya.',
    classification: '+14',
    rating: 3.8,
    showtimes: ['17:00', '20:15', '22:45'],
  },
  {
    id: 4,
    title: 'El Jardín de Vidrio',
    image: '/posters/4.svg',
    synopsis:
      'Una botánica descubre que sus plantas guardan los recuerdos de quien las riega.',
    classification: 'Apta para todo público',
    rating: 4.7,
    showtimes: ['14:00', '16:30'],
  },
  {
    id: 5,
    title: 'Ruta 91',
    image: '/posters/5.svg',
    synopsis:
      'Dos hermanos recorren una carretera olvidada en busca de un camión perdido.',
    classification: '+16',
    rating: 3.5,
    showtimes: [],
  },
  {
    id: 6,
    title: 'Mares de Ceniza',
    image: '/posters/6.svg',
    synopsis:
      'Tras la erupción, un pueblo costero aprende a vivir bajo un cielo gris.',
    classification: '+14',
    rating: 4.0,
    showtimes: ['19:00', '21:30'],
  },
  {
    id: 7,
    title: 'Mi Vecino el Robot',
    image: '/posters/7.svg',
    synopsis:
      'Una niña y un robot jubilado se alían para salvar su edificio.',
    classification: 'Apta para todo público',
    rating: 4.9,
    showtimes: ['13:00', '15:15', '17:30'],
  },
  {
    id: 8,
    title: 'Medianoche en Lima',
    image: '/posters/8.svg',
    synopsis:
      'Una taxista recoge en una sola noche a cinco pasajeros que se conocen sin saberlo.',
    classification: '+16',
    rating: 3.9,
    showtimes: ['20:00', '22:30'],
  },
]

export const contact = {
  address: 'Av. Cascanueces 2221, Santa Anita, Lima',
  phone: '+51987654321',
  email: 'hola@cinetecsup.example',
}

export const links = [
  { href: '#cartelera', label: 'Cartelera' },
  { href: '#contacto', label: 'Contacto' },
]
