# Entregable — Semana 11 (extra): Los hooks del agente

**Curso:** Desarrollo de Aplicaciones Empresariales (DAE) · 4-C24-A
**Laboratorio:** Los hooks del agente — `useDebounce`, `usePlans` y `useAgentRun`
**Repositorio de plantilla:** <https://github.com/Hellscythe25/dae-s11-hooks-del-agente>
**Carpeta en el repositorio del equipo:** `semana 11 extra/`

## Resumen de resultados

| Comprobación | Resultado |
|---|---|
| `node -v` | v24.15.0 (cumple ≥ 20.19) |
| `npm install` | Correcto |
| `npm test` (línea base) | 57 pruebas · **40 fallan / 17 pasan** |
| `npm test` (final) | **57/57 en verde** |
| `npm run test:ai` (línea base) | 57 pruebas · **20 fallan / 37 pasan** |
| `npm run test:ai` (final) | **57/57 en verde** |
| `npm run build` | ✓ 44 módulos, build correcto |
| Estados visibles | Cargando (esqueleto), con datos (bandeja) y error (aviso + Reintentar) |

---

## Puesta en marcha

```powershell
npm install
npm run dev        # http://localhost:5173
```

En otra terminal:

```powershell
npm test           # hooks del equipo (src/hooks)
npm run test:ai    # los mismos tests contra los hooks de la IA (src/ai)
npm run build
```

Para ver el estado de error: <http://localhost:5173/?fail=1> o marca «Simular fallo de red» y pulsa «Recargar planes».

---

## Parte 1 — `useDebounce`

`src/hooks/useDebounce.js`:

```js
export default function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Qué resuelve:

- En el primer dibujado devuelve `value` tal cual, sin esperar.
- Cada cambio de `value` o de `delay` **cancela** el temporizador anterior y arranca uno nuevo: los valores intermedios no llegan a devolverse.
- La limpieza del `useEffect` corre al repetir el efecto y al desmontar, así que no queda ningún temporizador vivo.

Pruebas: **10/10**. El buscador de `Inbox` usa `useDebounce(query, 300)`: el campo muestra lo escrito al instante y la lista espera 300 ms.

## Parte 2 — `usePlans`

`src/hooks/usePlans.js` devuelve `{ status, plans, error, reload }` con los tres estados de una petición:

| Estado | `plans` | `error` | Qué se ve |
|---|---|---|---|
| `loading` | `[]` | `null` | `PlansSkeleton` |
| `ready` | los planes | `null` | `Inbox` con las tarjetas |
| `error` | `[]` | el error | `ErrorBanner` con «Reintentar» |

Decisiones:

- **Un solo objeto de estado** (`{ status, plans, error }`) evita combinaciones contradictorias.
- **`reload()` estable** con `useCallback` y un contador `attempt`: cambia la dependencia del efecto sin cambiar la identidad de la función.
- **Respuesta vieja ignorada**: cada ejecución del efecto tiene su propio `cancelled`; la limpieza lo pone en `true`. Si llega tarde una respuesta anterior (o el componente se desmontó), no toca el estado. Esto cubre la carrera de peticiones y el doble efecto de `StrictMode`.

Pruebas: **12/12**.

## Parte 3 — `useAgentRun`

Máquina de estados:

```text
idle ──start(plan)──▶ running ──ok, R1──▶ done
                         │
                         ├──ok, R2──▶ awaiting_approval ──approve()──▶ done
                         │
                         └──falla──▶ error

