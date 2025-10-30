// src/Pages/Home/HomePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLocalStorage } from "../../hooks/useLocalStorage";

import type {
  DeviceStatus,
  RealtimeStats,
  Horario,
  SimInput,
  SimResult,
  Scene,
} from "../../Components/HomeControl/home.types";

import type { Device, ACDevice } from "../../types/devices";
import { DEVICES_KEY, loadJSON, saveJSON } from "../../store/storage";
import ControlPanel from "../../Components/HomeControl/ControlPanel";
import RealtimeCard from "../../Components/HomeControl/RealTimeCard";
import MaintenanceCard from "../../Components/HomeControl/MaintenanceCard";
import SimulatorCard from "../../Components/HomeControl/SimulatorCard";
import PresetsCard from "../../Components/HomeControl/PresetsCard";
import HelpCard from "../../Components/HomeControl/HelpCard";
import HorariosModal from "../../Components/HomeControl/HorariosModal";
import EscenasModal from "../../Components/HomeControl/EscenasModal";
import Modal from "../../Components/HomeControl/Modal";
import Button from "../../Components/HomeControl/Button";

/* ===================== Helpers ===================== */
function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Carga dispositivos simulados desde localStorage */
function useDevices() {
  // migración por si existen datos viejos en "hc_devices"
  const legacy = loadJSON<Device[]>("hc_devices", null as any);
  if (Array.isArray(legacy) && legacy.length) {
    const current = loadJSON<Device[]>(DEVICES_KEY, []);
    if (current.length === 0) {
      saveJSON(DEVICES_KEY, legacy);
    }
    // opcional: borrar el legacy para no confundir
    localStorage.removeItem("hc_devices");
  }

  // usa SIEMPRE la clave oficial
  const [raw] = useLocalStorage<Device[]>(DEVICES_KEY, []);
  const acs = useMemo(() => raw.filter((d) => d.kind === "ac") as ACDevice[], [raw]);
  return { devices: raw, acs };
}


/* ============== Página principal (selector de A/C) ============== */
const HomePage: React.FC = () => {
  const { acs } = useDevices();
  const [selectedAcId, setSelectedAcId] = useLocalStorage<string | null>(
    "hc_selected_ac",
    acs[0]?.id ?? null,
  );

  // si cambian los ACs y ya no existe el seleccionado, resetea
  useEffect(() => {
    if (selectedAcId && !acs.some((a) => a.id === selectedAcId)) {
      setSelectedAcId(acs[0]?.id ?? null);
    }
  }, [acs, selectedAcId, setSelectedAcId]);

  return (
    <div className="hc-page w-full text-slate-900">
      {/* Selector de dispositivo (solo AC) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mi hogar</h1>
            <p className="text-slate-600 text-sm">
              Selecciona un aire para ver controles completos, simulador, escenas y programación.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {acs.length > 0 ? (
              <label className="text-sm">
                Dispositivo
                <select
                  className="ml-2 border rounded-xl px-2 py-1"
                  value={selectedAcId ?? ""}
                  onChange={(e) => setSelectedAcId(e.target.value || null)}
                >
                  {acs.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.room ? `· ${a.room}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Link
                to="/devices"
                className="inline-flex items-center px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                Agregar dispositivos
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Si no hay selección, muestra mensaje/CTA y termina */}
      {!selectedAcId || acs.length === 0 ? (
        <div className="max-w-6xl mx-auto p-4">
          <div className="mt-6 rounded-2xl border border-dashed p-6 text-center text-slate-600">
            {acs.length === 0
              ? "Aún no tienes aires. Agrega uno desde la sección Dispositivos."
              : "Selecciona un aire para administrar todas sus opciones."}
          </div>
        </div>
      ) : (
        // 👇 Remontamos todo el bloque por dispositivo
        <DeviceSuite key={selectedAcId} deviceId={selectedAcId} />
      )}
    </div>
  );
};

