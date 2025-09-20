import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

const USERS_KEY = "hc-users";
const AUTH_KEY = "hc-auth";

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as User[];
  } catch {
    return [];
  }
}

function saveAuth(session: { id: number; name: string; email: string }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  // ← Notificar al header sin recargar
  window.dispatchEvent(new Event("hc-auth-changed"));
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const users = loadUsers();
    const found = users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());

    setTimeout(() => {
      setLoading(false);
      if (!found || found.password !== password) {
        setToast("Credenciales inválidas. Verifica tu correo y contraseña.");
        return;
      }
      saveAuth({ id: found.id, name: found.name, email: found.email });
      setToast(`¡Bienvenido, ${found.name}!`);
      setTimeout(() => navigate({ to: "/" }), 200);
    }, 500);
  };

  return (
    <div className="hc-page grid place-items-center p-4">
      <div className="w-full max-w-md hc-card p-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <Link to="/" className="hc-icon" title="Ir al inicio">⟵</Link>
        </header>

        <p className="text-sm text-slate-600 mb-6">
          Accede para controlar tu <span className="font-semibold">HomeClimate+</span>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Correo</label>
            <input
              className="hc-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <div className="relative">
              <input
                className="hc-input pr-11"
                type={show ? "text" : "password"}
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="hc-icon absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="hc-btn-primary w-full py-2" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="underline">Crea una aquí</Link>
          </div>
        </form>
      </div>

      {toast && <div className="hc-toast">{toast}</div>}
    </div>
  );
};

export default LoginPage;
