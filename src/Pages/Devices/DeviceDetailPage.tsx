import React, { useState } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import Card from "../../Components/HomeControl/Card";
import Button from "../../Components/HomeControl/Button";
import Modal from "../../Components/HomeControl/Modal";
import { DEVICES_KEY, loadJSON, saveJSON } from "../../store/storage";
import type { Device, ACDevice, LightDevice, PlugDevice } from "../../types/devices";

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams({ from: "/devices/$id" });
  const nav = useNavigate();
  const devices = loadJSON<Device[]>(DEVICES_KEY, []);
  const device = devices.find((d) => d.id === id) || null;

  const [state, setState] = useState<Device | null>(
    device ? (JSON.parse(JSON.stringify(device)) as Device) : null,
  );
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function persist() {
    if (!state) return;
    const updated = devices.map((d) => (d.id === state.id ? state : d));
    saveJSON(DEVICES_KEY, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function deleteIt() {
    const next = devices.filter((d) => d.id !== id);
    saveJSON(DEVICES_KEY, next);
    nav({ to: "/devices" });
  }

  if (!state) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="mb-3">Dispositivo no encontrado.</p>
        <Link to="/devices" className="underline">Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{state.name}</h1>
        <div className="flex gap-2">
          <Button variant="primary" onClick={persist}>Guardar</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Eliminar</Button>
          <Link to="/devices" className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-100">Volver</Link>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
          Cambios guardados.
        </div>
      )}

      {/* Controles por tipo */}
      {state.kind === "ac" && <ACControl value={state as ACDevice} onChange={setState as any} />}
      {state.kind === "light" && <LightControl value={state as LightDevice} onChange={setState as any} />}
      {state.kind === "plug" && <PlugControl value={state as PlugDevice} onChange={setState as any} />}

      {/* Confirmación de borrar */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Eliminar dispositivo">
        <p className="mb-3">Esta acción no se puede deshacer.</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={deleteIt}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
};

const ACControl: React.FC<{ value: ACDevice; onChange: (d: Device) => void }> = ({ value, onChange }) => {
  const [d, setD] = useState(value);
  function sync(next: Partial<ACDevice>) {
    const n = { ...d, ...next };
    setD(n); onChange(n as any);
  }
  return (
    <Card title="Aire Acondicionado">
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={d.acOn} onChange={(e)=>sync({ acOn: e.target.checked })} /> Encendido
        </label>

        <div className="flex items-center gap-3">
          <Button onClick={()=>sync({ setpoint: Math.max(16, d.setpoint-1) })}>–</Button>
          <div className="text-xl font-bold">{d.setpoint}°C</div>
          <Button onClick={()=>sync({ setpoint: Math.min(30, d.setpoint+1) })}>+</Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["frio","calor","ventilacion"] as const).map(m => (
            <button
              key={m}
              className={`px-3 py-2 rounded border ${d.mode===m ? "border-blue-500 bg-blue-50":"border-slate-200"}`}
              onClick={()=>sync({ mode: m })}
            >
              {m==="frio"?"❄ Frío": m==="calor"?"🔥 Calor":"💨 Ventilación"}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

const LightControl: React.FC<{ value: LightDevice; onChange: (d: Device) => void }> = ({ value, onChange }) => {
  const [d, setD] = useState(value);
  function sync(next: Partial<LightDevice>) {
    const n = { ...d, ...next };
    setD(n); onChange(n as any);
  }
  return (
    <Card title="Luz Inteligente">
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={d.on} onChange={(e)=>sync({ on: e.target.checked })} /> Encendida
        </label>
        <label className="block text-sm">
          Brillo: {d.brightness}%
          <input type="range" min={0} max={100} value={d.brightness} onChange={(e)=>sync({ brightness: Number(e.target.value) })} className="w-full" />
        </label>
        <label className="block text-sm">
          Temperatura de color: {d.colorTemp}K
          <input type="range" min={2700} max={6500} step={100} value={d.colorTemp} onChange={(e)=>sync({ colorTemp: Number(e.target.value) })} className="w-full" />
        </label>
      </div>
    </Card>
  );
};

const PlugControl: React.FC<{ value: PlugDevice; onChange: (d: Device) => void }> = ({ value, onChange }) => {
  const [d, setD] = useState(value);
  function sync(next: Partial<PlugDevice>) {
    const n = { ...d, ...next };
    setD(n); onChange(n as any);
  }
  return (
    <Card title="Enchufe Inteligente">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={d.on} onChange={(e)=>sync({ on: e.target.checked })} /> Encendido
      </label>
    </Card>
  );
};

export default DeviceDetailPage;
