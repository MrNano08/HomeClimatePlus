import React from "react";

const FavoriteStar: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => {
  return (
    <button
      title={active ? "Quitar de favoritos" : "Marcar favorito"}
      onClick={onToggle}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
        active ? "bg-yellow-300 border-yellow-400" : "bg-white border-slate-300"
      }`}
    >
      ★
    </button>
  );
};
export default FavoriteStar;
