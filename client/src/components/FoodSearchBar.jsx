import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

export default function FoodSearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
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
    <div className="space-y-0">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 2 scrambled eggs and whole wheat toast"
          className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/30"
        />
        {loading && (
          <div className="absolute right-0 top-3.5 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            className="bg-[#080808] border border-white/[0.06] rounded-xl overflow-hidden mt-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {results.map((food, i) => (
              <button
                key={i}
                onClick={() => handleSelect(food)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors duration-200 border-b border-white/[0.04] last:border-0"
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <p className="text-sm text-white capitalize">{food.name}</p>
                    <p className="text-xs text-white/30">{food.servingQty} {food.servingUnit}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-display text-primary-500 tabular-nums">{food.calories} cal</p>
                    <p className="text-xs text-white/30">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {query.trim() && !loading && results.length === 0 && !error && (
        <p className="text-xs text-white/20 text-center py-3">No results -- try manual entry below</p>
      )}
    </div>
  );
}
