import React, { useState } from "react";
import Card from "../../Components/HomeControl/Card";
import Button from "../../Components/HomeControl/Button";
import Modal from "../../Components/HomeControl/Modal";
import { DEVICES_KEY, HOME_KEY, loadJSON, saveJSON, uuid } from "../../store/storage";
import type { Device, HomeMember, HomeProfile } from "../../types/devices";

const SettingsPage: React.FC = () => {
  const [home, setHome] = useState<HomeProfile | null>(() => loadJSON<HomeProfile | null>(HOME_KEY, null));
  const [devices] = useState<Device[]>(() => loadJSON<Device[]>(DEVICES_KEY, []));
  const favorites = new Set(home?.favorites ?? []);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");

  function toggleFav(id: string) {
    if (!home) return;
    const next = new Set(home.favorites ?? []);
    next.has(id) ? next.delete(id) : next.add(id);
    const upd = { ...home, favorites: Array.from(next) };
    setHome(upd);
    saveJSON(HOME_KEY, upd);
  }

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!home) return;
    const m: HomeMember = {
      id: uuid(),
      name: invName || "Invitado",
      email: invEmail || "sin-correo",
      role: "member",
      invitedAt: new Date().toISOString(),
      accepted: false,
    };
    const upd: HomeProfile = { ...home, members: [...(home.members ?? []), m] };
    setHome(upd);
    saveJSON(HOME_KEY, upd);
    setInviteOpen(false);
    setInvName(""); setInvEmail("");
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>

      <Card title="Favoritos">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {devices.map(d => (
            <li key={d.id} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-slate-500">{d.room} · {d.kind}</div>
              </div>
              <button
                onClick={()=>toggleFav(d.id)}
                className={`px-3 py-1 rounded ${favorites.has(d.id) ? "bg-yellow-300" : "bg-slate-100"}`}
              >
                ★
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Miembros">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">{home?.members?.length ?? 0} miembros</div>
          <Button onClick={()=>setInviteOpen(true)}>Invitar</Button>
        </div>
        <ul className="space-y-2">
          {(home?.members ?? []).map(m => (
            <li key={m.id} className="border rounded-xl px-3 py-2">
              <div className="font-medium">{m.name} <span className="text-xs text-slate-500">({m.email})</span></div>
              <div className="text-xs text-slate-500">{m.role} · {m.accepted ? "Aceptado" : "Pendiente"}</div>
            </li>
          ))}
          {(home?.members ?? []).length === 0 && <li className="text-sm text-slate-500">Aún no has invitado a nadie.</li>}
        </ul>
      </Card>

      <Modal open={inviteOpen} onClose={()=>setInviteOpen(false)} title="Invitar miembro">
        <form className="space-y-3" onSubmit={invite}>
          <label className="text-sm block">
            Nombre
            <input className="border rounded px-3 py-2 w-full" value={invName} onChange={(e)=>setInvName(e.target.value)} />
          </label>
          <label className="text-sm block">
            Correo
            <input className="border rounded px-3 py-2 w-full" value={invEmail} onChange={(e)=>setInvEmail(e.target.value)} />
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={()=>setInviteOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Invitar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default SettingsPage;
