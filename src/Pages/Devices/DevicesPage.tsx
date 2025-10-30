// src/Pages/Devices/DevicesPage.tsx
import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import Card from "../../Components/HomeControl/Card";
import Button from "../../Components/HomeControl/Button";
import FavoriteStar from "../../Components/Common/FavoriteStar";
import { HOME_KEY, loadJSON, saveJSON, loadDevices, saveDevices } from "../../store/storage";
import type { Device as StrictDevice, HomeProfile } from "../../types/devices";
import { AddDeviceModal, ManageRoomsModal } from "./DeviceModals";

/** Tipo relajado para el listado (solo lo que mostramos) */
type ListDevice = {
  id: string;
  name: string;
  room: string;
  kind: "ac" | "light" | "plug";
  createdAt?: string;
};

type AnyDevice = StrictDevice | ListDevice;

const DevicesPage: React.FC = () => {
  // 🧠 Cargamos lo que haya (normalizado) y lo tratamos como listado relajado
  const [devices, setDevices] = useState<AnyDevice[]>(() => loadDevices() as unknown as AnyDevice[]);
  const [home, setHome] = useState<HomeProfile | null>(() =>
    loadJSON<HomeProfile | null>(HOME_KEY, null),
  );

  const [q, setQ] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  const rooms = home?.rooms ?? [];
  const favorites = new Set(home?.favorites ?? []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return devices.filter((d) => {
      const textMatch =
        !s ||
        d.name.toLowerCase().includes(s) ||
        d.room.toLowerCase().includes(s) ||
        d.kind.toLowerCase().includes(s);
      const roomMatch = roomFilter === "all" || d.room === roomFilter;
      return textMatch && roomMatch;
    });
  }, [q, roomFilter, devices]);

  function openAddDevice() {
    if (!rooms.length) setShowRooms(true);
    else setShowAdd(true);
  }

  /** Guardar un dispositivo nuevo proveniente del modal (ya viene con el tipo estricto) */
  function handleSaveDevice(d: StrictDevice) {
    const next = [...devices, d];
    setDevices(next);
    // Guardamos normalizado en la clave oficial
    saveDevices(next as unknown as StrictDevice[]);
  }

  function handleSaveRooms(newRooms: string[]) {
    if (!home) return;
    const upd = { ...home, rooms: newRooms };
    setHome(upd);
    saveJSON(HOME_KEY, upd);
  }

  function toggleFav(id: string) {
    if (!home) return;
    const next = new Set(home.favorites ?? []);
    next.has(id) ? next.delete(id) : next.add(id);
    const upd = { ...home, favorites: Array.from(next) };
    setHome(upd);
    saveJSON(HOME_KEY, upd);
  }

  // mapa habitación -> cantidad
  const usedInDevices = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => (map[d.room] = (map[d.room] || 0) + 1));
    return map;
  }, [devices]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dispositivos</h1>
          <div className="text-slate-600 text-sm">{home ? home.homeName : "Sin hogar"}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowRooms(true)}>🏠 Habitaciones</Button>
          <Button variant="primary" onClick={openAddDevice}>
            ➕ Agregar
          </Button>
        </div>
      </div>

      <Card title="Buscar y filtrar">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Buscar por nombre, habitación o tipo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 w-full"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">Todas las habitaciones</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="Listado">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <li key={d.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">#{d.id.slice(0, 6)}</div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-slate-600">
                    {d.room} · {d.kind}
                  </div>
                </div>
                <FavoriteStar active={favorites.has(d.id)} onToggle={() => toggleFav(d.id)} />
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  to="/devices/$id"
                  params={{ id: d.id }}
                  className="inline-flex items-center px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Abrir
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">No hay dispositivos.</p>
        )}
      </Card>

      {/* Modales */}
      <AddDeviceModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
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
    </div>
  );
};

export default DevicesPage;
