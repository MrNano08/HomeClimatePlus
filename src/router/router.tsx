import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

/* ========================
   SESIÓN (localStorage)
======================== */
type Session = { id: number; name: string; email: string };
const AUTH_KEY = "hc-auth";
function getSession(): Session | null {
  try {
    const v = localStorage.getItem(AUTH_KEY);
    return v ? (JSON.parse(v) as Session) : null;
  } catch {
    return null;
  }
}

/* ========================
   ATAJOS GLOBALES
======================== */
function useKeyboardShortcuts(openSearch: () => void, openHelp: () => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "?") {
        e.preventDefault();
        openHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openHelp, openSearch]);
}

/* ========================
   LAYOUT ROOT (Nav global)
======================== */
const RootLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const session = getSession();

  useKeyboardShortcuts(() => setSearchOpen(true), () => setHelpOpen(true));

  return (
    <div className="hc-page min-h-dvh">
      <header className="hc-header border-slate-200">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center shadow">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                HomeClimate<span className="text-blue-600">+</span>
              </h1>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <button className="hc-btn-primary" onClick={() => setSearchOpen(true)}>🔎 Buscar</button>
            <button className="hc-btn-ghost" onClick={() => setHelpOpen(true)}>❓ Ayuda</button>

            {session ? (
              <>
                <span className="text-sm ml-2">
                  👋 {session.name} <span className="opacity-70">({session.email})</span>
                </span>
                <button
                  className="hc-btn-ghost"
                  onClick={() => {
                    localStorage.removeItem(AUTH_KEY);
                    window.location.href = "/";
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hc-btn-ghost">Entrar</Link>
                <Link to="/register" className="hc-btn-primary">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Modales globales */}
      {searchOpen && (
        <div role="dialog" aria-modal="true"
             className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
             onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8"
               onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🔍</span> Búsqueda rápida
            </h2>
            <input autoFocus className="hc-input text-lg" placeholder="Escribe para buscar…" />
            <p className="text-slate-600 mt-4">💡 Las sugerencias aparecerán mientras escribes.</p>
          </div>
        </div>
      )}

      {helpOpen && (
        <div role="dialog" aria-modal="true"
             className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
             onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8"
               onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">📖</span> Guía rápida
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎛</span>
                <div>
                  <div className="font-bold text-lg">Control Rápido</div>
                  <div className="text-slate-700">Enciende, apaga y cambia modo desde el panel principal.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-bold text-lg">Presets</div>
                  <div className="text-slate-700">Aplica configuraciones predefinidas rápidamente.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">⌨</span>
                <div>
                  <div className="font-bold text-lg">Atajos</div>
                  <div className="text-slate-700">
                    <kbd className="px-2 py-1 rounded bg-slate-100 font-mono">Ctrl+K</kbd> abre búsqueda,
                    <kbd className="px-2 py-1 rounded bg-slate-100 font-mono ml-2">?</kbd> abre ayuda.
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <button className="hc-btn-primary" onClick={() => setHelpOpen(false)}>✓ Entendido</button>
            </div>
          </div>
        </div>
      )}

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
};

/* ========================
   RUTAS
======================== */
const rootRoute = createRootRoute({ component: RootLayout });

const HomePage = React.lazy(() => import("../Pages/HomePage"));
const LoginPage = React.lazy(() => import("../Pages/LoginPage"));
const RegisterPage = React.lazy(() => import("../Pages/RegisterPage"));
const NotFoundPage = React.lazy(() => import("../Pages/NotFoundPage"));

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <HomePage />
    </React.Suspense>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <LoginPage />
    </React.Suspense>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <RegisterPage />
    </React.Suspense>
  ),
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <NotFoundPage />
    </React.Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

// Tipado del router
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
