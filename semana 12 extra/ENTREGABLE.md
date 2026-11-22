# Entregable — Semana 12 (extra): Servicios web con React

**Curso:** Desarrollo de Aplicaciones Empresariales (DAE) · 4-C24-A · 2026-2
**Laboratorio:** Servicios web con React — Axios, CORS y los tres estados
**Actividad:** DAE - Extra S12 - Servicios web con React: Axios, CORS y los tres estados
**Repositorio de plantilla:** <https://github.com/Hellscythe25/dae-s12-servicios-web-con-react> (commit original `534cca3`)
**Carpeta en el repositorio del equipo:** `semana 12 extra/`
**Alumno:** Yordi Ortiz (equipo DAE 4-C24-A)

## Resumen de resultados

| Comprobación | Resultado |
|---|---|
| `node -v` | v24.15.0 (cumple ≥ 20.19) |
| `npm install` | Correcto |
| `npm test` (línea base) | 67 pruebas · **46 fallan / 21 pasan** |
| `npm test` (final) | **67/67 en verde** |
| `npm run test:ai` (línea base) | 67 pruebas · **25 fallan / 42 pasan** |
| `npm run test:ai` (final) | **67/67 en verde** |
| `npm run build` | ✓ 95 módulos, build correcto |
| `examctl` | Códigos 0, 3, 4, 5, 7, 8 y 9 comprobados |

---

## 1. Puesta en marcha y línea base

```powershell
npm install
npm run dev        # http://localhost:5173
```

Al empezar, la pantalla se queda en **«Cargando cuestionarios…» para siempre**: `src/client/useExams.js` es un esqueleto que devuelve `status: "loading"` sin pedir nada. El resto de la aplicación ya está escrito.

`AGENTS.md` deja claro qué puede hacer un agente y qué no:

- **Puede** editar solo `src/client/` y `src/components/`, correr `npm test` y `npm run build`, usar `examctl` para leer y proponer un archivo por turno.
- **No puede** tocar `src/test/`, `src/lib/`, `cli/`, `package.json`, `vite.config.js` ni los `.env.*`; no instala paquetes; no sube al repositorio; **no decide qué origen autoriza CORS ni dónde se recarga la lista**; no borra ni crea datos con `examctl` sin una orden de una persona; no da nada por terminado con pruebas en rojo.

### Línea base de `npm test` (por archivo)

| Archivo | Pruebas | Fallan | Pasan |
|---|---:|---:|---:|
| `src/test/api.test.js` | 14 | 14 | 0 |
| `src/test/cors.test.js` | 8 | 3 | 5 |
| `src/test/useExams.test.jsx` | 18 | 18 | 0 |
| `src/test/ExamList.test.jsx` | 10 | 9 | 1 |
| `src/test/App.test.jsx` | 3 | 2 | 1 |
| `src/test/cli.test.js` | 14 | 0 | 14 |
| **Total** | **67** | **46** | **21** |

---

## 2. La red simulada (respuestas del paso 2)

| Archivo | Qué simula |
|---|---|
| `src/lib/fakeNetwork.js` | El **adaptador de Axios**: el trozo que de verdad envía la petición. No hay socket; cada llamada del cliente pasa por un `handle` y por una comprobación de CORS como la del navegador. Permite apagar el servidor, forzar un 500 o dejar las peticiones en cola para las pruebas. |
| `src/lib/fakeApi.js` | El **servidor**: el contrato de la API de la semana 8 (`GET /exams/`, `POST /exams/`, `DELETE /exams/<id>/`) como funciones puras. El navegador y el cliente de terminal usan el mismo `handle`. |
| `src/lib/cors.js` | La **decisión del navegador**: si el origen de la página está en `allowedOrigins`, devuelve la cabecera `Access-Control-Allow-Origin`; si no, no la devuelve y el navegador bloquea la respuesta. |

**¿Por qué las direcciones terminan en barra?** Las rutas de Django REST Framework se definen con barra final (`/exams/`). Sin ella, el servidor responde 404 (o redirige, y una redirección en un POST pierde el cuerpo). La dirección base **no** lleva barra y cada ruta **sí**: al unirlas queda exactamente una barra.

**¿Qué es un origen?** Esquema + host + puerto. `http://localhost:5173` y `http://localhost:8000` son **orígenes distintos** aunque sea la misma máquina, porque el **puerto** forma parte del origen. Para el navegador son dos sitios diferentes y la petición es cross-origin.

