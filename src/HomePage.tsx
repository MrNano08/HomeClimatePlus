import React, { useEffect, useMemo, useState } from "react";

/**
 * HomeClimate+ — HomePage
 * Esta vista aplica explícitamente las 10 heurísticas de Nielsen.
 * No usa librerías externas, solo Tailwind (clases) y React.
 * Conecta luego tus servicios reales donde veas los TODO.
 */

/* ====== Tipos mínimos para simular estado ====== */
type Mode = "frio" | "calor" | "ventilacion";
interface DeviceStatus {
  connected: boolean;
  acOn: boolean;
  setpoint: number; // °C
  mode: Mode;
}
interface RealtimeStats {
  kwhNow: number;   // consumo en tiempo real
  co2Now: number;   // gCO₂/h estimado
  maintenanceDue: boolean;
}

/* ====== Utilidades ====== */
const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

// Atajos de teclado (Ctrl+K para búsqueda; ? para ayuda)
function useKeyboardShortcuts(openSearch: () => void, openHelp: () => void) {
  useEffect(() => {
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

/* ====== Página ====== */
const HomePage: React.FC = () => {
  // Estado principal simulado (sustituir por tu store/API)
  const [device, setDevice] = useState<DeviceStatus>({
    connected: true,
    acOn: true,
    setpoint: 23,
    mode: "frio",
  });
  const [stats, setStats] = useState<RealtimeStats>({
    kwhNow: 0.8,
    co2Now: 320,
    maintenanceDue: false,
  });

  // UI states
  const [geoEnabled, setGeoEnabled] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DeviceStatus | null>(null); // Para "Deshacer"

  // ====== Flexibilidad: atajos de teclado (Heurística 7) ======
  useKeyboardShortcuts(() => setSearchOpen(true), () => setHelpOpen(true));

  // Simulación periódica de métricas en vivo (Heurística 1: visibilidad de estado)
  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => {
        const drift = device.acOn ? 0.05 : -0.03;
        const k = Math.max(0, s.kwhNow + drift);
        const co2 = Math.max(0, k * 400); // relación simplificada
        return { ...s, kwhNow: k, co2Now: co2 };
      });
    }, 2000);
    return () => clearInterval(id);
  }, [device.acOn]);

  // Ayuda a reconocer sin recordar: presets visibles (Heurística 6)
  const presets = useMemo(
    () => [
      { id: "eco", label: "Eco (24°C)", setpoint: 24, mode: "frio" as Mode },
      { id: "confort", label: "Confort (23°C)", setpoint: 23, mode: "frio" as Mode },
      { id: "ventila", label: "Ventilar", setpoint: device.setpoint, mode: "ventilacion" as Mode },
    ],
    [device.setpoint]
  );

  // === Acciones ===
  const toggleAC = () => {
    // Prevención de errores: confirmación al apagar todo (Heurística 5)
    if (device.acOn && !confirm("¿Seguro que quieres apagar el aire?")) return;
    setLastSnapshot(device); // Control y libertad: poder deshacer (Heurística 3)
    setDevice((d) => ({ ...d, acOn: !d.acOn }));
    setToast(device.acOn ? "Aire acondicionado apagado" : "Aire acondicionado encendido");
  };

  const changeMode = (m: Mode) => {
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, mode: m, acOn: true }));
    setToast(`Modo cambiado a ${m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}`);
  };

  const changeSetpoint = (v: number) => {
    // Reconocer y recuperarse: validación con mensaje claro (Heurística 9)
    if (v < 16 || v > 30) {
      setToast("El setpoint debe estar entre 16°C y 30°C");
      return;
    }
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
    // Simulador (requisito SRS) — resultado rápido y comprensible
    const ahorro = device.mode === "frio" && device.setpoint >= 24 ? 0.12 : 0.04;
    setToast(`Simulación: podrías ahorrar ~${fmt(ahorro * 100, 0)}% con esta configuración.`);
  };

  // Consistencia y estándares: mismo estilo/botones en toda la pantalla (Heurística 4)
  const Card: React.FC<React.PropsWithChildren<{ title: string; className?: string }>> = ({
    title,
    className,
    children,
  }) => (
    <section
      className={`rounded-2xl border border-slate-200 bg-white/70 dark:bg-slate-900/50 shadow-sm p-4 ${className ?? ""
        }`}
      aria-label={title}
    >
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* ====== Barra superior: estado visible del sistema (Heurística 1) ====== */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 dark:bg-slate-900/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">HomeClimate+</h1>
            <p className="text-xs opacity-70">
              {device.connected ? "Dispositivos conectados" : "Sin conexión"} · Consumo: {fmt(stats.kwhNow)} kWh · CO₂: {fmt(stats.co2Now, 0)} g/h
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Abrir búsqueda global (Ctrl+K)"
              title="Búsqueda global (Ctrl+K)"
            >
              Buscar
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Abrir ayuda (tecla ?)"
              title="Ayuda (tecla ?)"
            >
              Ayuda
            </button>
          </div>
        </div>
      </header>

      {/* ====== Contenido ====== */}
      <main className="mx-auto max-w-7xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Control rápido — coincide con el mundo real usando términos/íconos y °C (Heurística 2) */}
        <Card title="Control Rápido">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={toggleAC}
              className={`px-4 py-2 rounded-xl border ${device.acOn ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              aria-pressed={device.acOn}
            >
              {device.acOn ? "Encendido" : "Apagado"}
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm opacity-75">Setpoint</label>
              <input
                type="number"
                inputMode="numeric"
                className="w-20 rounded-lg border px-2 py-1 bg-white/70 dark:bg-slate-900/40"
                value={device.setpoint}
                onChange={(e) => changeSetpoint(Number(e.target.value))}
                aria-label="Temperatura objetivo en grados Celsius"
                min={16}
                max={30}
              />
              <span className="text-sm">°C</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-3 py-2 rounded-xl border text-sm ${device.mode === m ? "bg-sky-600 text-white border-sky-600" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                aria-pressed={device.mode === m}
              >
                {m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"}
              </button>
            ))}
          </div>

          {/* Control y libertad: deshacer cambios recientes (Heurística 3) */}
          <div className="mt-3">
            <button
              onClick={undoLast}
              disabled={!lastSnapshot}
              className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Deshacer último cambio"
            >
              Deshacer
            </button>
          </div>
        </Card>

        {/* Consumo en tiempo real — minimalista: solo lo esencial (Heurística 8) */}
        <Card title="Consumo en Tiempo Real">
          <div className="text-3xl font-bold">{fmt(stats.kwhNow, 2)} kWh</div>
          <p className="text-sm opacity-70">Actualizado en vivo cada ~2s</p>
          <div className="mt-3 text-sm">
            Emisiones estimadas: <b>{fmt(stats.co2Now, 0)} g CO₂/h</b>
          </div>
        </Card>

        {/* Mantenimiento — ayuda a reconocer y recuperarse (Heurística 9) */}
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
            <button className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
              Historial
            </button>
            <button className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
              Configurar alertas
            </button>
          </div>
        </Card>

        {/* Simulador de ahorro — coincide con requerimiento SRS */}
        <Card title="Simulador de Ahorro">
          <p className="text-sm opacity-70 mb-2">
            Estima el ahorro según tu modo y setpoint actuales.
          </p>
          <button
            onClick={runSimulation}
            className="px-4 py-2 rounded-xl border bg-sky-600 text-white border-sky-600 hover:brightness-110"
          >
            Ejecutar simulación
          </button>
        </Card>

        {/* Programación y geocercas — prevención y consistencia */}
        <Card title="Automatizaciones">
          <div className="flex items-center gap-2 mb-2">
            <input
              id="geo"
              type="checkbox"
              checked={geoEnabled}
              onChange={(e) => setGeoEnabled(e.target.checked)}
              className="size-4"
            />
            <label htmlFor="geo" className="text-sm">
              Control por geolocalización
            </label>
          </div>
          {geoEnabled && (
            <p className="text-xs rounded-lg border bg-sky-50 text-sky-900 p-2">
              Cuando estés cerca de casa se activará tu escenario elegido. Puedes desactivarlo en cualquier momento.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
              Programar horarios
            </button>
            <button className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
              Escenas
            </button>
          </div>
        </Card>

        {/* Presets visibles — reconocimiento en lugar de recuerdo (Heurística 6) */}
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
                className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm"
              >
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Ayuda y documentación accesible (Heurística 10) */}
        <Card title="Ayuda y Documentación">
          <p className="text-sm opacity-70 mb-2">
            ¿Dudas? Abre la guía rápida o la documentación completa.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Ver guía rápida
            </button>
            <a
              className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
              // TODO: reemplazar con tu ruta/URL real de docs
              href="#docs"
            >
              Documentación
            </a>
          </div>
        </Card>
      </main>

      {/* ====== Búsqueda global (Ctrl+K) — reconocimiento (Heurística 6) ====== */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3">Búsqueda rápida</h2>
            <input
              autoFocus
              placeholder="Escribe: programación, consumo, mantenimiento…"
              className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/40"
            />
            <p className="text-xs opacity-70 mt-2">Sugerencias aparecerán mientras escribes.</p>
          </div>
        </div>
      )}

      {/* ====== Modal de ayuda (Heurística 10) ====== */}
      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Guía rápida</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Encender/Apagar y cambiar modo desde “Control Rápido”.</li>
              <li>Usa presets para aplicar configuraciones comunes al instante.</li>
              <li>Atajos: <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">Ctrl</kbd>+
                <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">K</kbd> abre búsqueda, <kbd className="px-1 rounded bg-slate-200/70 text-slate-800">?</kbd> abre esta ayuda.</li>
              <li>“Automatizaciones” te permite programar horarios o activar geocercas.</li>
            </ul>
            <div className="text-right">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-3 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Toast simple para errores/confirmaciones (Heurística 9) ====== */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm shadow-lg"
          onAnimationEnd={() => setTimeout(() => setToast(null), 2200)}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default HomePage;
