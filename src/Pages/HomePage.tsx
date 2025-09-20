import React, { useEffect, useMemo, useRef, useState } from "react";

type Mode = "frio" | "calor" | "ventilacion";
interface DeviceStatus { connected: boolean; acOn: boolean; setpoint: number; mode: Mode; }
interface RealtimeStats { kwhNow: number; co2Now: number; maintenanceDue: boolean; }

const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

/* === UI helpers: Card y Button === */
const Card: React.FC<React.PropsWithChildren<{ title: string; className?: string; icon?: string }>> = ({
  title, className, icon, children
}) => (
  <section className={`hc-card p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl ${className ?? ""}`} aria-label={title}>
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-2xl">{icon}</span>}
      <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
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
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300",
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* === Modal simple y accesible === */
const Modal: React.FC<
  React.PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    title: string;
  }>
> = ({ open, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // enfoque inicial
    const t = setTimeout(() => dialogRef.current?.focus(), 0);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-bold mb-3">{title}</h2>
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

  // Modal de confirmación para apagar
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

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
    if (device.acOn) {
      // Antes era confirm(...). Ahora abrimos modal.
      setConfirmOffOpen(true);
      return;
    }
    // Encender no pide confirmación
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
    <div className="w-full">
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

              <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-inner">
                <span className="font-semibold text-slate-700 text-sm sm:text-base">Temperatura</span>
                <input
                  type="number"
                  className="w-16 sm:w-20 rounded-lg border-2 border-slate-300 px-2 sm:px-3 py-2 bg-white font-bold text-lg sm:text-xl text-center text-blue-600 focus:border-blue-500 focus:outline-none"
                  value={device.setpoint}
                  onChange={(e) => changeSetpoint(Number(e.target.value))}
                  min={16}
                  max={30}
                />
                <span className="font-semibold text-slate-600 text-sm sm:text-base">°C</span>
              </div>
            </div>

            {/* Modos — móvil en columna, ≥md tres columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={`h-24 sm:h-28 p-4 rounded-xl border-2 transition-all font-semibold text-base sm:text-lg text-left ${
                    device.mode === m
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                  aria-pressed={device.mode === m}
                >
                  <div className="text-2xl sm:text-3xl mb-2">
                    {m === "frio" ? "❄" : m === "calor" ? "🔥" : "💨"}
                  </div>
                  <div className="leading-tight">
                    {m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}
                  </div>
                </button>
              ))}
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
            <div className="text-4xl sm:text-5xl font-bold text-blue-600">{fmt(stats.kwhNow, 2)}</div>
            <div className="text-lg sm:text-xl font-semibold text-slate-700">kWh</div>
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span>Actualizado cada ~2s</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 shadow-inner">
              <div className="text-sm text-slate-600 mb-1">Emisiones estimadas</div>
              <div className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
                <span>🌱</span> {fmt(stats.co2Now, 0)} g CO₂/h
              </div>
            </div>
          </div>
        </Card>

        {/* Mantenimiento */}
        <Card title="Mantenimiento" icon="🔧">
          <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 p-4 mb-4">
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
            <p className="text-slate-700">Estima el ahorro según tu modo y setpoint actuales.</p>
            <Button onClick={runSimulation} variant="primary" className="w-full py-3">🚀 Ejecutar simulación</Button>
          </div>
        </Card>

        {/* Automatizaciones */}
        <Card title="Automatizaciones" icon="🤖">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input id="geo" type="checkbox" checked={geoEnabled}
                     onChange={(e) => setGeoEnabled(e.target.checked)}
                     className="w-5 h-5 rounded border-2 border-slate-300" />
              <label htmlFor="geo" className="font-medium">🌍 Control por geolocalización</label>
            </div>
            {geoEnabled && (
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 p-3 text-sm">
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
                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-semibold">{p.label}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {p.mode === "frio" ? "❄ Frío" : p.mode === "calor" ? "🔥 Calor" : "💨 Ventilación"}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Ayuda y Documentación */}
        <Card title="Ayuda y Documentación" icon="📖">
          <div className="space-y-4">
            <p className="text-slate-700">¿Dudas? Abre la guía rápida o la documentación.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => window.dispatchEvent(new Event("hc-open-help"))}>Ver guía</Button>
              <Button>Documentación</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Toast */}
      {toast && (
        <div className="hc-toast">
          <div className="flex items-center gap-3">
            <span className="text-lg">ℹ</span>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      {/* === Modal de confirmación para apagar === */}
      <Modal
        open={confirmOffOpen}
        onClose={() => setConfirmOffOpen(false)}
        title="¿Apagar aire acondicionado?"
      >
        <p className="text-slate-700 mb-4">
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
