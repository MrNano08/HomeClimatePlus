import React from "react";
import Card from "./Card";
import Button from "./Button";

const MaintenanceCard: React.FC<{
  nextMaintISO: string;
  generarAlerta: () => void;
  posponer30: () => void;
}> = ({ nextMaintISO, generarAlerta, posponer30 }) => {
  return (
    <Card title="Mantenimiento" icon="🔧">
      <p>
        Próxima revisión: <b>{new Date(nextMaintISO).toLocaleDateString()}</b>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={generarAlerta}>
          🔔 Generar alerta
        </Button>
        <Button variant="ghost" onClick={posponer30}>
          ⏭️ Posponer 30 días
        </Button>
      </div>
    </Card>
  );
};

export default MaintenanceCard;
