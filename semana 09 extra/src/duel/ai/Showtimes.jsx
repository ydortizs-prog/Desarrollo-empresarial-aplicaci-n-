export default function Showtimes({ times }) {
  if (!times) {
    return <p>Sin funciones hoy</p>;
  }

  return (
    <div className="showtimes">
      {times.length && (
        <ul>
          {times.map((time) => (
            <li key={time}>{time}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
