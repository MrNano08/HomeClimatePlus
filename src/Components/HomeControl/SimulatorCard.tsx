import React from "react";
import Card from "./Card";
import Button from "./Button";
import type { SimInput, SimResult } from "./home.types";

const SimulatorCard: React.FC<{
  simIn: SimInput;
  setSimIn: (v: SimInput) => void;
  simOut: SimResult | null;
  runSimulation: (e?: React.FormEvent) => void;
  simLoading: boolean;
}> = ({ simIn, setSimIn, simOut, runSimulation, simLoading }) => {
  return (
    <Card title="Simulador de Ahorro" icon="💰">
      <form onSubmit={runSimulation} className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Setpoint (°C)
          <input
            type="number"
            min={18}
            max={28}
            value={simIn.setpoint}
            onChange={(e) => setSimIn({ ...simIn, setpoint: Number(e.target.value) })}
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <label className="text-sm">
          Horas/día
          <input
            type="number"
            min={1}
            max={24}
            value={simIn.horasDia}
            onChange={(e) => setSimIn({ ...simIn, horasDia: Number(e.target.value) })}
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <label className="text-sm">
          Área (m²)
          <input
            type="number"
            min={5}
            max={200}
            value={simIn.metros2}
            onChange={(e) => setSimIn({ ...simIn, metros2: Number(e.target.value) })}
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" className="w-full py-3" disabled={simLoading}>
            {simLoading ? "Calculando..." : "🚀 Ejecutar simulación"}
          </Button>
        </div>
      </form>

      {simOut && (
        <div className="mt-3 border rounded-xl p-3 bg-slate-50">
          <div className="text-lg">
            Ahorro estimado: <b>{simOut.ahorroPct}%</b>
          </div>
          <div className="text-sm text-slate-700">
            Antes: <b>{simOut.antesKwh} kWh</b> · Después: <b>{simOut.despuesKwh} kWh</b>
          </div>
          <p className="text-xs text-slate-500 mt-1">Nota: cálculo de demostración (simulado).</p>
        </div>
      )}
    </Card>
  );
};

export default SimulatorCard;
