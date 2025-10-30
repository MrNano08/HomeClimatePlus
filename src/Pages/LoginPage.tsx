import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { AUTH_KEY, USERS_KEY, FIRST_LOGIN_KEY } from "../store/storage";

type User = { id: number; name: string; email: string; password: string; createdAt: string; };

function loadUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as User[]; }
  catch { return []; }
}

const LoginPage: React.FC = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const users = loadUsers();
      const u = users.find(x => x.email === email && x.password === password);
      if (!u) {
        setToast("Credenciales inválidas");
        setLoading(false);
        return;
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify({ id: u.id, name: u.name, email: u.email }));
      const first = localStorage.getItem(FIRST_LOGIN_KEY);
      if (first === null || first === "true") {
        localStorage.setItem(FIRST_LOGIN_KEY, "true");
        nav({ to: "/onboarding" });
      } else {
        nav({ to: "/" });
      }
    }, 300);
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Contraseña" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full px-3 py-2 rounded bg-slate-900 text-white" disabled={loading}>{loading?"Ingresando...":"Ingresar"}</button>
        <div className="text-center text-sm hc-muted">¿No tienes cuenta? <Link to="/register" className="underline">Crea una aquí</Link></div>
      </form>
      {toast && <div className="hc-toast">{toast}</div>}
    </div>
  );
};

export default LoginPage;