/* ============== Suite por dispositivo (todo scoped a deviceId) ============== */
const DeviceSuite: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const scope = (base: string) => `${base}__${deviceId}`;

  // Estado del equipo
  const [device, setDevice] = useLocalStorage<DeviceStatus>(
    scope("hc_dev_status"),
    { connected: true, acOn: true, setpoint: 23, mode: "frio" },
  );

  const [stats, setStats] = useState<RealtimeStats>({
    kwhNow: 0.8,
    co2Now: 320,
    maintenanceDue: false,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DeviceStatus | null>(null);
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

  // Horarios
  const [horarios, setHorarios] = useLocalStorage<Horario[]>(
    scope("hc_horarios"),
    [],
  );
  const [openHorarios, setOpenHorarios] = useState(false);
  const [formHorario, setFormHorario] = useState<Horario>({
    id: "",
    dias: [],
    hora: "07:00",
    setpoint: 23,
    modo: "Auto",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Geocerca
  const [geoEnabled, setGeoEnabled] = useLocalStorage<boolean>(
    scope("hc_geo_enabled"),
    false,
  );
  const [acByGeo, setAcByGeo] = useLocalStorage<boolean>(
    scope("hc_geo_state"),
    false,
  );

  // Simulador
  const [simIn, setSimIn] = useLocalStorage<SimInput>(
    scope("hc_sim_in"),
    { setpoint: 23, horasDia: 6, metros2: 20 },
  );
  const [simOut, setSimOut] = useLocalStorage<SimResult | null>(
    scope("hc_sim_out"),
    null,
  );
  const [simLoading, setSimLoading] = useState(false);

  // Mantenimiento
  const [nextMaint, setNextMaint] = useLocalStorage<string>(
    scope("hc_maint_date"),
    (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString();
    })(),
  );

  // Escenas
  const defaultScenes: Scene[] = [
    { id: "s1", nombre: "Ahorro", setpoint: 25, mode: "frio", acOn: true },
    { id: "s2", nombre: "Confort", setpoint: 22, mode: "frio", acOn: true },
    { id: "s3", nombre: "Ventilación", setpoint: 26, mode: "ventilacion", acOn: true },
  ];
  const [scenes, setScenes] = useLocalStorage<Scene[]>(
    scope("hc_scenes"),
    defaultScenes,
  );
  const [openScenes, setOpenScenes] = useState(false);
  const [sceneEditingId, setSceneEditingId] = useState<string | null>(null);
  const [sceneForm, setSceneForm] = useState<Scene>({
    id: "",
    nombre: "",
    setpoint: 23,
    mode: "frio",
    acOn: true,
  });

  // Tiempo real simulado (se ejecuta por dispositivo)
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
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Geocerca
  function enterGeofence() {
    if (!geoEnabled) return;
    setAcByGeo(true);
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: true }));
    setToast("A/C activado por geolocalización (simulado)");
  }
  function leaveGeofence() {
    if (!geoEnabled) return;
    setAcByGeo(false);
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: false }));
    setToast("A/C apagado al salir de la geocerca (simulado)");
  }

  // Simulador
  function runSimulation(e?: React.FormEvent) {
    e?.preventDefault();
    setSimLoading(true);
    setTimeout(() => {
      const baseKwh = Math.max(0.3 * simIn.metros2 * (simIn.horasDia / 8), 0.1);
      const ahorroPct = Math.max(0, Math.min(35, (simIn.setpoint - 21) * 4));
      const despues = +(baseKwh * (1 - ahorroPct / 100)).toFixed(2);
      const antes = +baseKwh.toFixed(2);
      setSimOut({ ahorroPct: +ahorroPct.toFixed(1), antesKwh: antes, despuesKwh: despues });
      setSimLoading(false);
      setToast("Simulación ejecutada");
    }, 550);
  }

  // Mantenimiento
  function generarAlerta() { setToast("Alerta de mantenimiento generada (simulado)"); }
  function posponer30() { setNextMaint((cur) => addDays(cur, 30)); }

  // Acciones globales
  const confirmTurnOff = () => {
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, acOn: false }));
    setConfirmOffOpen(false);
    setToast("Equipo apagado correctamente");
  };
  const undoLast = () => {
    if (!lastSnapshot) return;
    setDevice(lastSnapshot);
    setLastSnapshot(null);
    setToast("Se deshicieron los últimos cambios");
  };

  // Escenas
  function applyScene(s: Scene) {
    setLastSnapshot(device);
    setDevice((d) => ({ ...d, setpoint: s.setpoint, mode: s.mode, acOn: s.acOn }));
    setToast(`Escena aplicada: ${s.nombre}`);
  }
  function saveScene(e: React.FormEvent) {
    e.preventDefault();
    if (!sceneForm.nombre.trim()) {
      setToast("Asigna un nombre a la escena");
      return;
    }
    if (sceneEditingId) {
      setScenes((prev) =>
        prev.map((sc) => (sc.id === sceneEditingId ? { ...sceneForm, id: sceneEditingId } : sc)),
      );
      setSceneEditingId(null);
      setSceneForm({ id: "", nombre: "", setpoint: 23, mode: "frio", acOn: true });
      return;
    }
    const nuevo: Scene = { ...sceneForm, id: crypto.randomUUID() };
    setScenes((prev) => [...prev, nuevo]);
    setSceneForm({ id: "", nombre: "", setpoint: 23, mode: "frio", acOn: true });
  }
  function editScene(sc: Scene) {
    setSceneForm(sc);
    setSceneEditingId(sc.id);
    setOpenScenes(true);
  }
  function deleteScene(id: string) {
    if (!confirm("¿Eliminar esta escena?")) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
    if (sceneEditingId === id) {
      setSceneEditingId(null);
      setSceneForm({ id: "", nombre: "", setpoint: 23, mode: "frio", acOn: true });
    }
  }

  /* ===================== UI del dispositivo ===================== */
  return (
    <>
      <div className="grid gap-4 sm:gap-6 p-3 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        <ControlPanel
          device={device}
          setDevice={setDevice}
          setToast={setToast}
          lastSnapshot={lastSnapshot}
          setLastSnapshot={setLastSnapshot}
          setConfirmOffOpen={setConfirmOffOpen}
          geoEnabled={geoEnabled}
          setGeoEnabled={setGeoEnabled}
          acByGeo={acByGeo}
          enterGeofence={enterGeofence}
          leaveGeofence={leaveGeofence}
          openHorarios={() => setOpenHorarios(true)}
          openScenes={() => setOpenScenes(true)}
          undoLast={undoLast}
        />

        <RealtimeCard stats={stats} />

        <MaintenanceCard
          nextMaintISO={nextMaint}
          generarAlerta={generarAlerta}
          posponer30={posponer30}
        />

        <SimulatorCard
          simIn={simIn}
          setSimIn={(v) => setSimIn(v)}
          simOut={simOut}
          runSimulation={runSimulation}
          simLoading={simLoading}
        />

        <PresetsCard
          device={device}
          setDevice={setDevice}
          setToast={setToast}
          setLastSnapshot={setLastSnapshot}
        />

        <HelpCard />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Confirmar apagar */}
      <Modal
        open={confirmOffOpen}
        onClose={() => setConfirmOffOpen(false)}
        title="¿Apagar aire acondicionado?"
      >
        <p className="mb-4">
          ¿Seguro que quieres <span className="font-semibold">apagar tu equipo</span>?
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOffOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmTurnOff}>
            Apagar
          </Button>
        </div>
      </Modal>

      {/* Modal Horarios */}
      <HorariosModal
        open={openHorarios}
        onClose={() => setOpenHorarios(false)}
        horarios={horarios}
        setHorarios={setHorarios}
        formHorario={formHorario}
        setFormHorario={setFormHorario}
        editingId={editingId}
        setEditingId={setEditingId}
        setToast={setToast}
      />

      {/* Modal Escenas */}
      <EscenasModal
        open={openScenes}
        onClose={() => setOpenScenes(false)}
        scenes={scenes}
        setScenes={setScenes}
        sceneForm={sceneForm}
        setSceneForm={setSceneForm}
        sceneEditingId={sceneEditingId}
        setSceneEditingId={setSceneEditingId}
        applyScene={applyScene}
        saveScene={saveScene}
        editScene={editScene}
        deleteScene={deleteScene}
      />
    </>
  );
};

export default HomePage;
