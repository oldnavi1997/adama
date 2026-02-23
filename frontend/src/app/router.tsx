import { createBrowserRouter, Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { CatalogPage } from "../features/catalog/CatalogPage";
import { ProductDetailPage } from "../features/catalog/ProductDetailPage";
import { CategoryPage } from "../features/catalog/CategoryPage";
import { CartPage } from "../features/cart/CartPage";
import { CheckoutPage } from "../features/checkout/CheckoutPage";
import { CheckoutSuccessPage } from "../features/checkout/CheckoutSuccessPage";
import { CheckoutFailurePage } from "../features/checkout/CheckoutFailurePage";
import { CheckoutPendingPage } from "../features/checkout/CheckoutPendingPage";
import { api } from "./api";

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: PublicCategory[];
};

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

function MobileCategoryItem({
  category,
  onNavigate
}: {
  category: PublicCategory;
  onNavigate: () => void;
}) {
  const hasChildren = category.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link to={`/categoria/${category.slug}`} className="mobile-menu-link" onClick={onNavigate}>
          {category.name}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <details className="mobile-menu-details">
        <summary>{category.name}</summary>
        <ul className="mobile-sub-list">
          <li>
            <Link to={`/categoria/${category.slug}`} className="mobile-menu-link" onClick={onNavigate}>
              Ver todo {category.name}
            </Link>
          </li>
          {category.children.map((child) => (
            <MobileCategoryItem key={child.id} category={child} onNavigate={onNavigate} />
          ))}
        </ul>
      </details>
    </li>
  );
}

function Layout() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api<PublicCategory[]>("/products/categories/public")
      .then((res) => setCategories(res))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header>
        <div className="container row" style={{ justifyContent: "space-between", paddingBlock: 12 }}>
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
          <nav>
            <Link to="/cart">Carrito</Link>
          </nav>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Abrir menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`} aria-hidden={!isMobileMenuOpen}>
        <div className="mobile-menu-header">
          <strong>Menu</strong>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Cerrar menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label="Menu lateral movil">
          <Link to="/cart" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>
            Carrito
          </Link>
          {categories.length > 0 ? (
            <ul className="mobile-category-list">
              {categories.map((category) => (
                <MobileCategoryItem
                  key={category.id}
                  category={category}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </ul>
          ) : null}
        </nav>
      </aside>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "producto/:productSlug", element: <ProductDetailPage /> },
      { path: "categoria/:categorySlug", element: <CategoryPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "checkout/success", element: <CheckoutSuccessPage /> },
      { path: "checkout/failure", element: <CheckoutFailurePage /> },
      { path: "checkout/pending", element: <CheckoutPendingPage /> }
    ]
  }
]);
