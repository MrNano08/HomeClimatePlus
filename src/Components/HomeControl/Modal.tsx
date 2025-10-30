import React, { useEffect, useRef } from "react";

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  const prevOverflowRef = useRef<string>("");

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!open) return;
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflowRef.current || "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 text-slate-900 shadow-xl"
        // El contenedor NO se cierra al hacer clic dentro
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo con padding interno */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
            {title}
          </h2>
        </div>

        {/* Contenido con scroll propio si es largo */}
        <div className="px-5 sm:px-6 py-4 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
