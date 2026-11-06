import { useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import { targetLabel, VERDICT_LABELS } from "../lib/plans";
import { readStoredDecisions, writeStoredDecisions } from "../lib/storage";

// TODO (Inbox) — completa la bandeja por partes. El JSX de abajo ya está escrito: no lo cambies,
// haz que los datos que usa sean de verdad. Ejecuta `npm test` después de cada parte.
//
// Qué recuerda esta pantalla (y SOLO esto se guarda en estado):
//   · decisions: un objeto { idDelPlan: "approved" | "rejected" }
//   · query: el texto de la búsqueda
// Todo lo demás (pendientes, decididos, contadores, filtrados) se CALCULA en cada dibujado.

export default function Inbox({ plans }) {
  // TODO 1 — Estado. Inicialización perezosa: pasamos la FUNCIÓN readStoredDecisions,
  // sin llamarla, para que localStorage se lea solo en el primer dibujado.
  const [decisions, setDecisions] = useState(readStoredDecisions);
  const [query, setQuery] = useState("");

  // TODO 2 — decide(id, verdict): objeto nuevo, nunca mutar el actual.
  // La forma funcional recibe el estado vigente y devuelve una copia con la decisión.
  function decide(id, verdict) {
    setDecisions((current) => ({ ...current, [id]: verdict }));
  }

  // TODO 3 — Derivados: se recalculan en cada dibujado, no viven en estado.
  const pending = plans.filter((plan) => !(plan.id in decisions));
  const decided = plans.filter((plan) => plan.id in decisions);

  const needle = query.trim().toLowerCase();
  const visible = pending.filter(
    (plan) =>
      plan.op.toLowerCase().includes(needle) || targetLabel(plan.target).toLowerCase().includes(needle)
  );

  // TODO 4 — clearSearch(): vacía la búsqueda.
  function clearSearch() {
    setQuery("");
  }

  // TODO 5 — Persistencia: cada vez que cambien las decisiones, se guardan.
  useEffect(() => {
    writeStoredDecisions(decisions);
  }, [decisions]);

  return (
    <section className="inbox" aria-labelledby="inbox-title">
      <h2 id="inbox-title">Planes del agente</h2>

      <p className="counters">
        <span>Pendientes: {pending.length}</span>
        <span>Decididos: {decided.length}</span>
      </p>

      <label className="search">
        Buscar plan
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <section aria-labelledby="pending-title">
        <h3 id="pending-title">Pendientes</h3>
        {visible.length > 0 ? (
          <div className="plan-list">
            {visible.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onDecide={decide} />
            ))}
          </div>
        ) : query.trim() !== "" ? (
          <div className="empty">
            <p>No hay planes que coincidan</p>
            <button type="button" onClick={clearSearch}>
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <p className="empty">No quedan planes pendientes.</p>
        )}
      </section>

      <section aria-labelledby="decided-title">
        <h3 id="decided-title">Decididos</h3>
        {decided.length > 0 ? (
          <ul className="decided-list">
            {decided.map((plan) => (
              <li key={plan.id} className={`decided decided-${decisions[plan.id]}`}>
                <strong>{VERDICT_LABELS[decisions[plan.id]]}</strong> · {plan.op} · {targetLabel(plan.target)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Aún no has decidido ningún plan.</p>
        )}
      </section>
    </section>
  );
}
