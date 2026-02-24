import { Link } from "react-router-dom";

const LOGO_URL = "https://adamantio.pe/wp-content/uploads/2025/02/adamantio-logo-768x224.png";

const LEGAL_LINKS = [
  { to: "/terminos-de-servicio", label: "Términos de servicio" },
  { to: "/politica-de-reembolsos", label: "Política de reembolsos" },
  { to: "/politica-de-privacidad", label: "Política de privacidad" },
  { to: "/libro-de-reclamaciones", label: "Libro de reclamaciones" }
] as const;

const SOCIAL = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/adamantio.pe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    )
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/adamantio.pe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  }
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-grid">
          <section className="footer-brand" aria-label="Marca">
            <Link to="/" className="footer-logo-link">
              <img src={LOGO_URL} alt="Adamantio" className="footer-logo" />
            </Link>
            <p className="footer-tagline">Joyas con significado. Mensajes ocultos y conexión eterna en cada pieza.</p>
          </section>

          <section className="footer-explore" aria-label="Explora">
            <h3 className="footer-heading">Explora</h3>
            <ul className="footer-links">
              {LEGAL_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="footer-contact" aria-label="Contacto">
            <h3 className="footer-heading">Contacto</h3>
            <div className="footer-social">
              {SOCIAL.map(({ name, href, icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  aria-label={name}
                >
                  {icon}
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 Adamantio. Todos los derechos reservados.</p>
          <div className="footer-payments" aria-label="Métodos de pago">
            <span className="footer-payments-label">Aceptamos</span>
            <div className="footer-payment-icons">
              <span className="footer-payment-icon" title="Visa" aria-hidden="true">
                <svg viewBox="0 0 48 32" width="36" height="24" fill="currentColor">
                  <path d="M18.8 21.2h-3.2l2-12.4h3.2l-2 12.4zm9.2-12.4l-2.6 8.5-1.1-4.3c-.2-.8-.7-1.1-1.4-1.1h-4.6l.1.4c1.6.3 2 1.4 2.2 2.4l1.2 6.2h3.2l5.2-12.4h-3.2zm-22 0l-3.4 8.9-.4-1.9c-.7-2.2-2.6-3.1-4.6-3.4l.1-.4h7.9c.8 0 1.5.5 1.7 1.4l1.4 7-2.2 8.4H8.5l5.5-12.4zm-4.2-4.2L2 24.8H5l1.4-3.4c.5.2 1.2.3 1.8.3 1.9 0 3.4-.9 4.2-2.3l-1.5-.9c-.5.8-1.4 1.2-2.4 1.2-1 0-1.8-.4-2.4-1.1L.8 4.6z" />
                </svg>
              </span>
              <span className="footer-payment-icon" title="Mastercard" aria-hidden="true">
                <svg viewBox="0 0 48 32" width="36" height="24">
                  <circle cx="18" cy="16" r="10" fill="#eb001b" />
                  <circle cx="30" cy="16" r="10" fill="#f79e1b" />
                  <path fill="#ff5f00" d="M24 6.2a9.9 9.9 0 0 1 0 19.6 10 10 0 0 1 0-19.6z" />
                </svg>
              </span>
              <span className="footer-payment-icon" title="American Express" aria-hidden="true">
                <svg viewBox="0 0 48 32" width="36" height="24" fill="currentColor">
                  <path d="M2 8h44v16H2V8zm4 2.5v2h4v-2h2v7h-2v-2.5h-4v2H4v-7h2zm8 0h3.5l1.5 2.5 1.5-2.5H24v7h-2v-4l-1 1.5-1-1.5v4h-2v-7zm8.5 0h4c1.2 0 2 .8 2 2v.5c0 1-.8 1.5-1.5 1.5.8 0 1.5.5 1.5 1.5v1c0 1.2-.8 2-2 2h-4v-7zm2 2v1.5h2v-1.5h-2zm0 2.5v2h2v-2h-2zm10-5h4v1.5h-4V8h6v1.5h-4V11h4v1.5h-4v1h4V15h-6v-7z" opacity="0.9" />
                </svg>
              </span>
              <span className="footer-payment-icon footer-payment-icon--mp" title="Mercado Pago" aria-hidden="true">
                <span className="footer-payment-icon-text">MP</span>
              </span>
              <span className="footer-payment-icon" title="Diners Club" aria-hidden="true">
                <svg viewBox="0 0 48 32" width="36" height="24" fill="currentColor">
                  <path d="M8 8h12c4 0 7 3 7 8s-3 8-7 8H8V8zm2 2v12h8c2.8 0 5-2.2 5-6s-2.2-6-5-6h-8zm18-2h12v2h-10v4h8v2h-8v4h10v2H28V8z" opacity="0.9" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
