import React, { useEffect, useMemo, useState } from "react";

type Mode = "frio" | "calor" | "ventilacion";
interface DeviceStatus { connected: boolean; acOn: boolean; setpoint: number; mode: Mode; }
interface RealtimeStats { kwhNow: number; co2Now: number; maintenanceDue: boolean; }

const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

/* === Atajos de teclado === */
function useKeyboardShortcuts(openSearch: () => void, openHelp: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
      if (e.key === "?") { e.preventDefault(); openHelp(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openHelp, openSearch]);
}

/* === UI helpers: Card y Button === */
const Card: React.FC<React.PropsWithChildren<{ title: string; className?: string; icon?: string }>> = ({
  title, className, icon, children
}) => (
  <section
    className={`bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-6 transition-all duration-300 hover:shadow-2xl ${className ?? ""}`}
    aria-label={title}
  >
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-2xl">{icon}</span>}
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    {children}
  </section>
);

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "success" | "ghost" }
> = ({ children, className = "", variant = "ghost", ...props }) => {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
    secondary:
      "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg",
    success:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg",
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

const HomePage: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus>({ connected: true, acOn: true, setpoint: 23, mode: "frio" });
  const [stats, setStats] = useState<RealtimeStats>({ kwhNow: 0.8, co2Now: 320, maintenanceDue: false });
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DeviceStatus | null>(null);

  useKeyboardShortcuts(() => setSearchOpen(true), () => setHelpOpen(true));

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

  // Auto-cierre de toasts
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
    if (device.acOn && !confirm("¿Seguro que quieres apagar el aire?")) return;
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: !d.acOn }));
    setToast(device.acOn ? "Aire acondicionado apagado" : "Aire acondicionado encendido");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  HomeClimate<span className="text-blue-600">+</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 mt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${device.connected ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span>{device.connected ? "Dispositivos conectados" : "Sin conexión"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-semibold">{fmt(stats.kwhNow)} kWh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌱</span>
                    <span className="font-semibold">{fmt(stats.co2Now, 0)} g/h CO₂</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setSearchOpen(true)} variant="primary">
                🔍 Buscar
              </Button>
              <Button onClick={() => setHelpOpen(true)} variant="secondary">
                ❓ Ayuda
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Control Rápido */}
          <Card title="Control Rápido" icon="🎛" className="md:col-span-2">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <Button
                  onClick={toggleAC}
                  variant={device.acOn ? "success" : "ghost"}
                  className="px-8 py-4 text-lg font-bold"
                >
                  {device.acOn ? "🔛 Encendido" : "⏸ Apagado"}
                </Button>

                <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-6 py-4 shadow-inner">
                  <span className="font-semibold text-slate-700">Temperatura</span>
                  <input
                    type="number"
                    className="w-20 rounded-lg border-2 border-slate-300 px-3 py-2 bg-white font-bold text-xl text-center text-blue-600 focus:border-blue-500 focus:outline-none"
                    value={device.setpoint}
                    onChange={(e) => changeSetpoint(Number(e.target.value))}
                    min={16}
                    max={30}
                  />
                  <span className="font-semibold text-slate-600">°C</span>
                </div>
              </div>

              {/* Modos */}
              <div className="grid grid-cols-3 gap-4">
                {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => changeMode(m)}
                    className={`p-6 rounded-xl border-2 transition-all font-semibold text-lg ${
                      device.mode === m
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    aria-pressed={device.mode === m}
                  >
                    <div className="text-3xl mb-3">{m === "frio" ? "❄" : m === "calor" ? "🔥" : "💨"}</div>
                    {m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}
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
              <div className="text-5xl font-bold text-blue-600">{fmt(stats.kwhNow, 2)}</div>
              <div className="text-xl font-semibold text-slate-700">kWh</div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span>Actualizado cada ~2s</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 shadow-inner">
                <div className="text-sm text-slate-600 mb-1">Emisiones estimadas</div>
                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                  <span>🌱</span> {fmt(stats.co2Now, 0)} g CO₂/h
                </div>
              </div>
            </div>
          </Card>

          {/* Mantenimiento */}
          <Card title="Mantenimiento" icon="🔧">
            {stats.maintenanceDue ? (
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚠</span>
                  <span className="font-bold">Atención requerida</span>
                </div>
                <p className="mb-3">Filtro con horas altas de uso.</p>
                <button className="text-amber-700 underline font-medium hover:text-amber-800">Ver pasos →</button>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <span className="font-bold">Todo al día</span>
                </div>
                <p>Próxima revisión sugerida en 30 días.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button>📊 Historial</Button>
              <Button>🔔 Alertas</Button>
            </div>
          </Card>

          {/* Simulador */}
          <Card title="Simulador de Ahorro" icon="💰">
            <div className="space-y-4">
              <p className="text-slate-700">
                Estima el ahorro según tu modo y setpoint actuales.
              </p>
              <Button onClick={runSimulation} variant="primary" className="w-full py-3">
                🚀 Ejecutar simulación
              </Button>
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
                  className="w-5 h-5 rounded border-2 border-slate-300"
                />
                <label htmlFor="geo" className="font-medium">🌍 Control por geolocalización</label>
              </div>
              {geoEnabled && (
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 p-3 text-sm">
                  📍 Cuando estés cerca de casa se activará tu escenario elegido. Puedes desactivarlo en cualquier momento.
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

          {/* Ayuda */}
          <Card title="Ayuda y Documentación" icon="📖">
            <div className="space-y-4">
              <p className="text-slate-700">
                ¿Dudas? Abre la guía rápida o la documentación completa.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setHelpOpen(true)}>Ver guía</Button>
                <Button>Documentación</Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Search Modal */}
      {searchOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🔍</span> Búsqueda rápida
            </h2>
            <input
              autoFocus
              placeholder="Escribe: programación, consumo, mantenimiento…"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 bg-white text-lg focus:border-blue-500 focus:outline-none"
            />
            <p className="text-slate-600 mt-4">💡 Las sugerencias aparecerán mientras escribes.</p>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">📖</span> Guía rápida
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎛</span>
                <div>
                  <div className="font-bold text-lg">Control Rápido</div>
                  <div className="text-slate-700">Encender/Apagar y cambiar modo desde el panel principal.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-bold text-lg">Presets</div>
                  <div className="text-slate-700">Usa configuraciones predefinidas para aplicar ajustes rápidamente.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">⌨</span>
                <div>
                  <div className="font-bold text-lg">Atajos de teclado</div>
                  <div className="text-slate-700">
                    <kbd className="px-2 py-1 rounded bg-slate-100 font-mono">Ctrl+K</kbd> abre búsqueda,
                    <kbd className="px-2 py-1 rounded bg-slate-100 font-mono ml-2">?</kbd> abre ayuda.
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Button onClick={() => setHelpOpen(false)} variant="primary">✓ Entendido</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-600 max-w-md">
          <div className="flex items-center gap-3">
            <span className="text-lg">ℹ</span>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;