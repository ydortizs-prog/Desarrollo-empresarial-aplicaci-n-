// TODO (Button) — escribe un botón reutilizable.
//
// Qué debe hacer:
//   1. Aceptar una prop `variant` con los valores "primary", "danger" y "ghost" (por defecto "primary")
//      y reflejarla en la clase: className="btn btn-<variant>"  (por ejemplo "btn btn-danger").
//   2. Recibir su contenido por `children` (puede ser texto o elementos).
//   3. Ser type="button" por defecto, para que no envíe formularios sin querer.
//      Pero quien lo use debe poder cambiarlo con type="submit".
//   4. Reenviar el resto de props (onClick, disabled, aria-label...) al <button> real.
//
// Hoy este botón ignora `variant` y no fija `type`: por eso fallan sus pruebas.
// Ejecuta `npm test` y mira cuáles.
export default function Button({ variant = "primary", children, ...rest }) {
  // `{...rest}` va DESPUÉS de type="button": así un type="submit" pasado por quien
  // usa el botón lo sobrescribe. Si fuera antes, type="button" ganaría siempre y
  // ningún formulario podría enviarse con este botón.
  return (
    <button type="button" className={`btn btn-${variant}`} {...rest}>
      {children}
    </button>
  );
}
