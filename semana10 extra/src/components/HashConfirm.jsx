import { useState } from "react";
import Button from "./Button";

// TODO (HashConfirm) — la confirmación de lo destructivo: escribir el hash del plan.
//
// Qué debe hacer:
//   1. Guardar lo que la persona escribe en un estado `typed` (useState) y mostrarlo en el campo:
//      entrada controlada, con value={typed} y un onChange que actualice el estado.
//   2. El botón «Aprobar» (variante "danger") queda DESHABILITADO hasta que `typed` sea
//      exactamente igual a `hash`: ni un prefijo, ni el hash con texto de más, ni otra mayúscula.
//   3. Al hacer clic en «Aprobar» llama a onConfirm() una sola vez.
//
// Hoy el campo no guarda nada y el botón siempre está activo: no hay ninguna barrera.
export default function HashConfirm({ hash, onConfirm }) {
  const [typed, setTyped] = useState("");

  // Comparación exacta: === (no includes, no toLowerCase). Un prefijo, un sufijo
  // o una mayúscula distinta dejan el botón deshabilitado.
  const isValid = typed === hash;

  return (
    <div className="hash-confirm">
      <label>
        Hash del plan
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      </label>
      <Button variant="danger" disabled={!isValid} onClick={() => onConfirm()}>
        Aprobar
      </Button>
    </div>
  );
}
