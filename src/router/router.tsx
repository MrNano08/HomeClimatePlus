import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

/* ===== Auth (localStorage) ===== */
type Session = { id: number; name: string; email: string };
const AUTH_KEY = "hc-auth";
function readSession(): Session | null {
  try {
    const v = localStorage.getItem(AUTH_KEY);
    return v ? (JSON.parse(v) as Session) : null;
  } catch {
    return null;
  }
}

/* ===== Atajos globales ===== */
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

/* ===== Layout root con header global y bus de eventos ===== */
const RootLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(() => readSession());
  const { pathname } = useLocation();

  useKeyboardShortcuts(() => setSearchOpen(true), () => setHelpOpen(true));

  // Sincronizar sesión en el header
  React.useEffect(() => {
    const update = () => setSession(readSession());
    const onStorage = (e: StorageEvent) => { if (e.key === AUTH_KEY) update(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("hc-auth-changed", update as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hc-auth-changed", update as EventListener);
    };
  }, []);

  // --- NUEVO: escuchar eventos globales para abrir modales ---
  React.useEffect(() => {
    const openHelp = () => setHelpOpen(true);
    const openSearch = () => setSearchOpen(true);
    window.addEventListener("hc-open-help", openHelp as EventListener);
    window.addEventListener("hc-open-search", openSearch as EventListener);
    // (Opcional) API global por si quieres llamarla desde consola o componentes
    (window as any).hcOpenHelp = () => window.dispatchEvent(new Event("hc-open-help"));
    (window as any).hcOpenSearch = () => window.dispatchEvent(new Event("hc-open-search"));
    return () => {
      window.removeEventListener("hc-open-help", openHelp as EventListener);
      window.removeEventListener("hc-open-search", openSearch as EventListener);
      delete (window as any).hcOpenHelp;
      delete (window as any).hcOpenSearch;
    };
  }, []);
  // -----------------------------------------------------------

  const onLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event("hc-auth-changed"));
    setSession(null);
  };

  const onLoginPage = pathname === "/login";
  const onRegisterPage = pathname === "/register";

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
                <button className="hc-btn-ghost" onClick={onLogout}>Cerrar sesión</button>
              </>
            ) : (
              <>
                {!onLoginPage && <Link to="/login" className="hc-btn-ghost">Entrar</Link>}
                {!onRegisterPage && <Link to="/register" className="hc-btn-primary">Crear cuenta</Link>}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Modal de búsqueda */}
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

      {/* Modal de ayuda */}
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
              <Item icon="🎛" title="Control Rápido">
                Enciende, apaga y cambia de modo desde el panel principal.
              </Item>
              <Item icon="⚡" title="Presets">
                Aplica configuraciones predefinidas para ajustar el equipo en un clic.
              </Item>
              <Item icon="⌨" title="Atajos de teclado">
                <kbd className="px-2 py-1 rounded bg-slate-100 font-mono">Ctrl+K</kbd> abre búsqueda,
                <kbd className="px-2 py-1 rounded bg-slate-100 font-mono ml-2">?</kbd> abre esta guía.
              </Item>
              <Item icon="🌍" title="Geolocalización">
                Activa “Control por geolocalización” para disparar escenas al acercarte a casa.
              </Item>
              <Item icon="💰" title="Simulador de ahorro">
                Estima el ahorro según el modo y setpoint actuales.
              </Item>
              <Item icon="🔧" title="Mantenimiento">
                Revisa el estado del filtro y consulta el historial/alertas.
              </Item>
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

const Item: React.FC<React.PropsWithChildren<{icon: string; title: string}>> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4">
    <span className="text-2xl">{icon}</span>
    <div>
      <div className="font-bold text-lg">{title}</div>
      <div className="text-slate-700">{children}</div>
    </div>
  </div>
);

/* ===== Rutas (con login por defecto) ===== */
const rootRoute = createRootRoute({ component: RootLayout });

const HomePage = React.lazy(() => import("../Pages/HomePage"));
const LoginPage = React.lazy(() => import("../Pages/LoginPage"));
const RegisterPage = React.lazy(() => import("../Pages/RegisterPage"));
const NotFoundPage = React.lazy(() => import("../Pages/NotFoundPage"));

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const session = readSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <HomePage />
    </React.Suspense>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => {
    const session = readSession();
    if (session) throw redirect({ to: "/" });
  },
  component: () => (
    <React.Suspense fallback={<div>Cargando…</div>}>
      <LoginPage />
    </React.Suspense>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: () => {
    const session = readSession();
    if (session) throw redirect({ to: "/" });
  },
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

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}
