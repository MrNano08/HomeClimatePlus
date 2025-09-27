import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Mode = "frio" | "calor" | "ventilacion";
type Theme = "suave" | "oscuro";

interface DeviceStatus { connected: boolean; acOn: boolean; setpoint: number; mode: Mode; }
interface RealtimeStats { kwhNow: number; co2Now: number; maintenanceDue: boolean; }

const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

/* === UI helpers: Card y Button === */
const Card: React.FC<React.PropsWithChildren<{ title: string; className?: string; icon?: string }>> = ({
  title, className, icon, children
}) => (
  <section
    className={`hc-card p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl text-slate-900 dark:text-white ${className ?? ""}`}
    aria-label={title}
  >
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-2xl">{icon}</span>}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </section>
);

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "success" | "ghost" | "danger" }
> = ({ children, className = "", variant = "ghost", ...props }) => {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
    secondary:
      "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg",
    success:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg",
    danger:
      "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg",
    ghost:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 " +
      "dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-600",
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* === Botón de tema (☀️ / 🌙) === */
const ThemeToggle: React.FC<{ theme: Theme; onToggle: () => void }> = ({ theme, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={`Cambiar a modo ${theme === "oscuro" ? "claro" : "oscuro"}`}
    title={theme === "oscuro" ? "Modo claro" : "Modo oscuro"}
    className="hc-icon bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-300 dark:border-slate-600 hover:brightness-110"
    style={{ lineHeight: 0 }}
  >
    <span className="text-xl leading-none">{theme === "oscuro" ? "☀️" : "🌙"}</span>
  </button>
);

/* === Modal === */
const Modal: React.FC<
  React.PropsWithChildren<{ open: boolean; onClose: () => void; title: string; }>
> = ({ open, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => dialogRef.current?.focus(), 0);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus>({ connected: true, acOn: true, setpoint: 23, mode: "frio" });
  const [stats, setStats] = useState<RealtimeStats>({ kwhNow: 0.8, co2Now: 320, maintenanceDue: false });
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DeviceStatus | null>(null);

  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

  /* === Tema (vars + dark:) === */
  const [theme, setTheme] = useState<Theme>("suave");
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "oscuro");
  }, [theme]);

  /* === Colocar el toggle ANTES de “Buscar” si existe === */
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>("button, a, input"));
    const searchEl = all.find((el) => {
      const txt = (el.textContent || "").toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      const ph = (el.getAttribute("placeholder") || "").toLowerCase();
      return txt.includes("buscar") || aria.includes("buscar") || ph.includes("buscar");
    });
    if (searchEl && searchEl.parentElement) {
      const wrapper = document.createElement("span");
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.marginRight = "8px";
      // Insertar ANTES del control de Buscar
      searchEl.parentElement.insertBefore(wrapper, searchEl);
      setPortalHost(wrapper);
      return () => wrapper.remove();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => {
        const drift = device.acOn ? 0.05 : -0.03;
        const k = Math.max(0, s.kwhNow + drift);
        const co2 = Math.max(0, k * 400);
        return { ...s, kwhNow: k, co2Now: co2 };
      });
    }, 2000);
    return () => clearInterval(id);
  }, [device.acOn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const presets = useMemo(
    () => [
      { id: "eco", label: "Eco (24°C)", setpoint: 24, mode: "frio" as Mode },
      { id: "confort", label: "Confort (23°C)", setpoint: 23, mode: "frio" as Mode },
      { id: "ventila", label: "Ventilar", setpoint: device.setpoint, mode: "ventilacion" as Mode },
    ],
    [device.setpoint]
  );

  const toggleAC = () => {
    if (device.acOn) { setConfirmOffOpen(true); return; }
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: true }));
    setToast("Aire acondicionado encendido");
  };

  const confirmTurnOff = () => {
    setConfirmOffOpen(false);
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: false }));
    setToast("Aire acondicionado apagado");
  };

  const changeMode = (m: Mode) => {
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, mode: m, acOn: true }));
    setToast(`Modo cambiado a ${m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}`);
  };

  const changeSetpoint = (v: number) => {
    if (v < 16 || v > 30) { setToast("El setpoint debe estar entre 16°C y 30°C"); return; }
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, setpoint: v, acOn: true }));
  };

  const undoLast = () => {
    if (!lastSnapshot) return;
    setDevice(lastSnapshot);
    setLastSnapshot(null);
    setToast("Se deshicieron los últimos cambios");
  };

  const runSimulation = () => {
    const ahorro = device.mode === "frio" && device.setpoint >= 24 ? 0.12 : 0.04;
    setToast(`Simulación: podrías ahorrar ~${fmt(ahorro * 100, 0)}% con esta configuración.`);
  };

  return (
    <div className="hc-page w-full text-slate-900 dark:text-white">
      {/* Header de respaldo si no existe “Buscar” */}
      {!portalHost && (
        <header className="hc-header px-3 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold select-none text-slate-900 dark:text-white">HomeClimate+</span>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "oscuro" ? "suave" : "oscuro")} />
        </header>
      )}

      {/* Portal ANTES del botón “Buscar” */}
      {portalHost && createPortal(
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "oscuro" ? "suave" : "oscuro")} />,
        portalHost
      )}

      <main className="p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Control Rápido */}
          <Card title="Control Rápido" icon="🎛" className="md:col-span-2">
            <div className="space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <Button
                  onClick={toggleAC}
                  variant={device.acOn ? "success" : "ghost"}
                  className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold"
                >
                  {device.acOn ? "🔛 Encendido" : "⏸ Apagado"}
                </Button>

                <div className="flex items-center gap-3 sm:gap-4 rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-inner bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                  <span className="font-semibold text-sm sm:text-base">Temperatura</span>
                  <input
                    type="number"
                    className="w-16 sm:w-20 rounded-lg border px-2 sm:px-3 py-2 bg-white dark:bg-slate-900 font-bold text-lg sm:text-xl text-center text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 border-slate-300 dark:border-slate-600 outline-none"
                    value={device.setpoint}
                    onChange={(e) => changeSetpoint(Number(e.target.value))}
                    min={16}
                    max={30}
                  />
                  <span className="font-semibold text-sm sm:text-base">°C</span>
                </div>
              </div>

              {/* Modos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => {
                  const active = device.mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => changeMode(m)}
                      className={`h-24 sm:h-28 p-4 rounded-xl border-2 transition-colors duration-200 font-semibold text-base sm:text-lg text-left ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg dark:border-blue-400 dark:bg-blue-950/40 dark:text-white"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-900 " +
                            "dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/30 dark:text-white"
                      }`}
                      aria-pressed={active}
                    >
                      <div className="text-2xl sm:text-3xl mb-2">
                        {m === "frio" ? "❄" : m === "calor" ? "🔥" : "💨"}
                      </div>
                      <div className="leading-tight">
                        {m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <Button onClick={undoLast} disabled={!lastSnapshot} className="disabled:opacity-40">
                  ↶ Deshacer
                </Button>
              </div>
            </div>
          </Card>

          {/* Consumo */}
          <Card title="Consumo en Tiempo Real" icon="⚡">
            <div className="text-center space-y-4">
              <div className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-white">{fmt(stats.kwhNow, 2)}</div>
              <div className="text-lg sm:text-xl font-semibold">kWh</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span>Actualizado cada ~2s</span>
              </div>
              <div className="rounded-xl p-4 shadow-inner bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <div className="text-sm mb-1">Emisiones estimadas</div>
                <div className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
                  <span>🌱</span> {fmt(stats.co2Now, 0)} g CO₂/h
                </div>
              </div>
            </div>
          </Card>

          {/* Mantenimiento */}
          <Card title="Mantenimiento" icon="🔧">
            <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-slate-900 p-4 mb-4 dark:border-emerald-700 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className="font-bold">Todo al día</span>
              </div>
              <p>Próxima revisión sugerida en 30 días.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button>📊 Historial</Button>
              <Button>🔔 Alertas</Button>
            </div>
          </Card>

          {/* Simulador */}
          <Card title="Simulador de Ahorro" icon="💰">
            <div className="space-y-4">
              <p>Estima el ahorro según tu modo y setpoint actuales.</p>
              <Button onClick={runSimulation} variant="primary" className="w-full py-3">🚀 Ejecutar simulación</Button>
            </div>
          </Card>

          {/* Automatizaciones */}
          <Card title="Automatizaciones" icon="🤖">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="geo"
                  type="checkbox"
                  checked={geoEnabled}
                  onChange={(e) => setGeoEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <label htmlFor="geo" className="font-medium">🌍 Control por geolocalización</label>
              </div>
              {geoEnabled && (
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 p-3 text-sm dark:border-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-white">
                  📍 Cuando estés cerca de casa se activará tu escenario elegido.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button>⏰ Horarios</Button>
                <Button>🎭 Escenas</Button>
              </div>
            </div>
          </Card>

          {/* Presets */}
          <Card title="Presets Rápidos" icon="⚡">
            <div className="space-y-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setLastSnapshot(device);
                    setDevice((d) => ({ ...d, setpoint: p.setpoint, mode: p.mode, acOn: true }));
                    setToast(`Preset aplicado: ${p.label}`);
                  }}
                  className="w-full p-4 rounded-xl border-2 transition-colors duration-200 text-left
                             border-slate-200 hover:border-blue-400 hover:bg-blue-50
                             dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20 text-slate-900 dark:text-white"
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-sm">
                    {p.mode === "frio" ? "❄ Frío" : p.mode === "calor" ? "🔥 Calor" : "💨 Ventilación"}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Ayuda */}
          <Card title="Ayuda y Documentación" icon="📖">
            <div className="space-y-4">
              <p>¿Dudas? Abre la guía rápida o la documentación.</p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => window.dispatchEvent(new Event("hc-open-help"))}>Ver guía</Button>
                <Button>Documentación</Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="hc-toast">
          <div className="flex items-center gap-3">
            <span className="text-lg">ℹ</span>
            <span className="font-medium"> {toast}</span>
          </div>
        </div>
      )}

      {/* Modal apagar */}
      <Modal open={confirmOffOpen} onClose={() => setConfirmOffOpen(false)} title="¿Apagar aire acondicionado?">
        <p className="mb-4">
          ¿Seguro que quieres <span className="font-semibold">apagar tu equipo</span>?
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOffOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmTurnOff}>Apagar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
