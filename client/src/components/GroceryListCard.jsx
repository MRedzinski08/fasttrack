import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';

export default function GroceryListCard() {
  const [groceryList, setGroceryList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => {
    api.grocery.generate([0, 1, 2, 3, 4, 5, 6])
      .then((data) => {
        setGroceryList(data.groceryList || []);
        setSummary(data.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <p className="text-xs text-white/30 mb-5 leading-relaxed">Your shopping list, built automatically from your meal prep plans. Tap items to check them off.</p>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/30">Loading grocery list...</span>
        </div>
      )}

      {!loading && groceryList.length === 0 && (
        <p className="text-xs text-white/20 py-4">No items yet. Add meals to your meal prep to generate a grocery list.</p>
      )}

      {groceryList.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1"
        >
          {summary && (
            <div className="flex gap-4 text-[10px] text-white/30 uppercase tracking-wider mb-3 pb-3 border-b border-white/[0.06]">
              <span>{summary.totalItems} items</span>
              <span>{summary.totalMeals} meals</span>
              <span>{summary.totalCalories} cal total</span>
            </div>
          )}

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
    </div>
  );
}
