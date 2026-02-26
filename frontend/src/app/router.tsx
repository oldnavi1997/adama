import { createBrowserRouter, Link, useLocation } from "react-router-dom";
import KeepAliveRouteOutlet from "keepalive-for-react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { CatalogPage } from "../features/catalog/CatalogPage";
import { CategoryPage } from "../features/catalog/CategoryPage";
import { ErrorBoundary } from "./ErrorBoundary";
import { useCartStore } from "../features/cart/cart.store";
import { api } from "./api";
import { Footer } from "./Footer";
import { Header, type PublicCategory } from "./Header";
import { fetchPublicCategories, getCachedPublicCategories } from "./publicCategories";

const ProductDetailPage = lazy(() => import("../features/catalog/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import("../features/cart/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("../features/checkout/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import("../features/checkout/CheckoutSuccessPage").then((m) => ({ default: m.CheckoutSuccessPage })));
const CheckoutFailurePage = lazy(() => import("../features/checkout/CheckoutFailurePage").then((m) => ({ default: m.CheckoutFailurePage })));
const CheckoutPendingPage = lazy(() => import("../features/checkout/CheckoutPendingPage").then((m) => ({ default: m.CheckoutPendingPage })));
const TerminosDeServicioPage = lazy(() => import("./legal/TerminosDeServicioPage").then((m) => ({ default: m.TerminosDeServicioPage })));
const PoliticaReembolsosPage = lazy(() => import("./legal/PoliticaReembolsosPage").then((m) => ({ default: m.PoliticaReembolsosPage })));
const PoliticaPrivacidadPage = lazy(() => import("./legal/PoliticaPrivacidadPage").then((m) => ({ default: m.PoliticaPrivacidadPage })));
const LibroReclamacionesPage = lazy(() => import("./legal/LibroReclamacionesPage").then((m) => ({ default: m.LibroReclamacionesPage })));

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>}>{children}</Suspense>;
}

function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/" style={{ color: "#111827", textDecoration: "underline" }}>Volver al inicio</Link>
    </div>
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
  const [categories, setCategories] = useState<PublicCategory[]>(getCachedPublicCategories() ?? []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const location = useLocation();
  const { items, updateQty, removeItem } = useCartStore();
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    fetchPublicCategories(api)
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
    <div className="layout-wrap">
      <Header
        categories={categories}
        cartItemsCount={cartItemsCount}
        isMobileMenuOpen={isMobileMenuOpen}
        isCartDrawerOpen={isCartDrawerOpen}
        onOpenMobileMenu={() => {
          setIsCartDrawerOpen(false);
          setIsMobileMenuOpen(true);
        }}
        onOpenCart={() => {
          setIsMobileMenuOpen(false);
          setIsCartDrawerOpen(true);
        }}
      />
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
                  <span>Envío</span>
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
        <ErrorBoundary>
          <KeepAliveRouteOutlet
            include={[/^\/$/, /^\/categoria\//]}
            max={10}
          />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "products/:productId", element: <LazyRoute><ProductDetailPage /></LazyRoute> },
      { path: "producto/:productSlug", element: <LazyRoute><ProductDetailPage /></LazyRoute> },
      { path: "categoria/:categorySlug", element: <CategoryPage /> },
      { path: "cart", element: <LazyRoute><CartPage /></LazyRoute> },
      { path: "checkout", element: <LazyRoute><CheckoutPage /></LazyRoute> },
      { path: "checkout/success", element: <LazyRoute><CheckoutSuccessPage /></LazyRoute> },
      { path: "checkout/failure", element: <LazyRoute><CheckoutFailurePage /></LazyRoute> },
      { path: "checkout/pending", element: <LazyRoute><CheckoutPendingPage /></LazyRoute> },
      { path: "terminos-de-servicio", element: <LazyRoute><TerminosDeServicioPage /></LazyRoute> },
      { path: "politica-de-reembolsos", element: <LazyRoute><PoliticaReembolsosPage /></LazyRoute> },
      { path: "politica-de-privacidad", element: <LazyRoute><PoliticaPrivacidadPage /></LazyRoute> },
      { path: "libro-de-reclamaciones", element: <LazyRoute><LibroReclamacionesPage /></LazyRoute> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
