import React from "react";
import Card from "./Card";
import type { DeviceStatus, Mode } from "./home.types";

const PresetsCard: React.FC<{
  device: DeviceStatus;
  setDevice: React.Dispatch<React.SetStateAction<DeviceStatus>>;
  setToast: (s: string | null) => void;
  setLastSnapshot: React.Dispatch<React.SetStateAction<DeviceStatus | null>>;
}> = ({ device, setDevice, setToast, setLastSnapshot }) => {
  const presets = [
    { id: "p1", label: "Trabajo (24°C, frío)", setpoint: 24, mode: "frio" as Mode },
    { id: "p2", label: "Noche (22°C, frío)", setpoint: 22, mode: "frio" as Mode },
    { id: "p3", label: "Ventilar (vent.)", setpoint: 26, mode: "ventilacion" as Mode },
  ];

  return (
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
            className="w-full p-4 rounded-xl border-2 transition-colors duration-200 text-left border-slate-200 hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="font-semibold">{p.label}</div>
            <div className="text-sm">
              {p.mode === "frio" ? "❄ Frío" : p.mode === "calor" ? "🔥 Calor" : "💨 Ventilación"}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default PresetsCard;
