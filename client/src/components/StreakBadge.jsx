export default function StreakBadge({ streak = 0 }) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-lg font-bold text-orange-600 leading-tight">{streak}</p>
        <p className="text-xs text-orange-500">day streak</p>
      </div>
    </div>
  );
}
