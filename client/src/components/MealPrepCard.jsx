import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import InfoHeader from './InfoHeader.jsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealPrepCard() {
  const today = new Date().getDay(); // 0 = Sunday
  const [selectedDay, setSelectedDay] = useState(today);
  const [mealPreps, setMealPreps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logging, setLogging] = useState(null);

  // Form state
  const [formDays, setFormDays] = useState([today]);
  const [mealName, setMealName] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const fetchMealPreps = useCallback(async () => {
    try {
      const res = await api.mealPrep.get();
      setMealPreps(res.mealPreps || []);
    } catch {
      setMealPreps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMealPreps();
  }, [fetchMealPreps]);

  // Food search with debounce
  useEffect(() => {
    if (!foodQuery.trim()) { setFoodResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFoodSearching(true);
      try {
        const data = await api.food.search(foodQuery);
        setFoodResults(data.foods || []);
      } catch {
        setFoodResults([]);
      } finally {
        setFoodSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [foodQuery]);

  function handleAddFood(food) {
    setFoodItems((prev) => [...prev, { ...food, qty: 1 }]);
    setFoodQuery('');
    setFoodResults([]);
  }

  function updateFoodQty(i, qty) {
    const val = Math.max(0.25, parseFloat(qty) || 1);
    setFoodItems((prev) => prev.map((f, idx) => idx === i ? { ...f, qty: val } : f));
  }

  function removeFoodItem(i) {
    setFoodItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mealName.trim() || foodItems.length === 0 || formDays.length === 0) return;
    setSaving(true);
    try {
      const items = foodItems.map((f) => ({
        name: f.name,
        calories: Math.round(f.calories * f.qty),
        protein: Math.round(f.protein * f.qty * 10) / 10,
        carbs: Math.round(f.carbs * f.qty * 10) / 10,
        fat: Math.round(f.fat * f.qty * 10) / 10,
        qty: f.qty,
        servingUnit: f.servingUnit || 'serving',
      }));
      for (const day of formDays) {
        await api.mealPrep.add({
          dayOfWeek: day,
          mealName: mealName.trim(),
          foodItems: items,
        });
      }
      setMealName('');
      setFoodItems([]);
      setShowForm(false);
      fetchMealPreps();
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.mealPrep.delete(id);
      setMealPreps((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // silent fail
    }
  }

  async function handleLog(mealId) {
    setLogging(mealId);
    try {
      await api.mealPrep.log(mealId);
      // Refresh to reflect any changes
      fetchMealPreps();
    } catch {
      // silent fail
    } finally {
      setLogging(null);
    }
  }

  const mealsForDay = mealPreps.filter((m) => m.day_of_week === selectedDay);
  const totalCalForMeal = (meal) => {
    const items = meal.food_items || meal.foodItems || [];
    return items.reduce((s, f) => s + (f.calories || 0), 0);
  };

  return (
    <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 sm:p-8">
      {/* Header */}
      <InfoHeader title={`Meal Prep — ${DAYS[today]}`} description="Plan your meals for each day of the week. Search for foods, add them to a meal, and log prepped meals with one tap when it's time to eat." />

      {/* Day tabs */}
      <div className="flex gap-4 overflow-x-auto pb-3 mb-6">
        {DAY_ABBR.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`text-[11px] uppercase tracking-[0.15em] pb-2 border-b-2 transition-all duration-300 shrink-0 ${
              selectedDay === i
                ? 'text-primary-500 border-primary-500'
                : 'text-white/20 border-transparent hover:text-white/40'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Meals for selected day */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mealsForDay.length > 0 ? (
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {mealsForDay.map((meal) => (
            <div key={meal.id} className="py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/60 capitalize truncate">{meal.meal_name || meal.mealName}</p>
                  <p className="text-xs text-white/30 mt-1">{totalCalForMeal(meal)} cal</p>
                  {(meal.food_items || meal.foodItems || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(meal.food_items || meal.foodItems || []).map((f, idx) => (
                        <span key={idx} className="text-xs text-white/30 capitalize">
                          {f.name}{idx < (meal.food_items || meal.foodItems || []).length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  {selectedDay === today && (
                    <button
                      onClick={() => handleLog(meal.id)}
                      disabled={logging === meal.id}
                      className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-4 py-1.5 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-40"
                    >
                      {logging === meal.id ? '...' : 'Log This Meal'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="text-white/10 hover:text-red-400 transition-colors duration-300"
                    title="Delete"
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/30 text-center py-6">
          No meals prepped for {DAYS[selectedDay]}.
        </p>
      )}

      {/* Toggle form button */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setFormDays([selectedDay]); }}
          className="text-[11px] text-primary-500 hover:text-primary-400 uppercase tracking-[0.15em] mt-6 transition-colors duration-300"
        >
          + Plan Meal
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-6 mt-6 border-t border-white/[0.06]">
          {/* Day checkboxes */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25 block mb-2">Days</label>
            <div className="flex gap-1">
              {DAY_ABBR.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort())}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-all duration-200 border ${
                    formDays.includes(i)
                      ? 'border-primary-500/50 text-primary-500 bg-primary-500/10'
                      : 'border-white/[0.06] text-white/30'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Meal name */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25 block mb-2">Meal Name</label>
            <input
              type="text"
              placeholder="e.g. Breakfast"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="bg-transparent border-b border-white/[0.08] text-white/70 py-2 text-sm w-full outline-none placeholder:text-white/15 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Food search */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25 block mb-2">Search Foods</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search foods to add..."
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                className="bg-transparent border-b border-white/[0.08] text-white/70 py-2 text-sm w-full outline-none placeholder:text-white/15 focus:border-primary-500 transition-colors"
              />
              {foodSearching && (
                <div className="absolute right-0 top-2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Food search results */}
          {foodResults.length > 0 && (
            <div className="border border-white/[0.06] overflow-hidden max-h-40 overflow-y-auto">
              {foodResults.map((food, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddFood(food)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.03] border-b border-white/[0.04] last:border-0 flex justify-between items-center transition-colors"
                >
                  <div>
                    <p className="text-sm text-white/60 capitalize">{food.name}</p>
                    <p className="text-xs text-white/25">{food.servingQty} {food.servingUnit}</p>
                  </div>
                  <span className="text-xs text-primary-500 ml-2">{food.calories} cal</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected food items */}
          {foodItems.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {foodItems.map((food, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-sm text-white/60 capitalize truncate flex-1">{food.name}</span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button type="button" onClick={() => updateFoodQty(i, food.qty - (food.qty > 1 ? 1 : 0.25))} className="w-6 h-6 border border-white/[0.08] text-white/40 hover:text-white/60 flex items-center justify-center text-xs transition-colors">-</button>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={food.qty}
                      onChange={(e) => updateFoodQty(i, e.target.value)}
                      className="w-10 text-center bg-transparent text-white/70 text-sm border-none outline-none"
                    />
                    <button type="button" onClick={() => updateFoodQty(i, food.qty + 1)} className="w-6 h-6 border border-white/[0.08] text-white/40 hover:text-white/60 flex items-center justify-center text-xs transition-colors">+</button>
                    <span className="text-xs text-primary-500 w-14 text-right">{Math.round(food.calories * food.qty)}</span>
                    <button type="button" onClick={() => removeFoodItem(i)} className="text-white/10 hover:text-red-400 transition-colors">
                      <span className="text-sm leading-none">&times;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !mealName.trim() || foodItems.length === 0}
              className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-6 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30"
            >
              {saving ? 'Saving...' : 'Save Meal'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setMealName(''); setFoodItems([]); setFoodQuery(''); setFoodResults([]); }}
              className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors duration-300 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
