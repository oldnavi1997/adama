import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../app/api";
import { useAuthStore } from "./auth.store";

type AuthResponse = {
  user: { id: string; email: string; fullName: string; role: "CUSTOMER" | "ADMIN" };
  accessToken: string;
  refreshToken: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Ingresa tu email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      if (res.user.role !== "ADMIN") {
        throw new Error("Esta cuenta no tiene permisos de admin.");
      }
      setSession(res);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-header">
          <h1 className="login-title">Adamantio</h1>
          <p className="login-subtitle">Panel de Administración</p>
        </div>

        <div className="login-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">Contraseña</label>
          <div className="login-password-wrap">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="login-eye-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar al panel"}
        </button>
      </form>
    </section>
  );
}
