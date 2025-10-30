import React, { useMemo, useState } from "react";
import Card from "../../Components/HomeControl/Card";
import { DEVICES_KEY, HOME_KEY, loadJSON } from "../../store/storage";
import type { Device, HomeProfile } from "../../types/devices";
import { Link } from "@tanstack/react-router";

const RoomsPage: React.FC = () => {
  const [home] = useState<HomeProfile | null>(() => loadJSON<HomeProfile | null>(HOME_KEY, null));
  const [devices] = useState<Device[]>(() => loadJSON<Device[]>(DEVICES_KEY, []));
  const rooms = home?.rooms ?? [];

  const perRoom = useMemo(() => {
    const map: Record<string, Device[]> = {};
    rooms.forEach(r => (map[r] = []));
    devices.forEach(d => {
      map[d.room] = map[d.room] || [];
      map[d.room].push(d);
    });
    return map;
  }, [rooms, devices]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Habitaciones</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => (
          <Card key={r} title={r}>
            <ul className="space-y-2">
              {(perRoom[r] ?? []).map(d => (
                <li key={d.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.kind}</div>
                  </div>
                  <Link to="/devices/$id" params={{ id: d.id }} className="inline-flex items-center px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow">Abrir</Link>
                </li>
              ))}
              {(perRoom[r] ?? []).length === 0 && (
                <li className="text-sm text-slate-500">Sin dispositivos.</li>
              )}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default RoomsPage;
