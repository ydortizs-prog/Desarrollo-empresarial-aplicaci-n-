export default function MovieCard({ movie }) {
  return (
    <article className="movie-card" id={`horarios-${movie.id}`}>
      <img className="movie-card__image" src={movie.image} alt={movie.title} />

      <div className="movie-card__body">
        <h3 className="movie-card__title">{movie.title}</h3>

        <p className="movie-card__meta">
          <span className="badge">{movie.classification}</span>
          <span className="movie-card__rating">★ {movie.rating}</span>
        </p>

        <p className="movie-card__synopsis">{movie.synopsis}</p>

        <h4 className="movie-card__subtitle">Horarios</h4>

        {movie.showtimes.length === 0 ? (
          <p className="showtimes-empty">Sin funciones hoy</p>
        ) : (
          <ul className="showtimes">
            {movie.showtimes.map((time) => (
              <li key={time}>{time}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