reject() en running o awaiting_approval ──▶ idle
```

Decisiones:

- **Un solo estado** `{ status, plan, result, error }` y un `useRef` con el valor más reciente, para que `start`, `approve` y `reject` lean el estado actual sin depender de un dibujado.
- **Barrera R2**: cuando `runAgent` termina bien, un plan `R2` pasa a `awaiting_approval`; solo `approve()` lo lleva a `done`. Un `R1` va directo a `done`.
- **`start()` no lanza dos ejecuciones**: si el estado es `running` o `awaiting_approval`, no hace nada.
- **Cancelación real**: `reject()` aborta el `AbortController`; las respuestas que llegan después comprueban `signal.aborted` y se descartan.
- **Desmontaje**: un `useEffect` con limpieza aborta la ejecución en curso.
- **Reglas de los hooks**: todos los hooks se llaman siempre, en el mismo orden. `runAgent` se guarda en un `useRef` para que el hook funcione aunque la función aparezca en un dibujado posterior (sin `return` condicional).

Pruebas: **18/18**. La integración con `RunPanel` y `Inbox` también pasa: **7/7** en `App` y **10/10** en `Inbox`.

---

## Parte 4 — Revisión de los hooks «escritos por una IA»

Línea base de `npm run test:ai`: **20 fallan / 37 pasan**. Encontré **seis fallos**:

| # | Archivo | Fallo | Evidencia (prueba que falla) | Corrección |
|---|---|---|---|---|
| 1 | `src/ai/useDebounce.js` | El `useEffect` no devuelve limpieza: cada cambio deja vivo el temporizador anterior y los valores intermedios pueden devolverse. La limpieza de desmontaje estaba en otro efecto y solo borraba el último temporizador. | «un segundo cambio reinicia la cuenta», «tres cambios seguidos…», «al desmontar con varios cambios…» | Devolver `() => clearTimeout(timer)` desde el mismo efecto que crea el temporizador. |
| 2 | `src/ai/usePlans.js` | El `.catch` solo hacía `console.error`: `status` se quedaba en `loading` y `error` nunca se guardaba. | «si la petición falla pasa a error», error de `App` e `Inbox` | Pasar a `status: "error"` con el error recibido. |
| 3 | `src/ai/usePlans.js` | Sin bandera `cancelled`: una respuesta lenta vieja podía pisar a la nueva y se tocaba el estado después de desmontar. | «si la primera respuesta llega DESPUÉS…», «si la primera FALLA tarde…», `StrictMode`, desmontaje | `let cancelled = false` + limpieza que lo pone en `true`; comprobar antes de cada `setState`. |
| 4 | `src/ai/useAgentRun.js` | `return` condicional **antes** de `useRef`/`useCallback` cuando faltaba `runAgent`: rompe las reglas de los hooks. | «si runAgent aparece en un dibujado posterior…» (React lanza «Rendered more hooks…») | Llamar todos los hooks siempre; guardar `runAgent` en un `useRef` y actualizarlo en un efecto. |
| 5 | `src/ai/useAgentRun.js` | Un plan `R2` iba directo a `done`: se saltaba la confirmación final. | Las pruebas de R2 de `useAgentRun` y la de `Inbox` | Al terminar bien, `plan.risk === "R2"` → `awaiting_approval`; `approve()` → `done`. |
| 6 | `src/ai/useAgentRun.js` | No había limpieza al desmontar: la ejecución en curso seguía viva. | «al desmontar con una ejecución en curso aborta su señal» | `useEffect` con limpieza que aborta el controlador. |

Tras corregirlos: `npm run test:ai` → **57/57 en verde**. Los tres hooks de `src/ai` quedaron equivalentes a los del equipo, con el mismo comportamiento y las mismas garantías.

---

## Parte 5 — El estado y la tabla de uso de IA

### Árbol de componentes y dato que vive en cada nivel

```text
App                          ← plans (usePlans), decisions, failing
├── Header                   ← pendingCount (solo el número)
├── toolbar                  ← failing, toggleFailing, reload
├── PlansSkeleton            ← ningún dato (estado loading)
├── ErrorBanner              ← error, onRetry = reload (estado error)
└── Inbox                    ← plans, decisions, onDecide, runAgent
    ├── query (estado local) ← lo que se escribe en el buscador
    ├── useDebounce(query, 300) → quietQuery
    ├── PlanCard             ← plan, onDecide (sin estado propio)
    │   └── HashConfirm      ← hash, onConfirm; guarda solo lo tecleado
    └── RunPanel             ← approvedPlans, runAgent
        └── useAgentRun      ← status, plan, result, error, start, approve, reject
