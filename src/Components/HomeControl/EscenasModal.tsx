import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import type { Scene, Mode } from "./home.types";

const EscenasModal: React.FC<{
  open: boolean;
  onClose: () => void;

  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;

  sceneForm: Scene;
  setSceneForm: React.Dispatch<React.SetStateAction<Scene>>;

  sceneEditingId: string | null;
  setSceneEditingId: (v: string | null) => void;

  applyScene: (s: Scene) => void;
  saveScene: (e: React.FormEvent) => void;
  editScene: (s: Scene) => void;
  deleteScene: (id: string) => void;
}> = ({
  open,
  onClose,
  scenes,
  setScenes,
  sceneForm,
  setSceneForm,
  sceneEditingId,
  setSceneEditingId,
  applyScene,
  saveScene,
  editScene,
  deleteScene,
}) => {
  return (
    <Modal open={open} onClose={onClose} title="Escenas">
      <div className="space-y-3">
        {scenes.length === 0 && <p className="text-sm text-slate-500">No has creado escenas aún.</p>}
        <ul className="space-y-2 max-h-56 overflow-auto pr-1">
          {scenes.map((sc) => (
            <li key={sc.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
              <div>
                <b>{sc.nombre}</b> · {sc.acOn ? "Encender" : "Apagar"} · {sc.setpoint}°C ·{" "}
                {sc.mode === "frio" ? "Frío" : sc.mode === "calor" ? "Calor" : "Ventilación"}
              </div>
              <div className="flex gap-2">
                <Button className="px-2 py-1" variant="success" onClick={() => applyScene(sc)}>
                  Aplicar
                </Button>
                <Button className="px-2 py-1" onClick={() => editScene(sc)}>
                  Editar
                </Button>
                <Button className="px-2 py-1" variant="danger" onClick={() => deleteScene(sc.id)}>
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={saveScene} className="space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm col-span-2">
              Nombre
              <input
                type="text"
                value={sceneForm.nombre}
                onChange={(e) => setSceneForm({ ...sceneForm, nombre: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                required
              />
            </label>
            <label className="text-sm">
              Setpoint (°C)
              <input
                type="number"
                min={16}
                max={30}
                value={sceneForm.setpoint}
                onChange={(e) => setSceneForm({ ...sceneForm, setpoint: Number(e.target.value) })}
                className="border rounded px-2 py-1 w-full"
              />
            </label>
            <label className="text-sm">
              Modo
              <select
                value={sceneForm.mode}
                onChange={(e) => setSceneForm({ ...sceneForm, mode: e.target.value as Mode })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="frio">Frío</option>
                <option value="calor">Calor</option>
                <option value="ventilacion">Ventilación</option>
              </select>
            </label>
            <label className="text-sm flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={sceneForm.acOn}
                onChange={(e) => setSceneForm({ ...sceneForm, acOn: e.target.checked })}
              />
              Encender A/C al aplicar
            </label>
            <div className="col-span-2 flex gap-2">
              <Button type="submit">{sceneEditingId ? "Guardar escena" : "Agregar escena"}</Button>
              {sceneEditingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSceneEditingId(null);
                    setSceneForm({ id: "", nombre: "", setpoint: 23, mode: "frio", acOn: true });
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

export default EscenasModal;
