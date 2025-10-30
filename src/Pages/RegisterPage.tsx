import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AUTH_KEY, USERS_KEY, FIRST_LOGIN_KEY } from "../store/storage";

type User = { id: number; name: string; email: string; password: string; createdAt: string; };

function emailOk(s: string) {
  return /.+@.+\..+/.test(s);
}

const RegisterPage: React.FC = () => {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [accept, setAccept] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (name.trim().length < 2) e.push("Nombre muy corto.");
    if (!emailOk(email)) e.push("Correo inválido.");
    if (pass1.length < 6) e.push("La contraseña debe tener al menos 6 caracteres.");
    if (pass1 !== pass2) e.push("Las contraseñas no coinciden.");
    if (!accept) e.push("Debes aceptar términos.");
    return e;
  }, [name, email, pass1, pass2, accept]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (errors.length) { setToast(errors[0]); return; }
    setLoading(true);
    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      if (users.some(u => u.email === email)) {
        setToast("Ese correo ya está registrado.");
        setLoading(false);
        return;
      }
      const id = users.length ? Math.max(...users.map(u=>u.id))+1 : 1;
      const u: User = { id, name, email, password: pass1, createdAt: new Date().toISOString() };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, u]));
      localStorage.setItem(AUTH_KEY, JSON.stringify({ id: u.id, name: u.name, email: u.email }));
      localStorage.setItem(FIRST_LOGIN_KEY, "true");
      setLoading(false);
      nav({ to: "/onboarding" });
    }, 400);
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Nombre" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Contraseña" type="password" value={pass1} onChange={(e)=>setPass1(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Repite contraseña" type="password" value={pass2} onChange={(e)=>setPass2(e.target.value)} />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={accept} onChange={(e)=>setAccept(e.target.checked)} /> Acepto términos
        </label>
        <button className="w-full px-3 py-2 rounded bg-slate-900 text-white" disabled={loading}>{loading?"Creando...":"Crear cuenta"}</button>
        <div className="text-center text-sm mt-2">¿Ya tienes cuenta? <Link to="/login" className="underline">Inicia sesión</Link></div>
      </form>
      {toast && <div className="hc-toast">{toast}</div>}
    </div>
  );
};

export default RegisterPage;
