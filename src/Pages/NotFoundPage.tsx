import React from "react";
import { Link } from "@tanstack/react-router";

const NotFoundPage: React.FC = () => {
  return (
    <section className="hc-page min-h-dvh grid place-items-center p-4" role="main">
      <div className="hc-card w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <span aria-hidden className="text-2xl">🔎</span>
          <h1 className="text-2xl font-bold">404 — Página no encontrada</h1>
        </div>
        <p className="text-slate-600 mb-6">
          La ruta solicitada no existe o fue movida.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hc-btn-ghost"
            onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")}
          >
            ⟵ Volver
          </button>
          <Link to="/" className="hc-btn-primary">Ir al inicio</Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
