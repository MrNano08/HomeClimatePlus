import React, { useEffect, useMemo, useState } from "react";

type Mode = "frio" | "calor" | "ventilacion";
interface DeviceStatus { connected: boolean; acOn: boolean; setpoint: number; mode: Mode; }
interface RealtimeStats { kwhNow: number; co2Now: number; maintenanceDue: boolean; }

const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

/* === Dark/Light with localStorage === */
function useTheme() {
  const getInitial = () => {
    const saved = localStorage.getItem("hc-theme");
    if (saved === "dark" || saved === "light") return saved;
    // fallback: system
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [theme, setTheme] = useState<"dark" | "light">(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("hc-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

/* === Keyboard shortcuts === */
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

const HomePage: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus>({ connected: true, acOn: true, setpoint: 23, mode: "frio" });
  const [stats, setStats] = useState<RealtimeStats>({ kwhNow: 0.8, co2Now: 320, maintenanceDue: false });
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DeviceStatus | null>(null);

  const { theme, toggle } = useTheme();
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

  const Card: React.FC<React.PropsWithChildren<{ title: string; className?: string }>> = ({ title, className, children }) => (
    <section className={`hc-card ${className ?? ""}`} aria-label={title}>
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );

  return (
    <div className="hc-page">
      <header className="hc-header">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">HomeClimate+</h1>
            <p className="text-xs opacity-70">
              {device.connected ? "Dispositivos conectados" : "Sin conexión"} · Consumo: {fmt(stats.kwhNow)} kWh · CO₂: {fmt(stats.co2Now, 0)} g/h
            </p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="hc-icon"
            title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          <button onClick={() => setSearchOpen(true)} className="hc-btn-ghost" title="Búsqueda global (Ctrl+K)">Buscar</button>
          <button onClick={() => setHelpOpen(true)} className="hc-btn-ghost" title="Ayuda (tecla ?)">Ayuda</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Control Rápido">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button onClick={toggleAC} className={device.acOn ? "hc-btn-success" : "hc-btn-ghost"} aria-pressed={device.acOn}>
              {device.acOn ? "Encendido" : "Apagado"}
            </button>

            <div className="flex items-center gap-2">
              <span className="hc-badge">Setpoint</span>
              <input
                type="number"
                inputMode="numeric"
                className="hc-input w-24"
                value={device.setpoint}
                onChange={(e) => changeSetpoint(Number(e.target.value))}
                aria-label="Temperatura objetivo en grados Celsius"
                min={16}
                max={30}
              />
              <span className="text-sm">°C</span>
            </div>
          </div>

          {/* segmented modes */}
          <div className="hc-seg">
            {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => {
              const active = device.mode === m;
              return (
                <button key={m} onClick={() => changeMode(m)} className={active ? "is-active" : ""} aria-pressed={active}>
                  {m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <button onClick={undoLast} disabled={!lastSnapshot} className="hc-btn-ghost disabled:opacity-40">Deshacer</button>
          </div>
        </Card>

        <Card title="Consumo en Tiempo Real">
          <div className="text-[2rem] leading-none font-bold">{fmt(stats.kwhNow, 2)} kWh</div>
          <p className="text-sm opacity-70">Actualizado en vivo cada ~2s</p>
          <div className="mt-3 text-sm">Emisiones estimadas: <b>{fmt(stats.co2Now, 0)} g CO₂/h</b></div>
        </Card>

        <Card title="Mantenimiento">
          {stats.maintenanceDue ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
              Filtro con horas altas de uso. <button className="underline">Ver pasos</button>
            </div>
          ) : (
            <div className="rounded-xl border bg-emerald-50 text-emerald-900 p-3 text-sm">
              Todo al día. Próxima revisión sugerida en 30 días.
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button className="hc-btn-ghost">Historial</button>
            <button className="hc-btn-ghost">Configurar alertas</button>
          </div>
        </Card>

        <Card title="Simulador de Ahorro">
          <p className="text-sm opacity-70 mb-2">Estima el ahorro según tu modo y setpoint actuales.</p>
          <button onClick={runSimulation} className="hc-btn-primary">Ejecutar simulación</button>
        </Card>

        <Card title="Automatizaciones">
          <div className="flex items-center gap-2 mb-2">
            <input id="geo" type="checkbox" checked={geoEnabled} onChange={(e) => setGeoEnabled(e.target.checked)} className="size-4" />
            <label htmlFor="geo" className="text-sm">Control por geolocalización</label>
          </div>
          {geoEnabled && (
            <p className="text-xs rounded-lg border bg-sky-50 text-sky-900 p-2">
              Cuando estés cerca de casa se activará tu escenario elegido. Puedes desactivarlo en cualquier momento.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button className="hc-btn-ghost">Programar horarios</button>
            <button className="hc-btn-ghost">Escenas</button>
          </div>
        </Card>

        <Card title="Presets Rápidos">
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setLastSnapshot(device);
                  setDevice((d) => ({ ...d, setpoint: p.setpoint, mode: p.mode, acOn: true }));
                  setToast(`Preset aplicado: ${p.label}`);
                }}
                className="hc-btn-ghost text-left text-sm"
              >
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Ayuda y Documentación">
          <p className="text-sm opacity-70 mb-2">¿Dudas? Abre la guía rápida o la documentación completa.</p>
          <div className="flex gap-2">
            <button onClick={() => setHelpOpen(true)} className="hc-btn-ghost">Ver guía rápida</button>
            <a className="hc-btn-ghost" href="#docs">Documentación</a>
          </div>
        </Card>
      </main>

      {/* Search modal */}
      {searchOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Búsqueda rápida</h2>
            <input autoFocus placeholder="Escribe: programación, consumo, mantenimiento…" className="hc-input" />
            <p className="text-xs opacity-70 mt-2">Sugerencias aparecerán mientras escribes.</p>
          </div>
        </div>
      )}

      {/* Help modal */}
      {helpOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Guía rápida</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Encender/Apagar y cambiar modo desde “Control Rápido”.</li>
              <li>Usa presets para aplicar configuraciones comunes al instante.</li>
              <li>Atajos: <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">Ctrl</kbd>+
                <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">K</kbd> abre búsqueda, <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">?</kbd> abre esta ayuda.
              </li>
              <li>“Automatizaciones” te permite programar horarios o activar geocercas.</li>
            </ul>
            <div className="text-right">
              <button onClick={() => setHelpOpen(false)} className="hc-btn-ghost">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="hc-toast" onAnimationEnd={() => setTimeout(() => setToast(null), 2200)}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default HomePage;
