export default function Hero({ movie }) {
  return (
    <section aria-label="Destacada">
      <h2>{movie.title}</h2>
      <a href={`#horarios-${movie.id}`}>Ver horarios</a>
    </section>
  );
}