**¿Qué pasa con `allowedOrigins` vacía?** `checkCors` devuelve `not-listed`, no se envía `Access-Control-Allow-Origin` y el navegador bloquea **toda** petición. Axios lo ve como `ERR_NETWORK` («Network Error») **sin respuesta**: en la consola no aparece la palabra CORS, solo un fallo de red que parece un servidor apagado. Ese es justo el error que hay que aprender a distinguir.

---

## 3. Parte 1 — El módulo cliente (`src/client/api.js`)

```js
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { Accept: "application/json" },
});

export function listExams({ signal } = {}) {
  return api.get("/exams/", { signal }).then((response) => response.data);
}
export function createExam(title) {
  return api.post("/exams/", { title }).then((response) => response.data);
}
export function deleteExam(id) {
  return api.delete(`/exams/${id}/`).then(() => undefined);
}
```

- **La dirección vive en un solo sitio.** Cambiar `VITE_API_URL` (o `API_URL`) mueve **todas** las llamadas; ningún componente escribe una URL a mano. Eso evita erratas, barras de más y direcciones distintas en cada archivo.
- **`response.data`, no la respuesta entera.** El componente necesita el arreglo o el cuestionario; el resto de la respuesta (estado, cabeceras, `config`, `request`) es transporte de Axios. Devolver solo el dato deja a Axios dentro del módulo cliente.
- **La señal se entrega a Axios.** `listExams({ signal })` permite cancelar de verdad; sin ella, el `AbortController` del hook no tendría efecto.
- **`describeError` traduce cualquier fallo a una frase para la persona:** sin conexión (menciona servidor y CORS), tiempo agotado, 400 con el mensaje por campo, 404, 5xx con el número y una frase genérica para lo demás. Nunca devuelve una cadena vacía.

Pruebas: **14/14**.

---

## 4. Parte 2 — La política de CORS (`src/client/cors.js`)

```js
export const corsPolicy = {
  allowedOrigins: ["http://localhost:5173"],
  allowCredentials: false,
};
```

- Solo el origen del proyecto, con **esquema + host + puerto exactos**, sin barra final y **sin comodín**.
- **¿Por qué el navegador rechaza `"*"` junto con credenciales?** La especificación de CORS prohíbe `Access-Control-Allow-Origin: *` cuando la petición incluye credenciales (cookies, cabecera `Authorization`): el navegador no puede decir «cualquiera» y a la vez identificar a un usuario concreto, así que rechaza la respuesta. Además, el comodín autoriza a **cualquier** sitio de internet, no solo al nuestro.
- **¿Por qué otro puerto de localhost ya es otro origen?** Porque el origen incluye el puerto: `http://localhost:3000` ≠ `http://localhost:5173`. El navegador los trata como sitios distintos, aunque corran en la misma máquina.

Pruebas: **8/8**.

---

## 5. Parte 3 — El hook del listado (`src/client/useExams.js`)

Devuelve `{ status, exams, error, actionError, saving, reload, remove, create }`.

### Los tres estados

| Estado | `exams` | `error` | Qué se ve |
|---|---|---|---|
| `loading` | `[]` | `null` | «Cargando cuestionarios…» |
| `ready` | los cuestionarios | `null` | la tabla (o «Todavía no hay cuestionarios.») |
| `error` | `[]` | frase de `describeError` | alerta con el mensaje y «Reintentar» |

`reload()` cambia un contador `attempt` que es dependencia del efecto: la identidad de `reload` no cambia y el efecto se repite.

### Cancelación y carrera de peticiones

```js
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  setStatus("loading");
  listExams({ signal: controller.signal }).then(
    (data) => { if (cancelled) return; setExams(data); setStatus("ready"); },
    (failure) => { if (cancelled) return; setExams([]); setError(describeError(failure)); setStatus("error"); }
  );

  return () => { cancelled = true; controller.abort(); };
}, [attempt]);
```

Línea de tiempo con dos peticiones (A lenta, B rápida):

```text
t0  montaje                 → GET A (lenta)
t1  reload()                → GET B (rápida); la limpieza aborta A
t2  llega B                 → pantalla: datos nuevos
t3  llegaría A              → con limpieza: abortada/ignorada
                              sin limpieza: pisaría B y la pantalla mentiría
```

