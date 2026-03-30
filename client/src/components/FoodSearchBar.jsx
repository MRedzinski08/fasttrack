import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';

export default function FoodSearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.food.search(query);
        setResults(data.foods || []);
      } catch {
        setError('Food lookup failed. Try again or use manual entry.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(food) {
    onSelect(food);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 2 scrambled eggs and whole wheat toast"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {results.map((food, i) => (
            <button
              key={i}
              onClick={() => handleSelect(food)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{food.name}</p>
                  <p className="text-xs text-gray-500">{food.servingQty} {food.servingUnit}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-700">{food.calories} kcal</p>
                  <p className="text-xs text-gray-400">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && !error && (
        <p className="text-xs text-gray-400 text-center py-2">No results — try manual entry below</p>
      )}
    </div>
  );
}
