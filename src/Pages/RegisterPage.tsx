import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";

type User = {
  id: number;
  name: string;
  email: string;
  password: string; // Solo demo/localStorage
  createdAt: string;
};

const USERS_KEY = "hc-users";
const AUTH_KEY = "hc-auth";

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]" ) as User[];
  } catch {
    return [];
  }
}
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function saveAuth(session: { id: number; name: string; email: string }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [accept, setAccept] = useState(false);
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validaciones básicas
  const errors = useMemo(() => {
    const e: string[] = [];
    if (name.trim().length < 2) e.push("Nombre muy corto.");
    if (!emailOk(email)) e.push("Correo inválido.");
    if (pass1.length < 6) e.push("La contraseña debe tener al menos 6 caracteres.");
    if (pass1 !== pass2) e.push("Las contraseñas no coinciden.");
    if (!accept) e.push("Debes aceptar los términos.");
    return e;
  }, [name, email, pass1, pass2, accept]);

  // Autocierre toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length) {
      setToast(errors[0]);
      return;
    }

    setLoading(true);
    const users = loadUsers();
    const exists = users.some((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      setLoading(false);
      setToast("Ya existe una cuenta con ese correo.");
      return;
    }

    const id = (users.at(-1)?.id ?? 0) + 1;
    const user: User = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: pass1, // Solo demo/local
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    saveAuth({ id: user.id, name: user.name, email: user.email });

    setToast("Cuenta creada con éxito.");
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/" });
    }, 500);
  };

  return (
    <div className="hc-page grid place-items-center p-4">
      <div className="w-full max-w-md hc-card">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Crear cuenta</h1>
          <Link to="/" className="hc-icon" title="Ir al inicio">
            ⟵
          </Link>
        </header>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Regístrate para comenzar a usar <span className="font-semibold">HomeClimate+</span>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="hc-input"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

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
                type={showPass1 ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                className="hc-icon absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPass1((s) => !s)}
                aria-label={showPass1 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass1 ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Repetir contraseña</label>
            <div className="relative">
              <input
                className="hc-input pr-11"
                type={showPass2 ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                className="hc-icon absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPass2((s) => !s)}
                aria-label={showPass2 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass2 ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
            <span>
              Acepto los <a className="underline" href="#" onClick={(e)=>e.preventDefault()}>términos y condiciones</a>.
            </span>
          </label>

          <button
            type="submit"
            className="hc-btn-success w-full py-2"
            disabled={loading}
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>

          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>

      {toast && <div className="hc-toast">{toast}</div>}
    </div>
  );
};

export default RegisterPage;