**¿Por qué la prueba de `StrictMode` corre el efecto dos veces y qué petición queda viva?** En desarrollo, React monta el componente, ejecuta el efecto, ejecuta su **limpieza** y vuelve a ejecutarlo, para descubrir efectos que no saben limpiarse. Quedan **dos** peticiones: la primera la aborta la limpieza; la segunda es la única viva. La prueba lo exige: `requests.length >= 2` y exactamente **una** sin abortar.

### Borrar y crear

- `remove(id)` hace `DELETE`; **cuando el servidor confirma**, filtra la fila de `exams` sin volver a pedir la lista. Si falla, la fila se queda y `actionError` explica el error; devuelve `true`/`false`.
- `create(title)` hace `POST`, añade el cuestionario creado y devuelve `true`/`false`. Mientras está en vuelo, `saving` es `true`.
- **La guarda del doble envío es un `useRef`, no un estado.** Un `setState` no se ve hasta el siguiente dibujado; el segundo clic de un doble clic ocurre **antes** de que React vuelva a dibujar, así que `saving` seguiría siendo `false`. El `ref` cambia en el acto y el segundo `create` sale con `false` sin lanzar otro `POST`.

**Decisión del equipo sobre dónde se actualiza la lista tras borrar:** se **filtra en local** después de que el servidor confirma (no antes, no con otra petición). Motivos: una sola ida y vuelta, la fila desaparece sin parpadeo, no se recarga la página y el servidor sigue siendo la autoridad (si responde 404/500, la fila permanece). Volver a pedir la lista costaría otra petición y abriría otra carrera; quitar la fila antes de la confirmación obligaría a reinsertarla si el borrado falla.

Pruebas: **18/18**.

---

## 6. La pantalla: estados y errores

| Momento | Petición | Qué ve la persona |
|---|---|---|
| Al entrar | `GET /exams/` | «Cargando cuestionarios…» (aviso de estado) |
| Respuesta 200 con datos | — | Tabla con una fila por cuestionario |
| Respuesta 200 con `[]` | — | «Todavía no hay cuestionarios.» |
| Respuesta 500 | — | Alerta «La API falló (error 500)…» + «Reintentar» |
| Servidor apagado | — | Alerta «No se pudo conectar con la API…» + «Reintentar» |
| CORS bloquea el origen | — | El navegador solo da «Network Error», sin respuesta |
| Borrar correcto | `DELETE /exams/<id>/` | La fila desaparece, sin recargar |
| Borrar con 500 | — | La fila sigue y una alerta explica el error |
| Crear correcto | `POST /exams/` | El cuestionario aparece al final y el campo se vacía |
| Crear con título vacío | `POST` → 400 | Alerta con el mensaje de la API; la lista no cambia |
| Doble clic en «Agregar» | un solo `POST` | El botón pasa a «Guardando…» y se desactiva |

### Capturas

| Archivo | Qué muestra |
|---|---|
| `docs/img/s12-cargando.png` | Estado de carga con «Cargando cuestionarios…». |
| `docs/img/s12-datos.png` | Estado con datos: tabla de 6 cuestionarios. |
| `docs/img/s12-error-500.png` | Error 500 de la lista, con «Reintentar». |
| `docs/img/s12-error-red.png` | Servidor apagado: aviso de conexión. |
| `docs/img/s12-error-cors.png` | CORS bloqueando el origen: mismo «Network Error». |
| `docs/img/s12-error-validacion.png` | 400 por título vacío: mensaje de la API y lista intacta. |

> Observación del paso 8: cuando CORS bloquea, el navegador **no** entrega respuesta y el texto visible no dice «CORS» por ninguna parte; solo se ve un fallo de red. Nuestro `describeError` sí menciona CORS porque es la causa más probable en local, pero la distinción real se hace con `examctl cors-check` (códigos 7 y 9).

---

## 7. Resumen de pruebas

```text
npm test        → 6 archivos, 67/67 pruebas en verde
npm run test:ai → 6 archivos, 67/67 pruebas en verde
npm run build   → 95 módulos, build correcto
```

`npm run test:solutions` no está disponible: `teacher/solutions/` solo existe en la copia del docente, como indica el propio `vite.config.js`.

---

## 8. Parte 4 — Revisión del cliente «escrito por una IA»

### Línea base de `npm run test:ai` (por archivo)

