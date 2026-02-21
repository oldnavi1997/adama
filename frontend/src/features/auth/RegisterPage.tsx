import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../app/api";
import { useAuthStore } from "./auth.store";

type AuthResponse = {
  user: { id: string; email: string; fullName: string; role: "CUSTOMER" | "ADMIN" };
  accessToken: string;
  refreshToken: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password })
      });
      setSession(res);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Registro</h1>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit">Crear cuenta</button>
    </form>
  );
}
