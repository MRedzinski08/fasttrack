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
  const [showOutsidePopup, setShowOutsidePopup] = useState(false);
  const navigate = useNavigate();

  function handleFoodSelect(food) {
    setSelected((prev) => [...prev, { ...food, qty: 1 }]);
  }

  function updateQty(i, qty) {
    const val = Math.max(0.25, parseFloat(qty) || 1);
    setSelected((prev) => prev.map((f, idx) => idx === i ? { ...f, qty: val } : f));
  }

  function removeSelected(i) {
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addManualToList(e) {
    e.preventDefault();
    if (!manual.foodName || !manual.calories) return;
    setSelected((prev) => [...prev, {
      name: manual.foodName,
      calories: parseInt(manual.calories),
      protein: parseFloat(manual.protein) || 0,
      carbs: parseFloat(manual.carbs) || 0,
      fat: parseFloat(manual.fat) || 0,
      servingQty: 1,
      servingUnit: 'serving',
      qty: 1,
    }]);
    setManual({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowManual(false);
  }

  async function handleLogMeal() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    try {
      let wasOutside = false;
      for (const food of selected) {
        const result = await api.meals.log({
          foodName: food.name,
          calories: Math.round(food.calories * food.qty),
          proteinG: Math.round(food.protein * food.qty * 10) / 10,
          carbsG: Math.round(food.carbs * food.qty * 10) / 10,
          fatG: Math.round(food.fat * food.qty * 10) / 10,
          quantity: food.qty * (food.servingQty || 1),
          unit: food.servingUnit,
        });
        if (result.outsideEatingWindow) wasOutside = true;
      }
      if (wasOutside) {
        setShowOutsidePopup(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const totalCal = selected.reduce((s, f) => s + Math.round(f.calories * f.qty), 0);
  const totalProtein = selected.reduce((s, f) => s + Math.round(f.protein * f.qty * 10) / 10, 0);
  const totalCarbs = selected.reduce((s, f) => s + Math.round(f.carbs * f.qty * 10) / 10, 0);
  const totalFat = selected.reduce((s, f) => s + Math.round(f.fat * f.qty * 10) / 10, 0);

  const inputClass = "bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-10";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-medium text-primary-50 mb-6">Log a Meal</h2>

      {/* Search */}
      <Card className="border-2 border-white/20 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)' }}>
        <CardContent>
          <h3 className="font-medium text-[#B8A860] mb-3 text-sm">Search Food</h3>
          <FoodSearchBar onSelect={handleFoodSelect} />
          <div className="mt-3">
            <Button
              variant="link"
              onClick={() => setShowManual((v) => !v)}
              className="text-sm text-primary-500 hover:text-primary-400 p-0 h-auto"
            >
              {showManual ? 'Hide' : '+ Add'} manual entry
            </Button>
          </div>

          {showManual && (
            <form onSubmit={addManualToList} className="mt-4 space-y-3 pt-4 border-t border-white/10">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[#B8A860] mb-1">Calories</Label>
                  <Input
                    required
                    type="number"
                    placeholder="kcal"
                    value={manual.calories}
                    onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Protein</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={manual.protein}
                    onChange={(e) => setManual({ ...manual, protein: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Carbs</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={manual.carbs}
                    onChange={(e) => setManual({ ...manual, carbs: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="text-[#B8A860] mb-1">Fat</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={manual.fat}
                    onChange={(e) => setManual({ ...manual, fat: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium text-sm"
              >
                Add to Meal
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Selected foods list */}
      {selected.length > 0 && (
        <Card className="border-2 border-white/20 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)' }}>
          <CardContent>
            <h3 className="font-medium text-[#B8A860] mb-3 text-sm">Your Meal</h3>
            <div className="space-y-2 mb-4">
              {selected.map((food, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-primary-50 capitalize truncate">{food.name}</p>
                    <p className="text-xs text-white/40">{food.servingQty} {food.servingUnit} per serving</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Quantity control */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(i, food.qty - (food.qty > 1 ? 1 : 0.25))}
                        className="w-7 h-7 rounded-md bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={food.qty}
                        onChange={(e) => updateQty(i, e.target.value)}
                        className="w-12 text-center bg-transparent text-primary-50 text-sm border-none outline-none"
                      />
                      <button
                        onClick={() => updateQty(i, food.qty + 1)}
                        className="w-7 h-7 rounded-md bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-medium text-[#B8A860] w-16 text-right">
                      {Math.round(food.calories * food.qty)} kcal
                    </span>
                    <button
                      onClick={() => removeSelected(i)}
                      className="text-primary-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-white/10 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">Total</span>
                <span className="font-medium text-primary-50">{totalCal} kcal</span>
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>P: {totalProtein.toFixed(1)}g</span>
                <span>C: {totalCarbs.toFixed(1)}g</span>
                <span>F: {totalFat.toFixed(1)}g</span>
              </div>
            </div>

            <Button
              onClick={handleLogMeal}
              disabled={saving}
              className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium py-3 text-base"
            >
              {saving ? 'Logging...' : `Log Meal (${selected.length} item${selected.length !== 1 ? 's' : ''})`}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* Outside eating window popup */}
      {showOutsidePopup && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl border-2 border-white/20 p-8 sm:p-10"
              style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
              }}
            >
              <h2 className="text-2xl font-medium text-primary-500 mb-4">
                You logged a meal outside of your eating window.
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-8">
                It's hard to manage a day's worth of food in a short window, and nobody is perfect. Sometimes, you'll need to make a few exceptions — the consistency is what matters. Tomorrow is a brand new day to get right back on Track!
              </p>
              <button
                onClick={() => {
                  setShowOutsidePopup(false);
                  navigate('/dashboard');
                }}
                className="w-full bg-primary-500 hover:bg-primary-400 text-primary-900 font-medium text-lg py-4 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
