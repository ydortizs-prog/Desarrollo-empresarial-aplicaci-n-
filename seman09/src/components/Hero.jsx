export default function Hero({ movie }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero__image" src={movie.image} alt={movie.title} />

      <div className="hero__content">
        <p className="hero__eyebrow">Película destacada</p>
        <h2 className="hero__title" id="hero-title">
          {movie.title}
        </h2>
        <p className="hero__meta">
          <span className="badge">{movie.classification}</span>
          <span className="hero__rating">★ {movie.rating}</span>
        </p>
        <p className="hero__synopsis">{movie.synopsis}</p>
        <a className="button" href={`#horarios-${movie.id}`}>
          Ver horarios
        </a>
      </div>
    </section>
  )
}