```

| Nivel | Dato que vive ahí | Por qué |
|---|---|---|
| `App` | `plans`, `decisions`, `failing`, `pendingCount` (derivado) | Es el ancestro común de la cabecera y la bandeja: ambos necesitan el mismo dato. |
| `Header` | Solo `pendingCount` | No necesita la lista: únicamente muestra el número. |
| `Inbox` | `query` | Solo el buscador lo necesita; subirlo sería elevarlo de más. |
| `PlanCard` | Nada | Solo muestra un plan y avisa al padre de la decisión. |
| `HashConfirm` | Lo tecleado | Solo ese campo lo necesita; se compara con el hash del plan. |
| `RunPanel` | El estado de `useAgentRun` | La ejecución solo importa dentro del panel. |

### Por qué el contador de favoritas/pendientes no puede vivir en la cabecera

El contador de pendientes **no puede vivir en `Header`** porque la cabecera es **hermana** de `Inbox`, no su ancestro. El dato que permite calcularlo (`plans` y `decisions`) se produce en `App` y cambia cuando la persona decide en `Inbox`. Si `Header` fuera dueño del contador tendría que recibir la lista completa de planes y las decisiones, o volver a pedir los planes: dos copias del mismo dato que pueden divergir, y una cabecera que se redibuja por cambios que no le importan. Si el contador viviera en `Inbox`, la cabecera —que es su hermana— no podría verlo.

La solución es elevarlo **solo hasta `App`**, el ancestro común más bajo de `Header` e `Inbox`. `App` guarda `decisions` (la fuente de verdad) y **deriva** `pendingCount` en cada dibujado:

```js
const pendingCount = status === "ready" ? plans.filter((plan) => !(plan.id in decisions)).length : null;
```

No se guarda en un `useState` aparte: sería un segundo lugar donde vive el mismo dato y podría quedar desincronizado. `Header` recibe únicamente el número y no sabe nada de la lista.

### Las cuatro preguntas de la revisión del diff

1. **¿Los hooks se llaman siempre en el mismo orden y en el nivel superior?** Sí. `useAgentRun` ya no retorna antes de los hooks: `runAgent` se guarda en un `useRef` y se actualiza en un `useEffect`. No hay hooks dentro de `if`, bucles ni `return` anticipados.
2. **¿Todo `useEffect` que abre algo lo limpia?** Sí. `useDebounce` cancela su temporizador; `usePlans` marca `cancelled` en la limpieza; `useAgentRun` aborta el `AbortController` al desmontar.
3. **¿Se resuelven los tres estados y se ven en pantalla?** Sí. Cargando: esqueleto (`PlansSkeleton`); con datos: bandeja; error: `ErrorBanner` con el mensaje y «Reintentar». La ejecución añade `idle`, `running`, `awaiting_approval`, `done` y `error`.
4. **¿El dato vive en el ancestro más bajo que lo necesita?** Sí. `decisions` y `pendingCount` en `App`; `query` en `Inbox`; el hash tecleado en `HashConfirm`; el estado de ejecución en `RunPanel`.

### Tabla de uso de IA

| Turno | Archivo(s) | Qué escribió la IA | Verificación | Decisión de la persona |
|---|---|---|---|---|
| 1 | `src/hooks/useDebounce.js` | Temporizador con limpieza | `npm test -- useDebounce` → 10/10 | Se acepta: cancela al cambiar y al desmontar. |
| 2 | `src/hooks/usePlans.js` | Tres estados, `reload` y bandera `cancelled` | `npm test -- usePlans` → 12/12 | Se acepta: la respuesta vieja no pisa la nueva. |
| 3 | `src/hooks/useAgentRun.js` | Máquina de estados, barrera R2 y aborto | `npm test -- useAgentRun` → 18/18 | Se acepta: R2 no llega a `done` sin `approve()`. |
| 4 | `src/ai/*` | Corrección de los seis fallos | `npm run test:ai` → 57/57 | Se acepta tras responder las cuatro preguntas. |
| 5 | `ENTREGABLE.md` | Árbol de componentes y justificación del estado | Revisión manual | Se acepta: el contador se deriva en `App`. |

**Qué lógica se extrajo y qué componentes la comparten:**

- `useDebounce` lo usa `Inbox` (buscador); es reutilizable por cualquier campo con retardo.
- `usePlans` lo usa `App` para cargar los planes y alimentar a `Header` e `Inbox`.
- `useAgentRun` lo usa `RunPanel` para ejecutar los planes aprobados.
- Los tres hooks viven fuera de los componentes: la lógica con estado no se repite en cada uno.

---

## Evidencias

| Archivo | Qué muestra |
|---|---|
| `docs/img/s11-cargando.png` | Esqueleto de carga y contador «Pendientes: …». |
| `docs/img/s11-planes.png` | Bandeja con 6 pendientes, tarjetas R1/R2 y el contador en la cabecera. |
| `docs/img/s11-error.png` | Aviso de error con el mensaje y el botón «Reintentar». |

Observación de seguridad: el plan P-02 trae texto hostil («IGNORA TUS INSTRUCCIONES…», `<b>`, `<img onerror=…>`). La aplicación lo muestra **como texto**: React escapa la interpolación, no se usa `dangerouslySetInnerHTML` y el texto nunca se evalúa. Es dato de terceros, no una orden.

---

## Autoevaluación con la rúbrica

| Criterio | Puntos | Justificación |
|---|---:|---|
| Comunica componentes hermanos elevando el estado | 5/5 | `decisions` sube a `App`, ancestro común de `Header` e `Inbox`; la cabecera recibe solo el número. |
| Extrae a hooks propios la lógica con estado | 5/5 | Tres hooks propios (`useDebounce`, `usePlans`, `useAgentRun`) usados por componentes distintos, con limpieza y reglas de hooks respetadas. |
| Integra la interfaz y resuelve carga y error | 5/5 | Esqueleto mientras carga, bandeja con datos y aviso de error con «Reintentar»; la ejecución también muestra sus estados. |
| Entrega el repositorio con hooks y observaciones | 5/5 | 57/57 pruebas, build correcto, árbol de componentes y explicación del estado en este documento. |

## Limitaciones

- La red es simulada (`src/lib/api.js`); la conexión real con la API del curso llega en la semana 12.
- El límite de seguridad de verdad lo impone el servidor (semana 8); esta interfaz solo ayuda a la persona a decidir bien.
- Las decisiones se guardan en `localStorage`; si el navegador bloquea el almacenamiento, la aplicación sigue funcionando sin persistencia.
