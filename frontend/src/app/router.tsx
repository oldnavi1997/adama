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
import { useCartStore } from "../features/cart/cart.store";
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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const location = useLocation();
  const { items, updateQty, removeItem } = useCartStore();
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    api<PublicCategory[]>("/products/categories/public")
      .then((res) => setCategories(res))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isCartDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen, isCartDrawerOpen]);

  return (
    <>
      <header>
        <div className="container row" style={{ justifyContent: "space-between", paddingBlock: 12 }}>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Abrir menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => {
              setIsCartDrawerOpen(false);
              setIsMobileMenuOpen(true);
            }}
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
          <nav className="cart-trigger-nav">
            <button
              type="button"
              className="cart-icon-button"
              aria-label="Abrir carrito"
              aria-expanded={isCartDrawerOpen}
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCartDrawerOpen(true);
              }}
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
          </nav>
        </div>
      </header>
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen || isCartDrawerOpen ? "open" : ""}`}
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsCartDrawerOpen(false);
        }}
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
      <aside className={`cart-drawer ${isCartDrawerOpen ? "open" : ""}`} aria-hidden={!isCartDrawerOpen}>
        <div className="mobile-menu-header">
          <strong>Carrito</strong>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Cerrar carrito"
            onClick={() => setIsCartDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <p>Tu carrito esta vacio.</p>
          ) : (
            <>
              <div className="cart-drawer-list">
                {items.map((item) => (
                  <div key={item.productId} className="cart-drawer-item">
                    <div className="cart-drawer-item-main">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="cart-drawer-thumb" />
                      ) : (
                        <div className="cart-drawer-thumb cart-drawer-thumb--fallback" aria-hidden="true" />
                      )}
                      <div className="cart-drawer-item-info">
                        <div className="cart-drawer-item-top">
                          <span className="cart-drawer-brand">Adamantio</span>
                          <button
                            type="button"
                            className="cart-drawer-remove-icon"
                            aria-label={`Eliminar ${item.name}`}
                            onClick={() => removeItem(item.productId)}
                          >
                            ×
                          </button>
                        </div>
                        <strong className="cart-drawer-name">{item.name}</strong>
                        <div className="cart-drawer-item-meta">
                          <select
                            className="cart-drawer-qty"
                            value={item.quantity}
                            onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                            aria-label={`Cantidad de ${item.name}`}
                          >
                            {Array.from({ length: 10 }, (_, index) => index + 1).map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </select>
                          <strong className="cart-drawer-line-price">S/ {(item.price * item.quantity).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-drawer-footer">
                <div className="cart-drawer-summary-row">
                  <span>Subtotal</span>
                  <strong>S/ {cartTotal.toFixed(2)}</strong>
                </div>
                <div className="cart-drawer-summary-row">
                  <span>Entrega</span>
                  <span>Por calcular</span>
                </div>
                <div className="cart-drawer-summary-row cart-drawer-summary-total">
                  <span>Total</span>
                  <strong>S/ {cartTotal.toFixed(2)}</strong>
                </div>
                <Link
                  to="/checkout"
                  className="cart-drawer-checkout-btn"
                  onClick={() => setIsCartDrawerOpen(false)}
                >
                  Ir al checkout
                </Link>
                <div className="cart-drawer-footer-links">
                  <Link to="/cart" onClick={() => setIsCartDrawerOpen(false)}>
                    Ver carrito completo
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
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
