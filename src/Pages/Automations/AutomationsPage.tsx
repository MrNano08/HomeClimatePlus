import React, { useState } from "react";
import Card from "../../Components/HomeControl/Card";
import Button from "../../Components/HomeControl/Button";
import RuleBuilder from "../../Components/Automations/RuleBuilder";
import { DEVICES_KEY, RULES_KEY, loadJSON, saveJSON } from "../../store/storage";
import type { AutomationRule, Device } from "../../types/devices";

const AutomationsPage: React.FC = () => {
  const [devices] = useState<Device[]>(() => loadJSON<Device[]>(DEVICES_KEY, []));
  const [rules, setRules] = useState<AutomationRule[]>(() => loadJSON<AutomationRule[]>(RULES_KEY, []));
  const [editing, setEditing] = useState<AutomationRule | null>(null);

  function upsertRule(r: AutomationRule) {
    const next = rules.some(x => x.id === r.id) ? rules.map(x => x.id === r.id ? r : x) : [...rules, r];
    setRules(next);
    saveJSON(RULES_KEY, next);
    setEditing(null);
  }
  function deleteRule(id: string) {
    const next = rules.filter(r => r.id !== id);
    setRules(next);
    saveJSON(RULES_KEY, next);
  }
  function toggleRule(id: string) {
    const next = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(next);
    saveJSON(RULES_KEY, next);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Automatizaciones</h1>
        <Button variant="primary" onClick={()=>setEditing({} as any)}>+ Nueva regla</Button>
      </div>

      <Card title="Mis reglas">
        <ul className="space-y-2">
          {rules.map(r => (
            <li key={r.id} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-slate-500">
                  Trigger: {r.when.type} · Acciones: {r.then.length} · {r.enabled ? "Activa" : "Inactiva"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={()=>toggleRule(r.id)}>{r.enabled ? "Desactivar" : "Activar"}</Button>
                <Button onClick={()=>setEditing(r)}>Editar</Button>
                <Button variant="danger" onClick={()=>deleteRule(r.id)}>Eliminar</Button>
              </div>
            </li>
          ))}
        </ul>
        {rules.length === 0 && <p className="text-sm text-slate-500">Aún no tienes reglas.</p>}
      </Card>

      {editing && (
        <RuleBuilder
          devices={devices}
          value={editing.id ? editing : null}
          onSave={upsertRule}
          onCancel={()=>setEditing(null)}
        />
      )}
    </div>
  );
};
export default AutomationsPage;
