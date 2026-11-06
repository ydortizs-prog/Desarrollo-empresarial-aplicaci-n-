export default function Showtimes({ times }) {
  if (times.length === 0) {
    return <p>Sin funciones hoy</p>;
  }

  return (
    <ul>
      {times.map((time) => (
        <li key={time}>{time}</li>
      ))}
    </ul>
  );
}