| Archivo | Pruebas | Fallan | Pasan |
|---|---:|---:|---:|
| `src/test/api.test.js` | 14 | 1 | 13 |
| `src/test/cors.test.js` | 8 | 5 | 3 |
| `src/test/useExams.test.jsx` | 18 | 12 | 6 |
| `src/test/ExamList.test.jsx` | 10 | 6 | 4 |
| `src/test/App.test.jsx` | 3 | 1 | 2 |
| `src/test/cli.test.js` | 14 | 0 | 14 |
| **Total** | **67** | **25** | **42** |

**Las 25 pruebas rojas son cinco hallazgos, no veinticinco.** Cada hallazgo rompe varias pruebas porque las pruebas miran el mismo defecto desde el hook, el componente y la aplicación completa.

### Los cinco fallos

| # | Archivo y línea | Pruebas que lo detectan | Mensaje que muestran | Causa | ¿Se vería a mano en el navegador? |
|---|---|---|---|---|---|
| 1 | `src/ai/api.js:11-13` y `src/ai/useExams.js:11-23` | `api · listExams entrega la señal…`; `useExams · al desmontar aborta…`, `al pedir otra vez…`, `si la primera respuesta llega DESPUÉS…`, `con StrictMode…` | `expected false to be true`; la lista muestra datos viejos | `listExams` no recibe la señal y el efecto no tiene `AbortController` ni bandera `cancelled`: nada cancela y una respuesta lenta pisa a la nueva | Sí, con «Red lenta (3 s)» y varios «Reintentar»: la lista puede retroceder a datos anteriores. Al desmontar, React avisa en consola, no en pantalla |
| 2 | `src/ai/useExams.js:18-22` | `useExams · si la API responde 500…`, `si el servidor está apagado…`, `reload después de un error…`; `App · con el servidor apagado…`; `ExamList · con la API caída (500)…`, `con el servidor apagado…` | `expected 'ready' to be 'error'`; la pantalla dice «Todavía no hay cuestionarios» | El `catch` solo hace `console.error` y deja `status: "ready"` con `exams: []`: un fallo se disfraza de lista vacía | Sí, inmediatamente: con el servidor apagado parece que no hay cuestionarios |
| 3 | `src/ai/useExams.js:35-44` (y `saving: false` en la línea 46) | `useExams · mientras el POST está en vuelo saving es true…`, `dos create seguidos…`; `ExamList · un doble clic en Agregar…` | `expected 2 to be 1` POST; el botón no se desactiva | `create` no tiene guarda y `saving` está fijo en `false`: dos clics envían dos altas | Sí: un doble clic crea el cuestionario dos veces |
| 4 | `src/ai/useExams.js:27-33` | `useExams · remove(id) hace DELETE…`, `si la API falla (500), la fila se queda…`; `ExamList · Eliminar quita la fila…`, `si Eliminar falla…` | `expected [ … ] not to contain 3`; la fila sigue en la tabla | `remove` no toca `exams` y su `catch` solo escribe en consola: la lista no refleja el borrado ni el error | Sí: tras «Eliminar» la fila permanece hasta recargar |
| 5 | `src/ai/cors.js:2` | `cors · no usa el comodín…`, `cada origen es esquema + host + puerto…`, `un sitio ajeno queda fuera`, `otro puerto…`, `desde un origen ajeno el navegador la bloquea…` | `expected [ '*' ] not to contain '*'`; un sitio ajeno recibe la cabecera | `allowedOrigins: ["*"]` autoriza a cualquier sitio, no solo al proyecto | No en el uso normal (el origen propio funciona igual); sí desde fuera con `examctl cors-check`: sale 9 en vez de 7 |

---

## 9. Las cuatro preguntas de revisión del diff (paso 12)

1. **¿La petición se cancela al desmontar y al repetirse, y una respuesta vieja nunca pisa a la nueva?**
   Sí. `src/client/useExams.js:21-23` crea el `AbortController` y la bandera `cancelled`; `:43-46` los activa en la limpieza; `src/client/api.js:18-19` entrega la señal a Axios. Las respuestas comprueban `if (cancelled) return` antes de tocar el estado. Lo demuestran `al desmontar aborta la petición en vuelo`, `al pedir otra vez (reload) aborta la petición anterior` y `si la primera respuesta llega DESPUÉS de la segunda, no pisa a la nueva`.

2. **¿Se resuelven los tres estados y el error se ve en pantalla, no solo en la consola?**
   Sí. `src/client/useExams.js:25-40` pasa por `loading`, `ready` y `error`, y en el fallo guarda `describeError(failure)` en `error`. `src/components/ExamList.jsx:20-33` dibuja el aviso de carga y la alerta con «Reintentar». Lo demuestran las pruebas de 500 y de servidor apagado en `useExams`, `ExamList` y `App`.

