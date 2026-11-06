# React revisado por pruebas — la IA escribe, el verificador decide

Repositorio del laboratorio **extra de la semana 9** de Desarrollo de Aplicaciones Empresariales (DAE).
Complementa el laboratorio oficial de la cartelera de cine (Vite, JSX, componentes, props y listas con `map`):
aquí escribes **ocho componentes pequeños** de esa cartelera contra **pruebas automáticas**, ves cómo una IA
resuelve las mismas ocho tareas (y falla de seis maneras distintas) y llevas una copia de sus respuestas
**de rojo a verde**.

La guía del laboratorio (con su rúbrica) está en el campus virtual; aquí está el código.

> No hay estado ni hooks en este laboratorio: todo son componentes funcionales que reciben props. Eso es la semana 10.

## Puesta en marcha

Necesitas **Node 20 o superior** (`node --version`). En PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
npm run dev        # abre http://localhost:5173 (usa «localhost», no 127.0.0.1)
```

Al principio la pantalla muestra un error rojo: `TODO(team): write Header ...`. Es lo esperado, porque tus ocho
componentes todavía están sin escribir. Cada vez que escribas uno, el error pasa al siguiente.

## Parte 1 — Leer el verificador

Las pruebas son el oráculo: deciden si un componente está bien. Están en `src/duel/tests/`, una por tarea
(`T1-header.test.jsx` … `T8-agentmessage.test.jsx`). Léelas antes de escribir nada: dicen qué rol, qué nombre
accesible y qué texto se espera, y qué avisos de React no se aceptan. Los datos fijos están en `src/data/movies.js`.

```powershell
npm run duel       # tus componentes (src/duel/team/): al principio todo en rojo
```

## Parte 2 — Escribir los ocho componentes

Escribe cada componente en su archivo de `src/duel/team/` (hoy lanza un error `TODO(team)`). La cabecera de cada
archivo dice qué props recibe y qué debe devolver. Después de cada uno, `npm run duel`; la pantalla
(`npm run dev`) compone los ocho en `src/App.jsx`.

| Tarea | Componente | Props |
|---|---|---|
| 1 | `Header` | `name`, `links` |
| 2 | `Footer` | `contact` |
| 3 | `MovieCard` | `movie` |
| 4 | `Showtimes` | `times` |
| 5 | `MovieList` | `movies` |
| 6 | `Synopsis` | `text` |
| 7 | `Hero` | `movie` |
| 8 | `AgentMessage` | `author`, `text` |

## Parte 3 — El duelo con la IA

```powershell
npm run duel:ai    # las respuestas de una IA (src/duel/ai/): algunas pruebas fallan
```

Lee cada fallo: el nombre de la prueba dice qué se esperaba y el mensaje, qué ocurrió. Clasifica los seis fallos
(el de la tarea 1 y el de la 8 no son fallos: la IA los hizo bien).

## Parte 4 — Arreglar la copia de la IA

```powershell
npm run fixed:init   # copia src/duel/ai/ a src/duel/fixed/ (no pisa lo que ya tengas)
npm run duel:fixed   # rojo
```

Edita **solo** los archivos de `src/duel/fixed/` (nunca los de `ai/`) hasta que `npm run duel:fixed` pase entero, y
explica cada arreglo. Para empezar de cero: `npm run fixed:init -- --force`.

## Parte 5 — Datos de terceros

En `src/data/movies.js` la sinopsis de la primera película es HTML escrito por un tercero, y en `src/App.jsx` hay un
mensaje de un agente de IA con otra etiqueta `<img onerror>`. En esta parte cambias a propósito tu `Synopsis` a
`dangerouslySetInnerHTML`, ves en la consola del navegador (`window.__xss`) que el código se ejecutó, y lo
vuelves a dejar bien. La guía tiene los pasos.

## Qué hace cada script

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite con la cartelera armada con **tus** componentes (`src/duel/team/`) |
| `npm run build` | Compila la aplicación a `dist/` (comprueba que todo importa bien; no ejecuta las pruebas) |
| `npm test` | Todas las pruebas del proyecto: los datos (siempre verdes) y el duelo con **tus** componentes |
| `npm run duel` | El duelo con `src/duel/team/` (lo tuyo) |
| `npm run duel:ai` | El duelo con `src/duel/ai/` (las respuestas de la IA, de solo lectura) |
| `npm run duel:fixed` | El duelo con `src/duel/fixed/` (tu copia arreglada de la IA) |
| `npm run fixed:init` | Crea `src/duel/fixed/` copiando `ai/` |
| `npm run duel:solutions` | Solo docente: el duelo con las soluciones. Sin `teacher/` avisa de que no está disponible |

Las pruebas se ejecutan en jsdom (un navegador simulado) con Vitest y Testing Library. Cada modo (`team`, `ai`,
`fixed`, `solutions`) es un *modo de Vite*: lo elige el archivo `.env.<modo>`, que define `VITE_DUEL_SOURCE`.

## Estructura

| Ruta | Para qué |
|---|---|
| `src/duel/team/` | **Tuyo (Partes 1 y 2):** los ocho componentes sin escribir |
| `src/duel/ai/` | Las ocho respuestas de la IA. No las edites |
| `src/duel/fixed/` | **Tuyo (Parte 4):** la copia de `ai/` que arreglas (la crea `fixed:init`) |
| `src/duel/tests/` | Las pruebas, una por tarea: el verificador |
| `src/duel/support.js` | Elige el origen de los componentes y espía los avisos de la consola |
| `src/data/movies.js` | Los datos fijos: ocho películas, una sin funciones y una con sinopsis hostil |
| `src/App.jsx` | La cartelera armada con los componentes |
| `vite.config.js`, `.env.*` | Modos de Vite y configuración de Vitest |

## Convenciones del curso

Código, nombres y comentarios en inglés; explicaciones y entregables en español.
