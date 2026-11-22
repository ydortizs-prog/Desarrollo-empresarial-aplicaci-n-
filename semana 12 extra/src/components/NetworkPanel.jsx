import { useState } from "react";

// Controls of the simulated network, only for the lab (already written): they let you provoke the failures
// of steps 9 to 11 of the guide without touching any server.
export default function NetworkPanel({ network }) {
  const [down, setDown] = useState(network.down);
  const [slow, setSlow] = useState(network.delayMs >= 2500);

  return (
    <fieldset className="network-panel">
      <legend>Red simulada</legend>
      <label>
        <input
          type="checkbox"
          checked={down}
          onChange={(event) => {
            network.down = event.target.checked;
            setDown(event.target.checked);
          }}
        />
        Apagar el servidor
      </label>
      <label>
        <input
          type="checkbox"
          checked={slow}
          onChange={(event) => {
            network.delayMs = event.target.checked ? 3000 : 700;
            setSlow(event.target.checked);
          }}
        />
        Red lenta (3 s)
      </label>
      <button type="button" onClick={() => network.failNext(500)}>
        La próxima petición devuelve 500
      </button>
      <p className="hint">
        Origen de la página: <code>{network.origin}</code>. Si la política de CORS no lo autoriza, el navegador
        bloquea todo con «Network Error».
      </p>
    </fieldset>
  );
}
