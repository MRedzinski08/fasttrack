export default function MealCard({ meal, onDelete }) {
  const time = new Date(meal.eaten_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate capitalize">{meal.food_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {time} · P: {meal.protein_g}g · C: {meal.carbs_g}g · F: {meal.fat_g}g
        </p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <span className="text-sm font-semibold text-gray-700">{meal.calories} kcal</span>
        {onDelete && (
          <button
            onClick={() => onDelete(meal.id)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
