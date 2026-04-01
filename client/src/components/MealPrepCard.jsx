import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const glassStyle = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(10px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
};

export default function MealPrepCard() {
  const today = new Date().getDay(); // 0 = Sunday
  const [selectedDay, setSelectedDay] = useState(today);
  const [mealPreps, setMealPreps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logging, setLogging] = useState(null);

  // Form state
  const [formDay, setFormDay] = useState(today);
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
    if (!mealName.trim() || foodItems.length === 0) return;
    setSaving(true);
    try {
      await api.mealPrep.add({
        dayOfWeek: formDay,
        mealName: mealName.trim(),
        foodItems: foodItems.map((f) => ({
          name: f.name,
          calories: Math.round(f.calories * f.qty),
          protein: Math.round(f.protein * f.qty * 10) / 10,
          carbs: Math.round(f.carbs * f.qty * 10) / 10,
          fat: Math.round(f.fat * f.qty * 10) / 10,
          qty: f.qty,
          servingUnit: f.servingUnit || 'serving',
        })),
      });
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
    <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-primary-50">Meal Prep</CardTitle>
        <p className="text-sm text-[#B8A860]">{DAYS[today]}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DAY_ABBR.map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                selectedDay === i
                  ? i === today
                    ? 'bg-primary-500 text-gray-900'
                    : 'bg-white/10 text-primary-50'
                  : i === today
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Meals for selected day */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mealsForDay.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {mealsForDay.map((meal) => (
              <div key={meal.id} className="bg-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-50 capitalize truncate">{meal.meal_name || meal.mealName}</p>
                    <p className="text-xs text-[#5A5228]">{totalCalForMeal(meal)} kcal</p>
                    {(meal.food_items || meal.foodItems || []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(meal.food_items || meal.foodItems || []).map((f, idx) => (
                          <span key={idx} className="text-xs text-white/40 capitalize">
                            {f.name}{idx < (meal.food_items || meal.foodItems || []).length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {selectedDay === today && (
                      <Button
                        size="sm"
                        onClick={() => handleLog(meal.id)}
                        disabled={logging === meal.id}
                        className="bg-primary-500 hover:bg-primary-600 text-gray-900 text-xs px-2 py-1 h-auto"
                      >
                        {logging === meal.id ? '...' : 'Log This Meal'}
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(meal.id)}
                      className="text-primary-500 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5A5228] text-center py-4">
            No meals prepped for {DAYS[selectedDay]}.
          </p>
        )}

        {/* Toggle form button */}
        {!showForm ? (
          <Button
            variant="link"
            onClick={() => { setShowForm(true); setFormDay(selectedDay); }}
            className="text-primary-500 hover:text-primary-400 p-0 h-auto text-sm font-medium"
          >
            + Plan Meal
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex gap-3">
              <select
                value={formDay}
                onChange={(e) => setFormDay(Number(e.target.value))}
                className="bg-[#22201A] border border-[#2E2B20] text-primary-50 rounded-lg px-3 py-2 text-sm"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <Input
                placeholder="Meal name (e.g. Breakfast)"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-10 text-sm flex-1"
              />
            </div>

            {/* Food search */}
            <div className="relative">
              <Input
                placeholder="Search foods to add..."
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                className="bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-10 text-sm pr-10"
              />
              {foodSearching && (
                <div className="absolute right-3 top-3 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Food search results */}
            {foodResults.length > 0 && (
              <div className="border border-[#2E2B20] rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {foodResults.map((food, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddFood(food)}
                    className="w-full text-left px-3 py-2 hover:bg-[#2E2B20] border-b border-[#2E2B20] last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary-50 capitalize">{food.name}</p>
                      <p className="text-xs text-[#706530]">{food.servingQty} {food.servingUnit}</p>
                    </div>
                    <span className="text-xs font-medium text-[#B8A860] ml-2">{food.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected food items */}
            {foodItems.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {foodItems.map((food, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-sm text-primary-50 capitalize truncate flex-1">{food.name}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <button type="button" onClick={() => updateFoodQty(i, food.qty - (food.qty > 1 ? 1 : 0.25))} className="w-6 h-6 rounded bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-xs">-</button>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={food.qty}
                        onChange={(e) => updateFoodQty(i, e.target.value)}
                        className="w-10 text-center bg-transparent text-primary-50 text-sm border-none outline-none"
                      />
                      <button type="button" onClick={() => updateFoodQty(i, food.qty + 1)} className="w-6 h-6 rounded bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-xs">+</button>
                      <span className="text-xs text-[#B8A860] w-14 text-right">{Math.round(food.calories * food.qty)}</span>
                      <button type="button" onClick={() => removeFoodItem(i)} className="text-primary-500 hover:text-red-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving || !mealName.trim() || foodItems.length === 0}
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium text-sm h-9"
              >
                {saving ? 'Saving...' : 'Save Meal'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); setMealName(''); setFoodItems([]); setFoodQuery(''); setFoodResults([]); }}
                className="text-white/50 hover:text-white/70 text-sm h-9"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
