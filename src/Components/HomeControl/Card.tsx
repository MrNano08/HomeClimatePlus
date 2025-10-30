import React from "react";

const Card: React.FC<
  React.PropsWithChildren<{ title: string; className?: string; icon?: string }>
> = ({ title, className, icon, children }) => (
  <section
    className={`hc-card p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl text-slate-900 ${className ?? ""}`}
    aria-label={title}
  >
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-2xl">{icon}</span>}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </section>
);

export default Card;
