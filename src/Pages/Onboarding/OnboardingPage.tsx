import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import Card from "../../Components/HomeControl/Card";
import Button from "../../Components/HomeControl/Button";

import {
  HOME_KEY,
  DEVICES_KEY,
  FIRST_LOGIN_KEY,
  loadJSON,
  saveJSON,
  getSession,
} from "../../store/storage";
import type { HomeProfile, Device } from "../../types/devices";
import { AddDeviceModal, ManageRoomsModal, ConfirmModal } from "../Devices/DeviceModals";

/* Paso: 1 Hogar • 2 Dispositivos • 3 Finalizar */
type Step = 1 | 2 | 3;

const DEFAULT_ROOMS = ["Sala", "Cuarto principal", "Cocina", "Oficina"];

const OnboardingPage: React.FC = () => {
  const nav = useNavigate();
  const session = getSession();

  // Carga inicial de datos si existen (por si el usuario vuelve al onboarding)
  const existingHome = loadJSON<HomeProfile | null>(HOME_KEY, null);
  const existingDevices = loadJSON<Device[]>(DEVICES_KEY, []);

  const [step, setStep] = useState<Step>(1);

  const [homeName, setHomeName] = useState<string>(
    existingHome?.homeName ?? "Mi hogar"
  );
  const [rooms, setRooms] = useState<string[]>(
    existingHome?.rooms?.length ? existingHome.rooms : [...DEFAULT_ROOMS]
  );

  const [devices, setDevices] = useState<Device[]>(existingDevices);

  // Modales
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [confirmDelId, setConfirmDelId] = useState<string | null>(null);

  const usedInDevices = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => (map[d.room] = (map[d.room] || 0) + 1));
    return map;
  }, [devices]);

  function handleSaveRooms(newRooms: string[]) {
    setRooms(newRooms);
  }

  function handleSaveDevice(d: Device) {
    const next = [...devices, d];
    setDevices(next);
    saveJSON(DEVICES_KEY, next);
  }

  function deleteDeviceConfirmed() {
    if (!confirmDelId) return;
    const next = devices.filter((d) => d.id !== confirmDelId);
    setDevices(next);
    saveJSON(DEVICES_KEY, next);
    setConfirmDelId(null);
  }

  function goNext() {
    if (step === 1) {
      if (!homeName.trim() || rooms.length === 0) {
        // En onboarding, en vez de alert, mostramos un modal simple.
        setShowRooms(true);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) finish();
  }

  function finish() {
    if (!session) {
      // si no hay sesión (caso raro), regresamos a login
      nav({ to: "/login" });
      return;
    }
    const now = new Date().toISOString();
    const home: HomeProfile = {
      id: existingHome?.id ?? crypto.randomUUID(),
      ownerId: session.id,
      homeName: homeName.trim() || "Mi hogar",
      rooms: rooms.length ? rooms : [...DEFAULT_ROOMS],
      createdAt: existingHome?.createdAt ?? now,
      firstConfiguredAt: now,
    };
    saveJSON(HOME_KEY, home);
    saveJSON(DEVICES_KEY, devices);
    localStorage.setItem(FIRST_LOGIN_KEY, "false");
    nav({ to: "/devices" });
  }

  function skip() {
    // Omitir guarda el nombre y habitaciones mínimas para que el flujo posterior funcione
    const home: HomeProfile = {
      id: existingHome?.id ?? crypto.randomUUID(),
      ownerId: session?.id ?? 0,
      homeName: homeName.trim() || "Mi hogar",
      rooms: rooms.length ? rooms : [...DEFAULT_ROOMS],
      createdAt: existingHome?.createdAt ?? new Date().toISOString(),
      firstConfiguredAt: null,
    };
    saveJSON(HOME_KEY, home);
    localStorage.setItem(FIRST_LOGIN_KEY, "false");
    nav({ to: "/devices" });
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Configurar mi hogar</h1>
          <p className="text-slate-600">Bienvenido a HomeClimate+. Te guiaremos en tres pasos.</p>
        </div>
        <nav className="text-sm text-slate-600 flex items-center gap-2">
          <span className={step >= 1 ? "font-semibold text-slate-900" : ""}>1. Hogar</span>
          <span>›</span>
          <span className={step >= 2 ? "font-semibold text-slate-900" : ""}>2. Dispositivos</span>
          <span>›</span>
          <span className={step >= 3 ? "font-semibold text-slate-900" : ""}>3. Finalizar</span>
        </nav>
      </div>

      {/* STEP 1: Hogar + Habitaciones */}
      {step === 1 && (
        <>
          <Card title="Datos del hogar">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Nombre del hogar
                <input
                  className="border rounded px-3 py-2 w-full mt-1"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  placeholder="Ej. Casa principal"
                />
              </label>
            </div>
          </Card>

          <Card title="Habitaciones">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-600">
                {rooms.length} habitaciones
              </div>
              <Button onClick={() => setShowRooms(true)}>Administrar habitaciones</Button>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {rooms.map((r) => (
                <li key={r} className="border rounded-xl px-3 py-2">
                  <div className="font-medium">{r}</div>
                  <div className="text-xs text-slate-500">
                    {usedInDevices[r] ? `${usedInDevices[r]} dispositivo(s)` : "Sin dispositivos"}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* STEP 2: Dispositivos */}
      {step === 2 && (
        <>
          <Card title="Agregar dispositivos">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => rooms.length ? setShowAddDevice(true) : setShowRooms(true)}>
                ➕ Agregar dispositivo
              </Button>
              <Button onClick={() => setShowRooms(true)}>🏠 Habitaciones</Button>
            </div>
          </Card>

          <Card title="Mis dispositivos">
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map((d) => (
                <li key={d.id} className="border rounded-xl p-4">
                  <div className="text-sm text-slate-500">#{d.id.slice(0, 6)}</div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-slate-600">{d.room} · {d.kind}</div>

                  <div className="mt-2 flex items-center gap-3">
                    <Link to="/devices/$id" params={{ id: d.id }} className="underline">Ver</Link>
                    <button className="text-rose-600 underline" onClick={() => setConfirmDelId(d.id)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>

            {devices.length === 0 && (
              <p className="text-sm text-slate-500">
                Aún no has agregado dispositivos. Usa el botón “Agregar dispositivo”.
              </p>
            )}
          </Card>
        </>
      )}

      {/* STEP 3: Resumen */}
      {step === 3 && (
        <Card title="Resumen">
          <div className="space-y-1">
            <p><b>Hogar:</b> {homeName}</p>
            <p><b>Habitaciones:</b> {rooms.join(", ")}</p>
            <p><b>Dispositivos:</b> {devices.length}</p>
            <p className="text-sm text-slate-500">
              Puedes agregar o modificar dispositivos luego en la sección “Dispositivos”.
            </p>
          </div>
        </Card>
      )}

      {/* Footer de acciones */}
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm underline" onClick={(e) => { e.preventDefault(); skip(); }}>
          Omitir por ahora
        </Link>
        <Button variant="success" onClick={goNext}>
          {step < 3 ? "Continuar" : "Finalizar"}
        </Button>
      </div>

      {/* Modales */}
      <AddDeviceModal
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        rooms={rooms}
        onSave={handleSaveDevice}
      />

      <ManageRoomsModal
        open={showRooms}
        onClose={() => setShowRooms(false)}
        initialRooms={rooms}
        usedInDevices={usedInDevices}
        onSave={handleSaveRooms}
      />

      <ConfirmModal
        open={!!confirmDelId}
        title="Eliminar dispositivo"
        message="¿Deseas eliminar este dispositivo? Esta acción no se puede deshacer."
        onCancel={() => setConfirmDelId(null)}
        onConfirm={deleteDeviceConfirmed}
        confirmText="Eliminar"
      />
    </div>
  );
};

export default OnboardingPage;
