import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

export default function MealBuilderCard() {
  const [ingredients, setIngredients] = useState('');
  const [preference, setPreference] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrepDays, setShowPrepDays] = useState(false);
  const [prepDays, setPrepDays] = useState([]);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setSuggestion(null);
    try {
      const data = await api.mealBuilder.suggest({
        ingredients: ingredients.trim() || undefined,
        preference: preference.trim() || undefined,
      });
      setSuggestion(data.suggestion);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogMeal() {
    if (!suggestion) return;
    try {
      for (const item of suggestion.items) {
        await api.meals.log({
          foodName: item.food,
          calories: item.calories,
          proteinG: item.protein,
          carbsG: item.carbs,
          fatG: item.fat,
        });
      }
      setSuggestion(null);
      setIngredients('');
      setPreference('');
    } catch (err) {
      setError(err.message);
    }
  }

  function togglePrepDay(day) {
    setPrepDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleAddToPrep() {
    if (!suggestion || prepDays.length === 0) return;
    try {
      const foodItems = suggestion.items.map((item) => ({
        name: item.food,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        qty: 1,
        servingUnit: item.portion,
      }));
      for (const day of prepDays) {
        await api.mealPrep.add({
          dayOfWeek: day,
          mealName: suggestion.mealName,
          foodItems,
        });
      }
      setSuggestion(null);
      setShowPrepDays(false);
      setPrepDays([]);
      setIngredients('');
      setPreference('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500">AI Meal Builder</span>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="What ingredients do you have? (optional)"
          className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
        />
        <input
          type="text"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          placeholder="Preference? e.g. high protein, low carb, quick (optional)"
          className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30"
        >
          {loading ? 'Building meal...' : 'Build My Meal'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-display text-white">{suggestion.mealName}</h4>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-white/30 hover:text-primary-500 transition-colors duration-200 shrink-0"
                title="Generate another suggestion"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {suggestion.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/60">{item.food} — {item.portion}</span>
                  <span className="text-white/40 tabular-nums">{item.calories} cal</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 text-xs text-white/40 pt-2 border-t border-white/[0.06]">
              <span>{suggestion.totalCalories} cal</span>
              <span>P:{suggestion.totalProtein}g</span>
              <span>C:{suggestion.totalCarbs}g</span>
              <span>F:{suggestion.totalFat}g</span>
            </div>

            {suggestion.tip && (
              <p className="text-xs text-primary-500/60 italic">{suggestion.tip}</p>
            )}

            {suggestion.instructions && (
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">How to prepare</p>
                <p className="text-xs text-white/50 leading-relaxed whitespace-pre-line">{suggestion.instructions}</p>
              </div>
            )}

            {remaining && (
              <p className="text-[10px] text-white/30">
                You had {remaining.calories} cal remaining before this suggestion
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleLogMeal}
                className="flex-1 py-2.5 text-xs uppercase tracking-[0.2em] bg-primary-500 text-black hover:bg-primary-400 transition-all duration-300"
              >
                Log Now
              </button>
              <button
                onClick={() => { setShowPrepDays(!showPrepDays); setPrepDays([]); }}
                className="flex-1 py-2.5 text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500/10 transition-all duration-300"
              >
                Add to Prep
              </button>
            </div>

            {showPrepDays && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 overflow-hidden"
              >
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Select days</p>
                <div className="flex gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <button
                      key={i}
                      onClick={() => togglePrepDay(i)}
                      className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-all duration-200 border ${
                        prepDays.includes(i)
                          ? 'border-primary-500/50 text-primary-500 bg-primary-500/10'
                          : 'border-white/[0.06] text-white/30'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddToPrep}
                  disabled={prepDays.length === 0}
                  className="w-full py-2 text-xs uppercase tracking-[0.2em] bg-primary-500 text-black hover:bg-primary-400 transition-all duration-300 disabled:opacity-30"
                >
                  Add to {prepDays.length} day{prepDays.length !== 1 ? 's' : ''}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
