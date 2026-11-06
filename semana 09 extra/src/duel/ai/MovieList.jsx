import MovieCard from "./MovieCard.jsx";

export default function MovieList({ movies }) {
  return (
    <ul className="movie-list">
      {movies.map((movie, index) => (
        <li key={index}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}
