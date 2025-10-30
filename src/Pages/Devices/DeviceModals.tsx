import React, { useMemo, useState } from "react";
import Modal from "../../Components/HomeControl/Modal";
import Button from "../../Components/HomeControl/Button";
import type { DeviceKind, Device, ACDevice, LightDevice, PlugDevice } from "../../types/devices";
import { uuid } from "../../store/storage";

/* ======================== Add/Edit Device ======================== */
type AddDeviceModalProps = {
  open: boolean;
  onClose: () => void;
  rooms: string[];
  onSave: (d: Device) => void;
};

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ open, onClose, rooms, onSave }) => {
  const [kind, setKind] = useState<DeviceKind>("ac");
  const [name, setName] = useState("");
  const [room, setRoom] = useState(rooms[0] ?? "");

  const canSave = name.trim().length >= 2 && !!room;

  function createDevice(): Device {
    const base = { id: uuid(), name: name.trim(), room, kind, createdAt: new Date().toISOString() };
    if (kind === "ac") {
      return { ...(base as any), kind: "ac", acOn: true, setpoint: 23, mode: "frio" } as ACDevice;
    }
    if (kind === "light") {
      return { ...(base as any), kind: "light", on: true, brightness: 80, colorTemp: 4000 } as LightDevice;
    }
    return { ...(base as any), kind: "plug", on: false } as PlugDevice;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave(createDevice());
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar dispositivo">
      <form className="space-y-3" onSubmit={handleSave}>
        <label className="block text-sm">
          Tipo
          <select className="border rounded px-3 py-2 w-full" value={kind} onChange={(e)=>setKind(e.target.value as DeviceKind)}>
            <option value="ac">A/C</option>
            <option value="light">Luz</option>
            <option value="plug">Enchufe</option>
          </select>
        </label>

        <label className="block text-sm">
          Nombre
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ej. A/C Sala"/>
        </label>

        <label className="block text-sm">
          Habitación
          <select className="border rounded px-3 py-2 w-full" value={room} onChange={(e)=>setRoom(e.target.value)}>
            {rooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={!canSave}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ======================== Manage Rooms ======================== */
type ManageRoomsModalProps = {
  open: boolean;
  onClose: () => void;
  initialRooms: string[];
  usedInDevices: Record<string, number>; // room -> count
  onSave: (rooms: string[]) => void;
};

export const ManageRoomsModal: React.FC<ManageRoomsModalProps> = ({
  open, onClose, initialRooms, usedInDevices, onSave,
}) => {
  const [rooms, setRooms] = useState<string[]>(initialRooms);
  const [newRoom, setNewRoom] = useState("");

  const canAdd = useMemo(() => {
    const s = newRoom.trim();
    return s.length >= 2 && !rooms.includes(s);
  }, [newRoom, rooms]);

  function addRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    setRooms(prev => [...prev, newRoom.trim()]);
    setNewRoom("");
  }
  function removeRoom(name: string) {
    const used = usedInDevices[name] ?? 0;
    if (used > 0) return; // protegemos habitaciones con dispositivos asignados
    setRooms(prev => prev.filter(r => r !== name));
  }
  function save() {
    if (rooms.length === 0) return;
    onSave(rooms);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Administrar habitaciones">
      <div className="space-y-3">
        <form onSubmit={addRoom} className="flex gap-2">
          <input className="border rounded px-3 py-2 flex-1" placeholder="Nueva habitación"
                 value={newRoom} onChange={(e)=>setNewRoom(e.target.value)} />
          <Button variant="primary" type="submit" disabled={!canAdd}>Agregar</Button>
        </form>

        <ul className="space-y-2 max-h-64 overflow-auto">
          {rooms.map(r => (
            <li key={r} className="flex items-center justify-between border rounded-xl px-3 py-2">
              <div>
                <div className="font-medium">{r}</div>
                {usedInDevices[r] ? (
                  <div className="text-xs text-slate-500">{usedInDevices[r]} dispositivo(s) asignados</div>
                ) : null}
              </div>
              <Button
                variant="danger"
                className="px-2 py-1"
                onClick={()=>removeRoom(r)}
                disabled={(usedInDevices[r] ?? 0) > 0}
                title={(usedInDevices[r] ?? 0) > 0 ? "No se puede borrar: hay dispositivos aquí" : ""}
              >
                Eliminar
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" onClick={save} disabled={rooms.length === 0}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
};

/* ======================== Confirm ======================== */
type ConfirmProps = {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

export const ConfirmModal: React.FC<ConfirmProps> = ({
  open, title="Confirmar", message="¿Deseas continuar?",
  onCancel, onConfirm, confirmText="Aceptar", cancelText="Cancelar",
}) => (
  <Modal open={open} onClose={onCancel} title={title}>
    <div className="space-y-4">
      <p>{message}</p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>{cancelText}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
      </div>
    </div>
  </Modal>
);
