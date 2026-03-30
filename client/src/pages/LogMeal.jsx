import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FoodSearchBar from '../components/FoodSearchBar.jsx';
import { api } from '../services/api.js';

export default function LogMeal() {
  const [selected, setSelected] = useState([]);
  const [manual, setManual] = useState({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleFoodSelect(food) {
    setSelected((prev) => [...prev, food]);
  }

  function removeSelected(i) {
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    try {
      for (const food of selected) {
        await api.meals.log({
          foodName: food.name,
          calories: food.calories,
          proteinG: food.protein,
          carbsG: food.carbs,
          fatG: food.fat,
          quantity: food.servingQty,
          unit: food.servingUnit,
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.meals.log({
        foodName: manual.foodName,
        calories: parseInt(manual.calories),
        proteinG: parseFloat(manual.protein) || 0,
        carbsG: parseFloat(manual.carbs) || 0,
        fatG: parseFloat(manual.fat) || 0,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Log a Meal</h2>

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Search Food</h3>
        <FoodSearchBar onSelect={handleFoodSelect} />
      </div>

      {selected.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Selected Foods</h3>
          <div className="space-y-2 mb-4">
            {selected.map((food, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{food.name}</p>
                  <p className="text-xs text-gray-500">{food.servingQty} {food.servingUnit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">{food.calories} kcal</span>
                  <button onClick={() => removeSelected(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-600">
              Total: {selected.reduce((s, f) => s + f.calories, 0)} kcal
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
            >
              {saving ? 'Saving…' : 'Save Meal'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowManual((v) => !v)}
        className="text-sm text-primary-700 hover:underline"
      >
        {showManual ? 'Hide' : 'Use'} manual entry
      </button>

      {showManual && (
        <form onSubmit={handleManualSave} className="bg-white rounded-xl shadow-md p-6 mt-3 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm mb-1">Manual Entry</h3>
          <input
            required
            placeholder="Food name"
            value={manual.foodName}
            onChange={(e) => setManual({ ...manual, foodName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" placeholder="Calories" value={manual.calories}
              onChange={(e) => setManual({ ...manual, calories: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <input type="number" step="0.1" placeholder="Protein (g)" value={manual.protein}
              onChange={(e) => setManual({ ...manual, protein: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <input type="number" step="0.1" placeholder="Carbs (g)" value={manual.carbs}
              onChange={(e) => setManual({ ...manual, carbs: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <input type="number" step="0.1" placeholder="Fat (g)" value={manual.fat}
              onChange={(e) => setManual({ ...manual, fat: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Saving…' : 'Save Manual Entry'}
          </button>
        </form>
      )}
    </div>
  );
}
