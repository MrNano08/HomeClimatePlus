import React from "react";
import Card from "./Card";
import Button from "./Button";

const HelpCard: React.FC = () => {
  return (
    <Card title="Ayuda y Documentación" icon="📖">
      <div className="space-y-4">
        <p>¿Dudas? Abre la guía rápida o la documentación.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => alert("Guía rápida (demo)")}>🧭 Guía rápida</Button>
          <Button onClick={() => alert("Documentación (demo)")}>📚 Documentación</Button>
        </div>
      </div>
    </Card>
  );
};

export default HelpCard;
