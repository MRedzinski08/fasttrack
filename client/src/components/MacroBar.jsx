const macros = [
  { key: 'protein', label: 'Protein', color: 'bg-primary-400', goal: 150 },
  { key: 'carbs',   label: 'Carbs',   color: 'bg-amber-400',   goal: 200 },
  { key: 'fat',     label: 'Fat',     color: 'bg-red-400',     goal: 65  },
];

export default function MacroBar({ protein = 0, carbs = 0, fat = 0 }) {
  const values = { protein, carbs, fat };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Macros</h3>
      {macros.map((m) => {
        const pct = Math.min((values[m.key] / m.goal) * 100, 100);
        return (
          <div key={m.key}>
            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
              <span>{m.label}</span>
              <span>{values[m.key]}g</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${m.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
