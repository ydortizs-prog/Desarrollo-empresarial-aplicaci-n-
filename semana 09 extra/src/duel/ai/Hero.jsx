export default function Hero({ film }) {
  return (
    <section aria-label="Destacada" className="hero">
      <h2>{film.title}</h2>
      <a href={`#horarios-${film.id}`}>Ver horarios</a>
    </section>
  );
}