3. **¿Un botón que envía o borra no puede dispararse dos veces, y la lista refleja el cambio sin recargar?**
   Sí. `src/client/useExams.js:65-66` corta el segundo `create` con `creating.current` (un `ref`, síncrono) y `:77-80` lo libera en `finally`; `:71` añade el creado. `:55` filtra la fila borrada tras la confirmación del servidor. El botón se desactiva con `saving` (`ExamList.jsx:71`). Lo demuestran `dos create seguidos…`, `un doble clic en Agregar…` y `Eliminar quita la fila sin recargar la página`.

4. **¿Los orígenes de CORS son los justos, sin comodín?**
   Sí. `src/client/cors.js:9` contiene exactamente `"http://localhost:5173"`: esquema, host y puerto, sin barra final y sin `"*"`. Lo demuestran las 8 pruebas de `cors` y `examctl cors-check` (0 para el origen propio, 7 para un sitio ajeno, 9 solo si se arranca la API con `--wildcard`).

---

## 10. Bitácora de arreglos de la IA (paso 13)

El estado original quedó guardado en el commit `534cca3` de la plantilla. Cada arreglo se aplicó **uno a la vez** y se corrió `npm run test:ai` después de cada uno:

| Paso | Arreglo | Pasan | Fallan |
|---|---|---:|---:|
| 0 | Estado original de `src/ai/` | 42 | 25 |
| 1 | CORS: quitar el comodín y listar solo el origen del proyecto | 47 | 20 |
| 2 | Listado: señal en `listExams` + `AbortController` + bandera `cancelled` | 52 | 15 |
| 3 | Error visible: `status: "error"` y `describeError` en el `catch` | 58 | 9 |
| 4 | Alta sin doble envío: `useRef` de guarda y `saving` real | 63 | 4 |
| 5 | Borrado: filtrar la fila y guardar `actionError` | **67** | **0** |

Los tres archivos de `src/ai/` quedaron equivalentes a los del equipo y con comentarios que explican cada corrección.

---

## 11. El cliente sin pantalla (`examctl`)

Comandos ejecutados contra `npm run api` (API simulada en `http://127.0.0.1:8800/api`):

| Comando | Salida | Código |
|---|---|---:|
| `npm run examctl -- list --json` | Arreglo JSON con los 6 cuestionarios | **0** |
| `npm run examctl -- create "Examen final" --json` | `{"id":7,"title":"Examen final",...}` | **0** |
| `npm run examctl -- delete 3 --yes` | `Eliminado 3` | **0** |
| `npm run examctl -- delete 3 --yes` (repetido) | `No existe en el servidor.` | **5** |
| `npm run examctl -- delete 2` (sin `--yes`) | `delete borra el cuestionario 2 y no se puede deshacer: repite el comando con --yes.` | **8** |
| `npm run examctl -- create ""` | `Datos no válidos. title: Este campo no puede estar en blanco.` | **4** |
| `npm run examctl -- list` (servidor apagado) | `Sin conexión con la API (ECONNREFUSED).` | **3** |

**¿Para qué sirve separar `stdout` y `stderr`?** El JSON va a `stdout` para que un script o un agente lo parsee sin limpiar texto; los mensajes para personas van a `stderr` para que no contaminen ese JSON y para que se puedan mostrar aunque la salida estándar se redirija a un archivo. **¿Por qué un agente necesita el código de salida?** Porque es la respuesta máquina-legible: `0` bien, `2` uso incorrecto, `3` sin conexión, `4` datos inválidos, `5` no existe, `6` error del servidor, `7` CORS rechaza, `8` falta `--yes`, `9` CORS demasiado permisivo. Sin él, el agente tendría que adivinar leyendo el texto.

---

## 12. CORS desde fuera (paso 15)

| Comando | Resultado | Código |
|---|---|---:|
| `examctl -- cors-check --origin http://localhost:5173` | `Access-Control-Allow-Origin = http://localhost:5173` | **0** |
| `examctl -- cors-check --origin https://sitio-malo.example` | cabecera ausente: el navegador lo bloquea | **7** |
| Igual, con `npm run api -- --wildcard` | `Access-Control-Allow-Origin = *` | **9** |

