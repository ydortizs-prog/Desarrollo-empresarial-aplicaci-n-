export default function Header({ name, links }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <h1 className="site-header__title">{name}</h1>

        <nav className="site-nav" aria-label="Principal">
          <ul className="site-nav__list">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
