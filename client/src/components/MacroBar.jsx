const macros = [
  { key: 'protein', label: 'P', color: 'bg-[#FFAA00]', goal: 150 },
  { key: 'carbs',   label: 'C', color: 'bg-white/30',  goal: 200 },
  { key: 'fat',     label: 'F', color: 'bg-orange-400', goal: 65  },
];

export default function MacroBar({ protein = 0, carbs = 0, fat = 0 }) {
  const values = { protein, carbs, fat };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-primary-500 mb-3">MACROS</p>
      <div className="space-y-3">
        {macros.map((m) => {
          const pct = Math.min((values[m.key] / m.goal) * 100, 100);
          return (
            <div key={m.key} className="flex items-center gap-3">
              <span className="text-[11px] text-white w-3 shrink-0">{m.label}</span>
              <div className="flex-1 h-[2px] bg-white/[0.08]">
                <div
                  className={`h-full ${m.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-white w-10 text-right shrink-0">{values[m.key]}g</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
