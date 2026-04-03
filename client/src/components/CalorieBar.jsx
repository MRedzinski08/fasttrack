export default function CalorieBar({ current, goal }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const overGoal = current > goal;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500">CALORIES</span>
        <span className="text-sm tabular-nums font-light text-white">
          {current.toLocaleString()} / {goal.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-[3px] bg-white/[0.08]">
        <div
          className={`h-full transition-all duration-700 ease-out ${overGoal ? 'bg-red-400' : 'bg-[#FFAA00]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overGoal && (
        <p className="text-[10px] text-red-400/70 mt-1.5 tracking-wide">{current - goal} cal over goal</p>
      )}
    </div>
  );
}
