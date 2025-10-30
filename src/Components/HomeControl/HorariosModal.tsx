import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import type { Horario } from "./home.types";

const HorariosModal: React.FC<{
  open: boolean;
  onClose: () => void;

  horarios: Horario[];
  setHorarios: React.Dispatch<React.SetStateAction<Horario[]>>;

  formHorario: Horario;
  setFormHorario: React.Dispatch<React.SetStateAction<Horario>>;

  editingId: string | null;
  setEditingId: (v: string | null) => void;

  setToast: (s: string | null) => void;
}> = ({
  open,
  onClose,
  horarios,
  setHorarios,
  formHorario,
  setFormHorario,
  editingId,
  setEditingId,
  setToast,
}) => {
  function saveHorario(e: React.FormEvent) {
    e.preventDefault();
    if (!formHorario.hora || formHorario.dias.length === 0) {
      setToast("Selecciona al menos 1 día y hora válida");
      return;
    }
    if (editingId) {
      setHorarios((prev) => prev.map((h) => (h.id === editingId ? { ...formHorario, id: editingId } : h)));
      setEditingId(null);
      setFormHorario({ id: "", dias: [], hora: "07:00", setpoint: 23, modo: "Auto" });
      return;
    }
    const nuevo: Horario = { ...formHorario, id: crypto.randomUUID() };
    const dup = horarios.some(
      (h) =>
        h.hora === nuevo.hora &&
        h.setpoint === nuevo.setpoint &&
        h.modo === nuevo.modo &&
        h.dias.slice().sort().join(",") === nuevo.dias.slice().sort().join(","),
    );
    if (dup) {
      setToast("Ese horario ya existe");
      return;
    }
    setHorarios((prev) => [...prev, nuevo]);
    setFormHorario({ id: "", dias: [], hora: "07:00", setpoint: 23, modo: "Auto" });
  }

  function deleteHorario(id: string) {
    if (!confirm("¿Eliminar este horario?")) return;
    setHorarios((prev) => prev.filter((h) => h.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormHorario({ id: "", dias: [], hora: "07:00", setpoint: 23, modo: "Auto" });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Horarios">
      <div className="space-y-3">
        {horarios.length === 0 && <p className="text-sm text-slate-500">No has creado horarios aún.</p>}
        <ul className="space-y-2 max-h-56 overflow-auto pr-1">
          {horarios.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
              <div>
                <b>{h.hora}</b> · {h.modo} · {h.setpoint}°C ·{" "}
                <span className="text-slate-600">{h.dias.join(", ")}</span>
              </div>
              <div className="flex gap-2">
                <Button className="px-2 py-1" onClick={() => { setFormHorario(h); setEditingId(h.id); }}>
                  Editar
                </Button>
                <Button className="px-2 py-1" variant="danger" onClick={() => deleteHorario(h.id)}>
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={saveHorario} className="space-y-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <label key={d} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={formHorario.dias.includes(d)}
                  onChange={() => {
                    setFormHorario((f) => ({
                      ...f,
                      dias: f.dias.includes(d) ? f.dias.filter((x) => x !== d) : [...f.dias, d],
                    }));
                  }}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm">
              Hora:{" "}
              <input
                type="time"
                value={formHorario.hora}
                onChange={(e) => setFormHorario((f) => ({ ...f, hora: e.target.value }))}
                className="border rounded px-2 py-1"
                required
              />
            </label>
            <label className="text-sm">
              Setpoint (°C):{" "}
              <input
                type="number"
                min={16}
                max={30}
                value={formHorario.setpoint}
                onChange={(e) => setFormHorario((f) => ({ ...f, setpoint: Number(e.target.value) }))}
                className="border rounded px-2 py-1 w-20"
                required
              />
            </label>
            <label className="text-sm">
              Modo:{" "}
              <select
                value={formHorario.modo}
                onChange={(e) =>
                  setFormHorario((f) => ({ ...f, modo: e.target.value as Horario["modo"] }))
                }
                className="border rounded px-2 py-1"
              >
                {["Frío", "Auto", "Eco"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Guardar cambios" : "Agregar horario"}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setFormHorario({ id: "", dias: [], hora: "07:00", setpoint: 23, modo: "Auto" });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default HorariosModal;