**¿Por qué el comodín «funciona» desde cualquier origen y sin embargo es un fallo?** Porque responde con `*`, y el navegador acepta la respuesta de cualquier página: por eso «funciona». Pero autoriza a **cualquier** sitio de internet a llamar a la API, no solo al nuestro; un sitio malicioso podría leer datos o disparar acciones con la sesión de la persona. El código 9 existe para que el cliente de terminal lo denuncie aunque la petición «haya ido bien».

---

## 13. Por qué esta pantalla puede mentir aunque «funcione» (paso 17)

1. **Lista vacía con el servidor apagado.** La IA dejaba `status: "ready"` y `exams: []` en el `catch`: la persona ve «Todavía no hay cuestionarios» cuando en realidad la API no responde. Lo habría descubierto antes la prueba `si el servidor está apagado…` o `examctl list`, que sale con **3** y dice «Sin conexión».
2. **Datos viejos después de una carrera.** Sin `cancelled`, una respuesta lenta de un `reload` anterior pisa a la nueva y la tabla muestra cuestionarios que ya no existen. Lo habría descubierto la prueba `si la primera respuesta llega DESPUÉS de la segunda…` o `examctl list --json`, que siempre lee el estado actual del servidor.
3. **Fila que sigue tras borrar.** Si `remove` no actualiza la lista, la fila permanece aunque el servidor ya borró; la persona vuelve a pulsar «Eliminar» y recibe un 404. Lo habría descubierto la prueba `remove(id) hace DELETE…` o `examctl list --json` después de `examctl delete <id> --yes`.

A esos tres se suma el **falso «Network Error»**: un bloqueo de CORS y un servidor apagado se ven igual en pantalla. `examctl cors-check` los separa con los códigos **3**, **7** y **9**.

---

## 14. Uso de IA (paso 18)

| Turno | Qué se le pidió | Qué respondió | Decisión | Por qué (pregunta o prueba) | Evidencia |
|---|---|---|---|---|---|
| 1 | Escribir `src/client/api.js` | Módulo con `API_URL`, instancia, tres funciones y `describeError` | **Aceptado** | Pregunta 2: los errores llegan a pantalla; prueba `api` 14/14 | `npm test -- api` → 14/14 |
| 2 | Escribir `src/client/cors.js` | `allowedOrigins: ["http://localhost:5173"]` | **Aceptado** | Pregunta 4: origen exacto, sin comodín; prueba `cors` 8/8 | `npm test -- cors` → 8/8 |
| 3 | Escribir `src/client/useExams.js` | Tres estados, `AbortController`, `cancelled`, `reload`, `remove` y `create` con `useRef` | **Aceptado** | Preguntas 1, 2 y 3; prueba `useExams` 18/18 | `npm test -- useExams` → 18/18 |
| 4 | Revisar `src/ai/` y clasificar sus fallos | Cinco hallazgos con archivo, línea, pruebas y causa | **Aceptado** | Las 25 pruebas rojas se agrupan en 5 causas | `npm run test:ai` 42 → 67 |
| 5 | «Pon `allowedOrigins: ["*"]` para que funcione desde cualquier sitio» | Propuso el comodín | **Rechazado** | Pregunta 4: el comodín autoriza a cualquier origen; `cors` falla y `cors-check` sale 9 | Ver diff del rechazo |
| 6 | «Deja el `catch` con `console.error` y `status: "ready"`» | Propuso ocultar el error | **Rechazado** | Pregunta 2: el error no se ve en pantalla; `useExams`/`ExamList` fallan | Ver diff del rechazo |

### Diff del rechazo (turno 5)

```diff
 export const corsPolicy = {
-  allowedOrigins: ["*"],
+  allowedOrigins: ["http://localhost:5173"],
   allowCredentials: false,
 };
```

Evidencia del rechazo: con `["*"]`, `examctl cors-check --origin https://sitio-malo.example` responde `Access-Control-Allow-Origin = *` y sale con **9**; con el origen exacto, la cabecera está ausente y sale con **7**.

### Diff del rechazo (turno 6)

```diff
-      .catch((err) => {
-        console.error("Error loading exams", err);
-        setExams([]);
-        setStatus("ready");
-      });
+      .catch((err) => {
+        setExams([]);
+        setError(describeError(err));
+        setStatus("error");
+      });
```

Evidencia: con el `catch` original, la prueba `si el servidor está apagado…` recibe `status: "ready"` y la pantalla dice «Todavía no hay cuestionarios»; con el arreglo, `status: "error"` y la alerta explica el fallo.

