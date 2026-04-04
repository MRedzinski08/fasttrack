import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GroceryListCard() {
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [groceryList, setGroceryList] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());

  function toggleDay(day) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setCheckedItems(new Set());
    try {
      const data = await api.grocery.generate(selectedDays);
      setGroceryList(data.groceryList || []);
      setSummary(data.summary || null);
      if (data.message) setError(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(name) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500">Grocery List</span>
      </div>
      <p className="text-xs text-white/30 mb-5 leading-relaxed">Automatically generates a shopping list from your meal prep plans. Select which days to shop for, and we'll combine all ingredients into a single checklist.</p>

      {/* Day selector */}
      <div className="flex gap-1 mb-4">
        {DAYS.map((day, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-all duration-200 border ${
              selectedDays.includes(i)
                ? 'border-primary-500/50 text-primary-500 bg-primary-500/10'
                : 'border-white/[0.06] text-white/30'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || selectedDays.length === 0}
        className="w-full py-2.5 text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30 mb-4"
      >
        {loading ? 'Generating...' : 'Generate List'}
      </button>

      {error && !groceryList?.length && <p className="text-xs text-white/40">{error}</p>}

      <AnimatePresence>
        {groceryList && groceryList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {/* Summary */}
            {summary && (
              <div className="flex gap-4 text-[10px] text-white/30 uppercase tracking-wider mb-3 pb-3 border-b border-white/[0.06]">
                <span>{summary.totalItems} items</span>
                <span>{summary.totalMeals} meals</span>
                <span>{summary.totalCalories} cal total</span>
              </div>
            )}

            {/* Items */}
            {groceryList.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(item.name)}
                className="w-full flex items-center gap-3 py-2 text-left group"
              >
                <div className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-all ${
                  checkedItems.has(item.name)
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-white/20'
                }`}>
                  {checkedItems.has(item.name) && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`flex-1 min-w-0 transition-all ${checkedItems.has(item.name) ? 'opacity-30 line-through' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-sm text-white truncate">{item.name}</span>
                    <span className="text-xs text-white/30 shrink-0 ml-2 tabular-nums">x{item.quantity}</span>
                  </div>
                  <p className="text-[10px] text-white/20 truncate">{item.days.join(', ')}</p>
                </div>
              </button>
            ))}

            <div className="pt-3 border-t border-white/[0.06] text-[10px] text-white/30">
              {checkedItems.size} / {groceryList.length} checked
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
