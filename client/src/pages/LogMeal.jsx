import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FoodSearchBar from '../components/FoodSearchBar.jsx';
import { api } from '../services/api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const inputClass = "bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-10";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-medium text-primary-50 mb-6">Log a Meal</h2>

      <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20 mb-4">
        <CardContent>
          <h3 className="font-medium text-[#B8A860] mb-3 text-sm">Search Food</h3>
          <FoodSearchBar onSelect={handleFoodSelect} />
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20 mb-4">
          <CardContent>
            <h3 className="font-medium text-[#B8A860] mb-3 text-sm">Selected Foods</h3>
            <div className="space-y-2 mb-4">
              {selected.map((food, i) => (
                <div key={i} className="flex items-center justify-between bg-[#22201A] rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-primary-50 capitalize">{food.name}</p>
                    <p className="text-xs text-[#706530]">{food.servingQty} {food.servingUnit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#B8A860]">{food.calories} kcal</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeSelected(i)}
                      className="text-[#5A5228] hover:text-red-500 hover:bg-transparent"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#2E2B20]">
              <span className="text-sm font-medium text-[#B8A860]">
                Total: {selected.reduce((s, f) => s + f.calories, 0)} kcal
              </span>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium py-2 px-6 text-sm"
              >
                {saving ? 'Saving...' : 'Save Meal'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <Button
        variant="link"
        onClick={() => setShowManual((v) => !v)}
        className="text-sm text-primary-500 hover:text-primary-400 p-0 h-auto"
      >
        {showManual ? 'Hide' : 'Use'} manual entry
      </Button>

      {showManual && (
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20 mt-3">
          <CardContent>
            <form onSubmit={handleManualSave} className="space-y-3">
              <h3 className="font-medium text-[#B8A860] text-sm mb-1">Manual Entry</h3>
              <div>
                <Label className="text-[#B8A860] mb-1">Food Name</Label>
                <Input
                  required
                  placeholder="Food name"
                  value={manual.foodName}
                  onChange={(e) => setManual({ ...manual, foodName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#B8A860] mb-1">Calories</Label>
                  <Input
                    required
                    type="number"
                    placeholder="Calories"
                    value={manual.calories}
                    onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Protein (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Protein (g)"
                    value={manual.protein}
                    onChange={(e) => setManual({ ...manual, protein: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Carbs (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Carbs (g)"
                    value={manual.carbs}
                    onChange={(e) => setManual({ ...manual, carbs: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Fat (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Fat (g)"
                    value={manual.fat}
                    onChange={(e) => setManual({ ...manual, fat: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium text-sm"
              >
                {saving ? 'Saving...' : 'Save Manual Entry'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