---

## 15. Estructura del proyecto

```text
semana 12 extra/
├── AGENTS.md                 contrato del agente y las cuatro preguntas
├── ENTREGABLE.md             este documento
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .env.team / .env.ai / .env.solutions
├── cli/
│   ├── examctl.mjs           cliente sin pantalla
│   └── fake-api.mjs          API simulada por HTTP
├── docs/img/                 capturas de los tres estados y de los errores
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── ai/                   los tres archivos «escritos por una IA» (revisados y corregidos)
    │   ├── api.js
    │   ├── cors.js
    │   └── useExams.js
    ├── client/               lo escrito por el equipo
    │   ├── api.js
    │   ├── cors.js
    │   └── useExams.js
    ├── components/           ExamList y NetworkPanel (ya escritos)
    ├── lib/                  red simulada: fakeApi, cors y fakeNetwork
    └── test/                 api, cors, useExams, ExamList, App y cli
```

Solo se modificaron los **seis** archivos permitidos: `src/client/{api,cors,useExams}.js` y `src/ai/{api,cors,useExams}.js`. `App`, `ExamList`, `NetworkPanel`, `src/lib/`, `cli/`, las pruebas, `package.json`, `vite.config.js` y los `.env.*` quedaron **idénticos** a la plantilla (comprobado por hash SHA-256).

---

## 16. Autoevaluación con la rúbrica

| Criterio | Puntos | Justificación |
|---|---:|---|
| Escribe el módulo cliente y la política de CORS con los orígenes justos | 5/5 | `api.js` con dirección única, timeout, tres operaciones y `describeError`; `cors.js` con solo `http://localhost:5173`, sin comodín. `api` 14/14 y `cors` 8/8. |
| Escribe el hook del listado con los tres estados, cancelación, borrado y alta sin doble envío | 5/5 | `useExams` con `loading/ready/error`, `AbortController`, `cancelled`, `reload`, filtrado local y guarda con `useRef`. `useExams` 18/18. |
| Revisa el cliente de la IA con las pruebas como oráculo y clasifica sus cinco fallos | 5/5 | Tabla de 5 hallazgos con archivo, línea, pruebas, mensaje, causa y visibilidad; 42 → 67 pruebas tras cinco arreglos. |
| Usa el cliente sin pantalla, explica por qué la pantalla puede mentir y documenta su uso de IA | 5/5 | Tabla de comandos con códigos 0/3/4/5/7/8/9; tres ejemplos de pantalla que miente; tabla de uso de IA con dos rechazos y sus diffs. |
| **Total** | **20/20** | |

---

## 17. Conclusiones

1. **Un solo módulo cliente y una política de CORS exacta evitan la mayoría de los errores de integración.** Con la dirección en un único sitio, `response.data` en cada función y `describeError` traduciendo cualquier fallo, la pantalla nunca se queda muda; con solo el origen del proyecto, el comodín deja de ser una tentación. Lo confirman `npm test` **67/67** y `cors-check` con códigos **0**, **7** y **9**.

2. **El hook del listado no está completo hasta que resuelve la carrera y el doble envío.** El `AbortController` con la bandera `cancelled` impide que una respuesta vieja pise a la nueva, y la guarda con `useRef` —no con un estado— impide el segundo `POST` que un doble clic sí alcanzaría. Los tres estados y las capturas (`s12-cargando`, `s12-datos`, `s12-error-500`) demuestran que la interfaz acompaña a la petición.

3. **Las pruebas son el oráculo que separa «funciona» de «es correcto».** Las 25 pruebas rojas de la IA eran solo **cinco** fallos, y corregirlos uno a uno —42 → 47 → 52 → 58 → 63 → 67— mostró que cada arreglo tiene una prueba que lo respalda. `examctl` añade la mirada sin pantalla: códigos de salida distintos para «sin conexión» (3), «CORS rechaza» (7) y «comodín» (9).

---

## 18. Limitaciones

- La red es simulada (`src/lib/fakeNetwork.js`): no hay Django ni sockets. La API real se probaría con `VITE_API_URL` y `CORS_ALLOWED_ORIGINS` en el servidor.
- `npm run test:solutions` no se puede ejecutar: la carpeta `teacher/solutions/` solo existe en la copia del docente.
- `examctl` se probó contra la API simulada por HTTP (`npm run api`), no contra la API de la semana 8 desplegada.
