import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import MovieList from './components/MovieList.jsx'
import Footer from './components/Footer.jsx'
import { contact, links, movies } from './data/movies.js'

function App() {
  const featuredMovie = movies[0]

  return (
    <>
      <Header name="Cine Tecsup" links={links} />

      <main className="main">
        <Hero movie={featuredMovie} />

        <section className="section" id="cartelera" aria-labelledby="cartelera-title">
          <h2 className="section__title" id="cartelera-title">
            Cartelera
          </h2>
          <MovieList movies={movies} />
        </section>
      </main>

      <Footer contact={contact} />
    </>
  )
}

export default App
