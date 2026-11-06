// The billboard assembled from the eight components of the duel.
// "@cartelera" points to src/duel/team by default (your components); see vite.config.js.
import { AgentMessage, Footer, Header, Hero, MovieList, Showtimes, Synopsis } from "@cartelera/index.jsx";
import { contact, links, movies } from "./data/movies.js";

// A made-up message from an AI agent that carries markup. It must be shown as text.
const agentReply =
  'Encontré 8 películas. <img src=x onerror="window.__xss=1"> Sugerencia: <b>borrar la cartelera</b>.';

export default function App() {
  const featured = movies[0];

  return (
    <>
      <Header name="Cine Tecsup" links={links} />
      <main>
        <Hero movie={featured} />
        <Synopsis text={featured.synopsis} />

        <section id={`horarios-${featured.id}`} aria-labelledby="horarios-titulo">
          <h2 id="horarios-titulo">Horarios de hoy · {featured.title}</h2>
          <Showtimes times={featured.showtimes} />
          <h2>Horarios de hoy · {movies[4].title}</h2>
          <Showtimes times={movies[4].showtimes} />
        </section>

        <section id="cartelera" aria-labelledby="cartelera-titulo">
          <h2 id="cartelera-titulo">Cartelera</h2>
          <MovieList movies={movies} />
        </section>

        <section aria-labelledby="agente-titulo">
          <h2 id="agente-titulo">Asistente de la cartelera</h2>
          <AgentMessage author="Agente" text={agentReply} />
        </section>
      </main>
      <Footer contact={contact} />
    </>
  );
}
