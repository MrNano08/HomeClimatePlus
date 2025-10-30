import React from "react";

type Pt = { t: string; kwh: number };

const SimpleChart: React.FC<{ data: Pt[]; height?: number }> = ({ data, height = 140 }) => {
  const max = Math.max(1, ...data.map((d) => d.kwh));
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {data.map((d) => {
          const h = Math.round((d.kwh / max) * (height - 24));
          return (
            <div key={d.t} className="flex-1 flex flex-col items-center">
              <div className="w-full rounded-t bg-blue-500/80" style={{ height: h }} />
              <div className="text-[10px] text-slate-600 mt-1">{d.t.slice(5)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SimpleChart;
