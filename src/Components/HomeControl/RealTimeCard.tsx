import React from "react";
import Card from "./Card";
import type { RealtimeStats } from "./home.types";

const RealtimeCard: React.FC<{ stats: RealtimeStats }> = ({ stats }) => {
  const fmt = (n: number, digits = 1) =>
    new Intl.NumberFormat("es-CR", { maximumFractionDigits: digits }).format(n);

  return (
    <Card title="Consumo en Tiempo Real" icon="⚡">
      <div className="text-center space-y-4">
        <div className="text-4xl sm:text-5xl font-bold text-blue-600">
          {fmt(stats.kwhNow, 2)}
        </div>
        <div className="text-lg sm:text-xl font-semibold">kWh</div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <span>Actualizado cada ~2s (simulado)</span>
        </div>
        <div className="rounded-xl p-4 shadow-inner bg-slate-50 text-slate-900">
          <div className="text-sm mb-1">Emisiones estimadas</div>
          <div className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
            <span>🌱</span> {fmt(stats.co2Now, 0)} g CO₂/h
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RealtimeCard;
