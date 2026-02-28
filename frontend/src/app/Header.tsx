import { Link } from "react-router-dom";
import type { PublicCategory } from "./publicCategories";
export type { PublicCategory } from "./publicCategories";

function CategoryMenuItem({ category }: { category: PublicCategory }) {
  const hasChildren = category.children.length > 0;

  return (
    <li className={`menu-item ${hasChildren ? "menu-item-has-children" : ""}`}>
      <Link to={`/categoria/${category.slug}`} className="menu-link">
        {category.name}
        {hasChildren ? <span className="menu-arrow">▾</span> : null}
      </Link>
      {hasChildren ? (
        <ul className="sub-menu">
          {category.children.map((child) => (
            <CategoryMenuItem key={child.id} category={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

type HeaderProps = {
  categories: PublicCategory[];
  cartItemsCount: number;
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  onOpenMobileMenu: () => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
};

export function Header({
  categories,
  cartItemsCount,
  isMobileMenuOpen,
  isCartDrawerOpen,
  onOpenMobileMenu,
  onOpenCart,
  onOpenSearch
}: HeaderProps) {
  return (
    <header className="site-header" role="banner">
      <div className="container row" style={{ justifyContent: "space-between", paddingBlock: 12 }}>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Abrir menu"
          aria-expanded={isMobileMenuOpen}
          onClick={onOpenMobileMenu}
        >
          <span />
          <span />
          <span />
        </button>
        <nav>
          <Link to="/" className="brand-link">
            <img
              src="https://adamantio.pe/wp-content/uploads/2025/02/adamantio-logo-768x224.png"
              alt="Adamantio"
              className="brand-logo"
            />
          </Link>
        </nav>
        {categories.length > 0 && (
          <nav className="header-categories-nav" aria-label="Categorias de productos">
            <ul className="category-menu">
              {categories.map((category) => (
                <CategoryMenuItem key={category.id} category={category} />
              ))}
            </ul>
          </nav>
        )}

        <div className="header-actions">
          <button
            type="button"
            className="search-toggle-btn"
            aria-label="Buscar productos"
            onClick={onOpenSearch}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className="cart-icon-button"
            aria-label="Abrir carrito"
            aria-expanded={isCartDrawerOpen}
            onClick={onOpenCart}
          >
            <svg className="cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M3 4h2l2.2 9.2a2 2 0 0 0 2 1.55h7.9a2 2 0 0 0 1.95-1.54L21 7H7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="19" r="1.7" fill="currentColor" />
              <circle cx="17" cy="19" r="1.7" fill="currentColor" />
            </svg>
            {cartItemsCount > 0 ? <span className="cart-badge">{cartItemsCount}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );
}
