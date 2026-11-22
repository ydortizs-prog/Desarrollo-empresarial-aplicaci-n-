import ExamList from "./components/ExamList";
import NetworkPanel from "./components/NetworkPanel";

// `network` is the simulated network (see main.jsx). With a real API (VITE_API_URL) there is none and no panel.
export default function App({ network }) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Servicios web con React</h1>
        <p>La pantalla de cuestionarios consume la API del curso con Axios: lista, crea y elimina.</p>
      </header>
      {network && <NetworkPanel network={network} />}
      <ExamList />
    </div>
  );
}
