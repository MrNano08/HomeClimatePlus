import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import HomePage from "../Pages/Home/HomePage";
import LoginPage from "../Pages/LoginPage";
import RegisterPage from "../Pages/RegisterPage";
import OnboardingPage from "../Pages/Onboarding/OnboardingPage";
import DevicesPage from "../Pages/Devices/DevicesPage";
import DeviceDetailPage from "../Pages/Devices/DeviceDetailPage";

import AutomationsPage from "../Pages/Automations/AutomationsPage";
import RoomsPage from "../Pages/Rooms/RoomsPage";
import SettingsPage from "../Pages/Settings/SettingsPage";

import { AUTH_KEY, FIRST_LOGIN_KEY } from "../store/storage";

/* ===== Root layout with simple nav ===== */

const Root: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const authRaw = localStorage.getItem(AUTH_KEY);
  const session = authRaw ? JSON.parse(authRaw) : null;

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    nav({ to: "/login" });
  }

  const is = (p: string) =>
    loc.pathname === p || (p !== "/" && loc.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
{/* === NAVBAR NUEVO === */}
<header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
  <div className="max-w-6xl mx-auto px-3 sm:px-4">
    <div className="h-14 flex items-center justify-between">
      {/* Logo / Marca */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center shadow-md">
          <span className="text-base">❄</span>
        </div>
        <span className="font-extrabold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
          HomeClimate<span className="text-blue-600">+</span>
        </span>
      </Link>

      {/* Botón hamburguesa (móvil) */}
      <button
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={() => setMobileOpen((v: boolean) => !v)}
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Navegación (desktop) */}
      <nav className="hidden md:flex items-center gap-2 text-sm">
        <Link
          to="/"
          className={`px-3 py-2 rounded-xl transition-colors ${
            is("/") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Inicio
        </Link>

        {session && (
          <>
            <Link
              to="/rooms"
              className={`px-3 py-2 rounded-xl transition-colors ${
                is("/rooms") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Habitaciones
            </Link>
            <Link
              to="/devices"
              className={`px-3 py-2 rounded-xl transition-colors ${
                is("/devices") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Dispositivos
            </Link>
            <Link
              to="/automations"
              className={`px-3 py-2 rounded-xl transition-colors ${
                is("/automations") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Automatizaciones
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-xl transition-colors ${
                is("/settings") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Ajustes
            </Link>
          </>
        )}

        {!session && (
          <>
            <Link
              to="/login"
              className="px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:brightness-105"
            >
              Registro
            </Link>
          </>
        )}

        {session && (
          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
          >
            Salir
          </button>
        )}
      </nav>
    </div>
  </div>

  {/* Menú móvil desplegable */}
  {mobileOpen && (
    <div
      className="md:hidden border-t bg-white/95 backdrop-blur px-3 sm:px-4 py-2"
      // Cierra si haces click fuera en otras zonas (opcional si controlas a nivel Root)
    >
      <div className="flex flex-col gap-1 text-sm">
        <Link
          to="/"
          className={`px-3 py-2 rounded-xl ${
            is("/") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          Inicio
        </Link>

        {session && (
          <>
            <Link
              to="/rooms"
              className={`px-3 py-2 rounded-xl ${
                is("/rooms") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Habitaciones
            </Link>
            <Link
              to="/devices"
              className={`px-3 py-2 rounded-xl ${
                is("/devices") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Dispositivos
            </Link>
            <Link
              to="/automations"
              className={`px-3 py-2 rounded-xl ${
                is("/automations") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Automatizaciones
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-xl ${
                is("/settings") ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Ajustes
            </Link>
          </>
        )}

        {!session && (
          <>
            <Link
              to="/login"
              className="px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileOpen(false)}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:brightness-105"
              onClick={() => setMobileOpen(false)}
            >
              Registro
            </Link>
          </>
        )}

        {session && (
          <button
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            Salir
          </button>
        )}
      </div>
    </div>
  )}
</header>


      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-slate-500 py-4">
        © 2025 HomeClimate+
      </footer>

      <TanStackRouterDevtools />
    </div>
  );
};

const rootRoute = createRootRoute({
  component: Root,
});

/* ===== Guards ===== */
function requireAuth() {
  const s = localStorage.getItem(AUTH_KEY);
  if (!s) throw redirect({ to: "/login" });
}
function requireOnboardingIfFirstLogin() {
  const s = localStorage.getItem(AUTH_KEY);
  if (!s) throw redirect({ to: "/login" });
  const first = localStorage.getItem(FIRST_LOGIN_KEY);
  if (first === "true" || first === null) {
    throw redirect({ to: "/onboarding" });
  }
}

/* ===== Routes ===== */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: HomePage,
});

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rooms",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: RoomsPage,
});

const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: DevicesPage,
});

const deviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices/$id",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: DeviceDetailPage,
});

const automationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/automations",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: AutomationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  beforeLoad: () => {
    requireAuth();
    requireOnboardingIfFirstLogin();
  },
  component: SettingsPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  beforeLoad: () => {
    requireAuth();
  },
  component: OnboardingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  roomsRoute,
  devicesRoute,
  deviceRoute,
  automationsRoute,
  settingsRoute,
  onboardingRoute,
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
