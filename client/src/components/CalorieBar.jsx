export default function CalorieBar({ current, goal }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const overGoal = current > goal;
  const nearGoal = pct >= 80;

  const fillColor = overGoal ? 'bg-red-500' : nearGoal ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-gray-700">Calories Today</span>
        <span className={`text-sm font-semibold ${overGoal ? 'text-red-600' : 'text-gray-600'}`}>
          {current} / {goal} kcal
        </span>
      </div>
      <div className="bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overGoal && (
        <p className="text-xs text-red-500 mt-1">{current - goal} kcal over goal</p>
      )}
    </div>
  );
}
