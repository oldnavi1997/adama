import { useEffect, useState } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { api } from "./api";
import { LoginPage } from "../features/auth/LoginPage";
import { useAuthStore } from "../features/auth/auth.store";
import { AdminPage } from "../features/admin/AdminPage";

type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "ADMIN";
};

function Layout() {
  const { user, logout, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("admin_accessToken");
    const refreshToken = localStorage.getItem("admin_refreshToken");

    if (!accessToken) {
      hydrate({ user: null, accessToken: null, refreshToken: null });
      setReady(true);
      return;
    }

    api<MeResponse>("/auth/me", { auth: true })
      .then((me) => {
        if (me.role !== "ADMIN") {
          throw new Error("Not admin");
        }
        hydrate({ user: me, accessToken, refreshToken });
      })
      .catch(() => {
        localStorage.removeItem("admin_accessToken");
        localStorage.removeItem("admin_refreshToken");
        hydrate({ user: null, accessToken: null, refreshToken: null });
      })
      .finally(() => setReady(true));
  }, [hydrate]);

  if (!ready) {
    return <main className="container">Cargando...</main>;
  }

  return (
    <>
      <header>
        <div className="container row" style={{ justifyContent: "space-between", paddingBlock: 12 }}>
          <strong>Admin Platform</strong>
          <nav className="row">
            {user ? (
              <>
                <span>{user.fullName}</span>
                <button onClick={logout}>Salir</button>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

function AdminGuard() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginGuard() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginGuard /> },
      {
        element: <AdminGuard />,
        children: [{ index: true, element: <AdminPage /> }]
      }
    ]
  }
]);
