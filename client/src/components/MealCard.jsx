export default function MealCard({ meal, onDelete }) {
  const time = new Date(meal.eaten_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mb-4 group transition-all duration-200 hover:translate-x-1 cursor-default">
      {/* Top accent line */}
      <div className="w-full h-[2px] bg-primary-500/40 mb-2" />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-sm text-white truncate capitalize">{meal.food_name}</p>
            <span className="text-xs tabular-nums text-white shrink-0">{meal.calories}</span>
          </div>
          <p className="text-[10px] text-white/80 tracking-wide mt-1">
            {time} &middot; P {meal.protein_g}g &middot; C {meal.carbs_g}g &middot; F {meal.fat_g}g
          </p>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(meal.id)}
            className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-400 transition-all duration-200 ml-3 mt-0.5 shrink-0"
            title="Remove"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}
