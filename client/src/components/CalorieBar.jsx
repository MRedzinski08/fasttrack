import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';

export default function CalorieBar({ current, goal }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const overGoal = current > goal;
  const nearGoal = pct >= 80;

  const indicatorColor = overGoal ? 'bg-red-500' : nearGoal ? 'bg-amber-500' : 'bg-primary-500';

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-[#B8A860]">Calories Today</span>
        <span className={`text-sm font-medium ${overGoal ? 'text-red-500' : 'text-[#B8A860]'}`}>
          {current} / {goal} kcal
        </span>
      </div>
      <Progress value={pct} className="gap-0">
        <ProgressTrack className="bg-[#2E2B20] h-3 rounded-full">
          <ProgressIndicator className={`${indicatorColor} rounded-full transition-all duration-500`} />
        </ProgressTrack>
      </Progress>
      {overGoal && (
        <p className="text-xs text-red-500 mt-1">{current - goal} kcal over goal</p>
      )}
    </div>
  );
}
