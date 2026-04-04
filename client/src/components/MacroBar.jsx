const macros = [
  { key: 'protein', label: 'Protein', color: 'bg-[#FFAA00]', goal: 150 },
  { key: 'carbs',   label: 'Carbs',   color: 'bg-white/30',  goal: 200 },
  { key: 'fat',     label: 'Fat',     color: 'bg-orange-400', goal: 65  },
];

export default function MacroBar({ protein = 0, carbs = 0, fat = 0, water = 0 }) {
  const values = { protein, carbs, fat };
  const waterGoal = 8;
  const waterPct = Math.min((water / waterGoal) * 100, 100);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-primary-500 mb-3">MACROS</p>
      <div className="space-y-3">
        {macros.map((m) => {
          const pct = Math.min((values[m.key] / m.goal) * 100, 100);
          return (
            <div key={m.key} className="flex items-center gap-3">
              <span className="text-[11px] text-white w-12 shrink-0">{m.label}</span>
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
        {/* Water */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white w-12 shrink-0">Water</span>
          <div className="flex-1 h-[2px] bg-white/[0.08]">
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-white w-10 text-right shrink-0">{water}/{waterGoal}</span>
        </div>
      </div>
    </div>
  );
}
