import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 2 scrambled eggs and whole wheat toast"
          className="bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-11 px-4 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {results.length > 0 && (
        <div className="border border-[#2E2B20] rounded-xl overflow-hidden shadow-lg shadow-black/20">
          {results.map((food, i) => (
            <Button
              key={i}
              variant="ghost"
              onClick={() => handleSelect(food)}
              className="w-full text-left px-4 py-3 h-auto hover:bg-[#2E2B20] rounded-none border-b border-[#2E2B20] last:border-0 justify-start"
            >
              <div className="flex justify-between items-start w-full">
                <div>
                  <p className="text-sm font-medium text-primary-50 capitalize">{food.name}</p>
                  <p className="text-xs text-[#706530]">{food.servingQty} {food.servingUnit}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-[#B8A860]">{food.calories} kcal</p>
                  <p className="text-xs text-[#5A5228]">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && !error && (
        <p className="text-xs text-[#5A5228] text-center py-2">No results — try manual entry below</p>
      )}
    </div>
  );
}
