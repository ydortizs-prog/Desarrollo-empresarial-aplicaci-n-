# Laboratorio extra S09 — React revisado por pruebas

**Alumno:** _(completar)_
**Curso:** Desarrollo de Aplicaciones Empresariales (DAE)
**Repositorio:** dae-s09-react-ia

## Resultados de la verificación

| Comando | Resultado |
|---|---|
| `npm run duel` (mis componentes) | **43/43 pruebas en verde** |
| `npm run duel:fixed` (copia corregida de la IA) | **43/43 pruebas en verde** |
| `npm test` (suite completa) | **47/47 pruebas en verde** |
| `npm run build` | **Compila correctamente** |

---

## Parte 1 — Leer el verificador

Las pruebas están en `src/duel/tests/` (una por tarea) y se ejecutan con Vitest + Testing Library sobre jsdom.
Cada archivo comprueba el rol ARIA, el texto accesible, las props y, en algunos casos, que no haya avisos de
React en la consola (por ejemplo, `class` en lugar de `className` o falta de `key`).

## Parte 2 — Los ocho componentes (`src/duel/team/`)

| Tarea | Componente | Decisión principal |
|---|---|---|
| 1 | `Header` | `<header>` + `<h1>` + `<nav aria-label="Principal">` con un `<li>` por enlace. |
| 2 | `Footer` | `<footer>` con dirección, enlace `tel:` y enlace `mailto:`. |
| 3 | `MovieCard` | `<article>` con `<img alt={movie.title}>`, `<h3>` y valoración `★ {rating}`. |
| 4 | `Showtimes` | Si `times.length === 0` muestra `<p>Sin funciones hoy</p>`; si no, `<ul>` con un `<li>` por hora. |
| 5 | `MovieList` | `<ul>` con un `<li key={movie.id}>` por película (clave estable). |
| 6 | `Synopsis` | `<p>{text}</p>`: React escapa el HTML y lo muestra como texto. |
| 7 | `Hero` | `<section aria-label="Destacada">` con `<h2>` y enlace `#horarios-{id}`. |
| 8 | `AgentMessage` | `<p><strong>{author}:</strong> <span>{text}</span></p>`. |

## Parte 3 — El duelo con la IA: clasificación de los fallos

La IA acertó en **Header** y **AgentMessage**. Los otros seis componentes fallan:

| # | Componente | Fallo | Por qué falla |
|---|---|---|---|
| 1 | `Footer` | Usa `class="footer"` en JSX. | React espera `className`; genera el aviso «Invalid DOM property». |
| 2 | `MovieCard` | `<img src={movie.image} />` sin `alt`. | La imagen no tiene texto alternativo; falla `getByAltText`. |
| 3 | `Showtimes` | Comprueba `!times` y usa `times.length && (...)`. | Un array vacío es *truthy*: no muestra el mensaje y además imprime un `0` suelto. |
| 4 | `MovieList` | Usa `key={index}`. | Al invertir o quitar películas, React reutiliza nodos por posición y se pierde la identidad del DOM. |
| 5 | `Synopsis` | Usa `dangerouslySetInnerHTML`. | Interpreta el HTML de terceros y ejecuta el `onerror` (XSS). |
| 6 | `Hero` | Recibe la prop `film`, pero el contrato es `movie`. | `film` es `undefined` y lanza `TypeError: Cannot read properties of undefined`. |

## Parte 4 — Arreglos en `src/duel/fixed/`

| Archivo | Cambio aplicado |
|---|---|
| `Footer.jsx` | `class` → `className`. |
| `MovieCard.jsx` | Añadido `alt={movie.title}` a la imagen. |
| `Showtimes.jsx` | Condición `times.length === 0` y `<ul>` solo cuando hay horas. |
| `MovieList.jsx` | `key={movie.id}` en lugar de `key={index}`. |
| `Synopsis.jsx` | Eliminado `dangerouslySetInnerHTML`; ahora `<p>{text}</p>`. |
| `Hero.jsx` | Renombrada la prop `film` a `movie`. |

## Parte 5 — Datos de terceros y XSS

1. Cambié temporalmente `Synopsis` a `dangerouslySetInnerHTML` y recargué la página.
2. En la consola del navegador, `window.__xss` pasó a valer **1** y apareció un `<img src="x" onerror="...">`
   además de los 8 pósters (9 imágenes en total). El código de terceros se ejecutó.
3. Restauré la versión segura `<p>{text}</p>` y recargué: `window.__xss` quedó **sin definir**, las imágenes
   volvieron a ser **8** y la sinopsis hostil se mostró como texto literal.

**Conclusión:** con datos de terceros nunca se debe usar `dangerouslySetInnerHTML`; React ya escapa el contenido
por defecto y así se evita la ejecución de scripts.

## Observaciones

1. Comprobé que las pruebas son el contrato: indican roles ARIA, textos y hasta los avisos de consola que no se aceptan.
2. Entendí que un array vacío es *truthy* en JavaScript, por eso `!times` no detecta la lista vacía.
3. Verifiqué que usar el índice como `key` rompe la identidad de los nodos al reordenar o eliminar elementos.
4. Confirmé que `dangerouslySetInnerHTML` ejecuta el HTML de terceros y permite un ataque XSS real.
5. Me di cuenta de que un nombre de prop incorrecto (`film` en lugar de `movie`) provoca un error de ejecución.

## Conclusiones

1. Aprendí a desarrollar componentes funcionales de React guiándome por pruebas automáticas.
2. Comprendí la importancia de las claves estables para que React conserve correctamente los nodos del DOM.
3. Reforcé que React escapa el texto por defecto y que insertar HTML sin control es un riesgo de seguridad.
4. Entendí que pequeñas diferencias (`class`/`className`, `alt`, nombres de props) rompen la accesibilidad o la ejecución.
5. Concluí que ejecutar el verificador después de cada cambio permite detectar y corregir los errores de inmediato.
