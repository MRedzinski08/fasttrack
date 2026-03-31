import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';

const macros = [
  { key: 'protein', label: 'Protein', color: 'bg-primary-400', goal: 150 },
  { key: 'carbs',   label: 'Carbs',   color: 'bg-amber-400',   goal: 200 },
  { key: 'fat',     label: 'Fat',     color: 'bg-red-400',     goal: 65  },
];

export default function MacroBar({ protein = 0, carbs = 0, fat = 0 }) {
  const values = { protein, carbs, fat };

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-medium text-white">Macros</h3>
      {macros.map((m) => {
        const pct = Math.min((values[m.key] / m.goal) * 100, 100);
        return (
          <div key={m.key}>
            <div className="flex justify-between text-base text-white mb-0.5">
              <span>{m.label}</span>
              <span>{values[m.key]}g</span>
            </div>
            <Progress value={pct} className="gap-0">
              <ProgressTrack className="bg-[#2E2B20] h-2 rounded-full">
                <ProgressIndicator className={`${m.color} rounded-full transition-all duration-500`} />
              </ProgressTrack>
            </Progress>
          </div>
        );
      })}
    </div>
  );
}
