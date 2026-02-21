import { createBrowserRouter, Link, Outlet } from "react-router-dom";
import { CatalogPage } from "../features/catalog/CatalogPage";
import { CartPage } from "../features/cart/CartPage";
import { CheckoutPage } from "../features/checkout/CheckoutPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { useAuthStore } from "../features/auth/auth.store";

function Layout() {
  const { user, logout } = useAuthStore();
  return (
    <>
      <header>
        <div className="container row" style={{ justifyContent: "space-between", paddingBlock: 12 }}>
          <nav>
            <Link to="/">Catalogo</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/checkout">Checkout</Link>
          </nav>
          <nav>
            {user ? (
              <>
                <span>{user.fullName}</span>
                <button onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <Link to="/login">Ingresar</Link>
                <Link to="/register">Registro</Link>
              </>
            )}
          </nav>
        </div>
      </header>
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
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> }
    ]
  }
]);
