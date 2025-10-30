import React, { useState } from "react";
import type { AutomationRule, RuleTrigger, RuleAction, Device } from "../../types/devices";
import Button from "../../Components/HomeControl/Button";
import Modal from "../../Components/HomeControl/Modal";
import Card from "../../Components/HomeControl/Card";
import { uuid } from "../../store/storage";

type Props = {
  devices: Device[];
  value?: AutomationRule | null;
  onSave: (rule: AutomationRule) => void;
  onCancel: () => void;
};

const RuleBuilder: React.FC<Props> = ({ devices, value, onSave, onCancel }) => {
  const [name, setName] = useState(value?.name ?? "");
  const [enabled, setEnabled] = useState(value?.enabled ?? true);

  // ===== Trigger =====
  const [triggerType, setTriggerType] = useState<RuleTrigger["type"]>(
    value?.when.type ?? "manual"
  );

  // Programación (días + hora) en vez de cron
  const [schedDays, setSchedDays] = useState<number[]>(
    value?.when.type === "schedule"
      ? (() => {
          const p = value.when.cron.split(" ");
          const dow = p[4] ?? "*";
          return dow === "*" ? [] : dow.split(",").map((n) => parseInt(n, 10));
        })()
      : []
  );
  const [schedTime, setSchedTime] = useState<string>(
    value?.when.type === "schedule"
      ? (() => {
          const p = value.when.cron.split(" ");
          const mm = p[0] ?? "0";
          const hh = p[1] ?? "0";
          const H = String(hh).padStart(2, "0");
          const M = String(mm).padStart(2, "0");
          return `${H}:${M}`;
        })()
      : "22:00"
  );

  const [geoEnter, setGeoEnter] = useState(
    value?.when.type === "geofence" ? !!value.when.enter : true
  );
  const [sensor, setSensor] = useState(
    value?.when.type === "sensor" ? value.when.sensor : "presence"
  );
  const [op, setOp] = useState<">" | "<" | "=">(
    value?.when.type === "sensor" ? value.when.op : ">"
  );
  const [sensorVal, setSensorVal] = useState<number>(
    value?.when.type === "sensor" ? value.when.value : 1
  );

  // ===== Acciones =====
  const [actions, setActions] = useState<RuleAction[]>(
    value?.then ?? [{ type: "notify", message: "Acción ejecutada" }]
  );

  // UI días
  const DAY_OPTS = [
    { k: "dom", v: 0 },
    { k: "lun", v: 1 },
    { k: "mar", v: 2 },
    { k: "mié", v: 3 },
    { k: "jue", v: 4 },
    { k: "vie", v: 5 },
    { k: "sáb", v: 6 },
  ];

  // Genera cron desde días + hora (mm hh * * dow)
  function cronFromDaysAndTime(days: number[], time: string) {
    const [hh, mm] = time.split(":").map((n) => parseInt(n, 10));
    const dow = days.length ? days.slice().sort((a, b) => a - b).join(",") : "*";
    return `${isNaN(mm) ? 0 : mm} ${isNaN(hh) ? 0 : hh} * * ${dow}`;
  }

  function addAction() {
    setActions((a) => [...a, { type: "notify", message: "Acción" }]);
  }
  function updateAction(i: number, partial: Partial<RuleAction>) {
    setActions((a) =>
      a.map((x, idx) => (idx === i ? ({ ...x, ...partial } as RuleAction) : x))
    );
  }
  function removeAction(i: number) {
    setActions((a) => a.filter((_, idx) => idx !== i));
  }

  function buildTrigger(): RuleTrigger {
    if (triggerType === "schedule") {
      const cron = cronFromDaysAndTime(schedDays, schedTime);
      return { type: "schedule", cron };
    }
    if (triggerType === "geofence") return { type: "geofence", enter: geoEnter };
    if (triggerType === "sensor") return { type: "sensor", sensor, op, value: sensorVal };
    return { type: "manual" };
    // (Ejecución simulada; se guardan reglas para mostrarlas/editar)
  }

  function save() {
    const rule: AutomationRule = {
      id: value?.id ?? uuid(),
      name: name || "Regla sin nombre",
      enabled,
      when: buildTrigger(),
      then: actions,
      createdAt: value?.createdAt ?? new Date().toISOString(),
    };
    onSave(rule);
  }

  return (
    <Modal open={true} onClose={onCancel} title={value ? "Editar regla" : "Nueva regla"}>
      <div className="space-y-4">
        <label className="block text-sm">
          Nombre
          <input
            className="border rounded px-3 py-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{" "}
          Activada
        </label>

        <Card title="Cuándo (trigger)">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Tipo
              <select
                className="border rounded px-2 py-1 w-full"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
              >
                <option value="manual">Manual</option>
                <option value="schedule">Programación (días y hora)</option>
                <option value="geofence">Geocerca</option>
                <option value="sensor">Sensor</option>
              </select>
            </label>

            {triggerType === "schedule" && (
              <div className="sm:col-span-2 grid gap-3">
                <div className="text-sm">Días</div>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTS.map((d) => {
                    const active = schedDays.includes(d.v);
                    return (
                      <button
                        key={d.v}
                        type="button"
                        onClick={() =>
                          setSchedDays((prev) =>
                            active ? prev.filter((x) => x !== d.v) : [...prev, d.v]
                          )
                        }
                        className={`px-3 py-1 rounded-xl border ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {d.k}
                      </button>
                    );
                  })}
                </div>

                <label className="text-sm">
                  Hora
                  <input
                    type="time"
                    className="border rounded px-2 py-1 ml-2"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                  />
                </label>
              </div>
            )}

            {triggerType === "geofence" && (
              <label className="text-sm">
                Evento
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={geoEnter ? "enter" : "leave"}
                  onChange={(e) => setGeoEnter(e.target.value === "enter")}
                >
                  <option value="enter">Entrar a casa</option>
                  <option value="leave">Salir de casa</option>
                </select>
              </label>
            )}

            {triggerType === "sensor" && (
              <>
                <label className="text-sm">
                  Sensor
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={sensor}
                    onChange={(e) => setSensor(e.target.value as any)}
                  >
                    <option value="presence">Presencia</option>
                    <option value="temp">Temperatura</option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={op}
                    onChange={(e) => setOp(e.target.value as any)}
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="=">=</option>
                  </select>
                  <input
                    className="border rounded px-2 py-1 w-24"
                    type="number"
                    value={sensorVal}
                    onChange={(e) => setSensorVal(+e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="Entonces (acciones)">
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="border rounded-xl p-2">
                <div className="flex items-center justify-between">
                  <select
                    className="border rounded px-2 py-1"
                    value={a.type}
                    onChange={(e) => updateAction(i, { type: e.target.value as any })}
                  >
                    <option value="notify">Notificar</option>
                    <option value="device.toggle">Encender/apagar dispositivo</option>
                    <option value="device.set">Ajustar dispositivo</option>
                  </select>
                  <button
                    className="text-rose-600 text-sm"
                    onClick={() => removeAction(i)}
                  >
                    Eliminar
                  </button>
                </div>

                {a.type !== "notify" && (
                  <label className="block mt-2 text-sm">
                    Dispositivo
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={(a as any).deviceId ?? ""}
                      onChange={(e) =>
                        updateAction(i, { ...(a as any), deviceId: e.target.value })
                      }
                    >
                      <option value="">Seleccione…</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.room})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {a.type === "notify" && (
                  <label className="block mt-2 text-sm">
                    Mensaje
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={(a as any).message ?? ""}
                      onChange={(e) =>
                        updateAction(i, { ...(a as any), message: e.target.value })
                      }
                    />
                  </label>
                )}
              </div>
            ))}

            <Button onClick={addAction}>+ Agregar acción</Button>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            Guardar regla
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RuleBuilder;
