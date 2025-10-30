import React from "react";
import Card from "./Card";
import Button from "./Button";
import type { DeviceStatus, Mode } from "./Hometypes";

const ControlPanel: React.FC<{
  device: DeviceStatus;
  setDevice: React.Dispatch<React.SetStateAction<DeviceStatus>>;
  setToast: (s: string | null) => void;
  lastSnapshot: DeviceStatus | null;
  setLastSnapshot: React.Dispatch<React.SetStateAction<DeviceStatus | null>>;
  setConfirmOffOpen: (v: boolean) => void;

  geoEnabled: boolean;
  setGeoEnabled: (v: boolean) => void;
  acByGeo: boolean;
  enterGeofence: () => void;
  leaveGeofence: () => void;

  openHorarios: () => void;
  openScenes: () => void;
  undoLast: () => void;
}> = ({
  device,
  setDevice,
  setToast,
  lastSnapshot,
  setLastSnapshot,
  setConfirmOffOpen,
  geoEnabled,
  setGeoEnabled,
  acByGeo,
  enterGeofence,
  leaveGeofence,
  openHorarios,
  openScenes,
  undoLast,
}) => {
  const fmt = (n: number, digits = 1) =>
    new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

  return (
    <Card title="Control de Climatización" icon="🎛️" className="xl:col-span-2">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">Estado</div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  device.connected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-sm">
                {device.connected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={device.acOn ? "danger" : "success"}
              onClick={() =>
                device.acOn
                  ? setConfirmOffOpen(true)
                  : setDevice((d) => ({ ...d, acOn: true }))
              }
            >
              {device.acOn ? "Apagar" : "Encender"}
            </Button>
            <div className="text-4xl font-extrabold tabular-nums">
              {fmt(device.setpoint, 0)}°C
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setLastSnapshot(device);
                setDevice((d) => ({ ...d, setpoint: Math.max(16, d.setpoint - 1) }));
              }}
            >
              –
            </Button>
            <Button
              onClick={() => {
                setLastSnapshot(device);
                setDevice((d) => ({ ...d, setpoint: Math.min(30, d.setpoint + 1) }));
              }}
            >
              +
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["frio", "calor", "ventilacion"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setLastSnapshot(device);
                  setDevice((d) => ({ ...d, mode: m, acOn: true }));
                  setToast(
                    `Modo ${
                      m === "frio" ? "Frío" : m === "calor" ? "Calor" : "Ventilación"
                    }`
                  );
                }}
                className={`p-3 rounded-xl border-2 text-left ${
                  device.mode === m ? "border-blue-500 bg-blue-50" : "border-slate-200"
                } `}
              >
                <div className="font-semibold">
                  {m === "frio" ? "❄ Frío" : m === "calor" ? "🔥 Calor" : "💨 Ventilación"}
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

        {/* Automatización / Geocerca / Horarios / Escenas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="geo"
              type="checkbox"
              checked={geoEnabled}
              onChange={(e) => setGeoEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-slate-300 bg-white"
            />
            <label htmlFor="geo" className="font-medium">
              🌍 Control por geolocalización
            </label>
          </div>

          {geoEnabled && (
            <div className="rounded-xl border-2 border-blue-300 p-3 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-sm mb-2">Simulación de geocerca:</div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={enterGeofence}>
                  📍 Entrar a casa (simular)
                </Button>
                <Button variant="secondary" onClick={leaveGeofence}>
                  🚶 Salir de casa (simular)
                </Button>
              </div>
              <div className="mt-2 text-sm">
                Estado geocerca:{" "}
                <b className={acByGeo ? "text-emerald-600" : "text-slate-600"}>
                  {acByGeo ? "Dentro" : "Fuera"}
                </b>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={openHorarios}>⏰ Horarios</Button>
            <Button onClick={openScenes}>🎭 Escenas</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;

