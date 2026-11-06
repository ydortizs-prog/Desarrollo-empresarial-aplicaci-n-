export default function Footer({ contact }) {
  return (
    <footer className="site-footer" id="contacto">
      <div className="site-footer__inner">
        <p className="site-footer__brand">Cine Tecsup</p>
        <p>{contact.address}</p>
        <p>
          <a href={`tel:${contact.phone}`}>{contact.phone}</a>
        </p>
        <p>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
        <p className="site-footer__copy">
          © 2026 Cine Tecsup. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
