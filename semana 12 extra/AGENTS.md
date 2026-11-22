# AGENTS.md — contrato del agente de este repositorio

Este archivo lo lee el agente de IA (TecsupCode u otro) al empezar. Es la frontera de confianza de la semana 8 aplicada
a tu propio asistente: **el agente propone y escribe; las pruebas y las personas deciden.**

## Qué puedes hacer

- Editar **solo** `src/client/` (el módulo de la API, la política de CORS y el hook) y `src/components/`.
- Correr `npm test` (y `npm run build`) cuantas veces haga falta.
- Usar el cliente sin pantalla: `node cli/examctl.mjs list --json` (contra `npm run api`) para ver lo que responde la API.
- Proponer cambios **en un archivo por turno** y explicar en dos frases qué cambiaste y por qué.
- Dejar una bitácora corta de cada turno: archivo tocado, pruebas antes y después.

## Qué NO puedes hacer

- Tocar las pruebas (`src/test/`), `src/lib/` (la red simulada), `cli/`, `package.json`, `vite.config.js` ni los `.env.*`.
- Instalar paquetes ni cambiar versiones.
- Subir al repositorio (`git push`) ni borrar archivos.
- **Borrar o crear datos con `examctl delete` o `examctl create` sin que la persona te lo pida en ese turno.** Un borrado
  se ejecuta con `--yes` solo si una persona lo ordenó con el identificador a la vista.
- **Autorizar orígenes en CORS.** Qué origen puede llamar a la API lo decide el equipo y lo escribe en su entregable.
  Nunca pongas `"*"` para «que funcione».
- **Decidir dónde se recarga la lista tras borrar o crear.** Es una decisión del equipo (paso 7 del Lab 12). Si el cambio
  exige moverla, **detente y pregunta**.
- Dar por terminado nada con pruebas en rojo. Si no logras ponerlas en verde, dilo y muestra la salida de `npm test`.

## Cómo trabajar

1. Lee solo el archivo que te piden y su archivo de pruebas. No leas el repositorio entero.
2. Escribe el cambio, corre `npm test -- <nombre del archivo>` y pega la salida.
3. Todo `useEffect` que abre una petición la cancela en su función de limpieza (`AbortController`) e ignora la respuesta
   si ya no es la vigente.
4. Un `catch` nunca queda vacío ni solo con `console.error`: el error llega a la pantalla con una frase para la persona.

## Las cuatro preguntas de la revisión del diff

Antes de aceptar lo que escribió el agente, la persona responde por escrito:

1. ¿La petición se **cancela** al desmontar y al repetirse, y una respuesta vieja nunca pisa a la nueva?
2. ¿Se resuelven los **tres estados** (cargando, con datos, con error) y el error **se ve** en pantalla, no solo en la consola?
3. ¿Un botón que envía (alta) o borra no puede **dispararse dos veces**, y la lista **refleja** el cambio sin recargar?
4. ¿Los orígenes de CORS son **los justos** (esquema + host + puerto exactos), sin comodín?

Una respuesta «no sé» cuenta como «no»: se vuelve a leer el diff o se corre una prueba que lo demuestre.
