export default function StreakBadge({ streak = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-primary-500">{streak}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[11px] uppercase tracking-[0.15em] text-primary-500/70">day</span>
        <span className="text-[11px] uppercase tracking-[0.15em] text-primary-500/70">streak</span>
      </div>
    </div>
  );
}
