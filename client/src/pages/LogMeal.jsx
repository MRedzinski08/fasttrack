import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FoodSearchBar from '../components/FoodSearchBar.jsx';
import { api } from '../services/api.js';

const ease = [0.16, 1, 0.3, 1];

const sectionReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease },
};

export default function LogMeal() {
  const [selected, setSelected] = useState([]);
  const [manual, setManual] = useState({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showOutsidePopup, setShowOutsidePopup] = useState(false);
  const navigate = useNavigate();

  // Exercise state
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [exerciseSearching, setExerciseSearching] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseDuration, setExerciseDuration] = useState(30);
  const [savingExercise, setSavingExercise] = useState(false);
  const [exerciseError, setExerciseError] = useState('');

  const searchExercises = useCallback(async (q) => {
    if (!q || q.length < 2) { setExerciseResults([]); return; }
    setExerciseSearching(true);
    try {
      const res = await api.exercise.list(q);
      setExerciseResults(res.exercises || []);
    } catch {
      setExerciseResults([]);
    } finally {
      setExerciseSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchExercises(exerciseQuery), 400);
    return () => clearTimeout(timer);
  }, [exerciseQuery, searchExercises]);

  function handleSelectExercise(exercise) {
    setSelectedExercise(exercise);
    setExerciseDuration(30);
    setExerciseResults([]);
    setExerciseQuery('');
  }

  function getCalorieEstimate() {
    if (!selectedExercise) return 0;
    return Math.round(selectedExercise.met * 70 * (exerciseDuration / 60));
  }

  async function handleLogExercise() {
    if (!selectedExercise || exerciseDuration <= 0) return;
    setSavingExercise(true);
    setExerciseError('');
    try {
      await api.exercise.log({
        exerciseName: selectedExercise.name,
        metValue: selectedExercise.met,
        durationMin: exerciseDuration,
      });
      setSelectedExercise(null);
      setExerciseDuration(30);
      navigate('/dashboard');
    } catch (err) {
      setExerciseError(err.message);
    } finally {
      setSavingExercise(false);
    }
  }

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

  const inputClass = 'w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20';

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-20 md:pt-20 pb-24 md:pb-16">

      {/* Header */}
      <motion.h1
        className="text-4xl sm:text-6xl font-display font-bold text-white mb-12"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        LOG
      </motion.h1>

      {/* ===== LOG FOOD SECTION ===== */}
      <motion.section {...sectionReveal}>
        <div className="flex items-center gap-3 mb-6">
          <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
          <span className="text-xs uppercase tracking-[0.2em] text-primary-500">LOG FOOD</span>
        </div>

        {/* Search card */}
        <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 mb-6">
          <FoodSearchBar onSelect={handleFoodSelect} />

          <div className="mt-4">
            <button
              onClick={() => setShowManual((v) => !v)}
              className="text-xs uppercase tracking-[0.15em] text-primary-500/60 hover:text-primary-500 transition-colors duration-300"
            >
              {showManual ? 'Hide' : '+ Add'} manual entry
            </button>
          </div>

          {showManual && (
            <form onSubmit={addManualToList} className="mt-6 pt-6 border-t border-white/[0.06] space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Food Name</label>
                <input
                  required
                  placeholder="Food name"
                  value={manual.foodName}
                  onChange={(e) => setManual({ ...manual, foodName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Calories</label>
                  <input required type="number" placeholder="kcal" value={manual.calories}
                    onChange={(e) => setManual({ ...manual, calories: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Protein</label>
                  <input type="number" step="0.1" placeholder="g" value={manual.protein}
                    onChange={(e) => setManual({ ...manual, protein: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Carbs</label>
                  <input type="number" step="0.1" placeholder="g" value={manual.carbs}
                    onChange={(e) => setManual({ ...manual, carbs: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Fat</label>
                  <input type="number" step="0.1" placeholder="g" value={manual.fat}
                    onChange={(e) => setManual({ ...manual, fat: e.target.value })} className={inputClass} />
                </div>
              </div>
              <button
                type="submit"
                className="border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black px-5 py-2 text-xs uppercase tracking-[0.15em] transition-all duration-300"
              >
                Add to Meal
              </button>
            </form>
          )}
        </div>

        {/* Selected foods list */}
        {selected.length > 0 && (
          <motion.div
            className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }} />
              <span className="text-xs uppercase tracking-[0.2em] text-primary-500">YOUR MEAL</span>
            </div>

            <div className="space-y-0">
              {selected.map((food, i) => (
                <motion.div
                  key={i}
                  className="group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="w-full h-[2px] bg-primary-500/30 mb-3" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-2">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-display text-white capitalize truncate">{food.name}</p>
                      <p className="text-xs text-white/40">{food.servingQty} {food.servingUnit} per serving</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(i, food.qty - (food.qty > 1 ? 1 : 0.25))}
                          className="w-8 h-8 border border-white/[0.08] text-white/40 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center text-sm transition-all duration-300"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={food.qty}
                          onChange={(e) => updateQty(i, e.target.value)}
                          className="w-14 text-center bg-transparent text-white text-sm border-none outline-none"
                        />
                        <button
                          onClick={() => updateQty(i, food.qty + 1)}
                          className="w-8 h-8 border border-white/[0.08] text-white/40 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center text-sm transition-all duration-300"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-display text-primary-500 w-20 text-right tabular-nums">
                        {Math.round(food.calories * food.qty)} kcal
                      </span>
                      <button
                        onClick={() => removeSelected(i)}
                        className="text-white/20 hover:text-red-400 transition-colors duration-300 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">Total</span>
                <span className="text-lg font-display text-white tabular-nums">{totalCal} kcal</span>
              </div>
              <div className="flex gap-4 text-xs text-white/30 justify-end">
                <span>P: {totalProtein.toFixed(1)}g</span>
                <span>C: {totalCarbs.toFixed(1)}g</span>
                <span>F: {totalFat.toFixed(1)}g</span>
              </div>
            </div>

            <button
              onClick={handleLogMeal}
              disabled={saving}
              className="w-full bg-primary-500 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary-400 disabled:opacity-40 mt-6 font-medium"
            >
              {saving ? 'Logging...' : `Log Meal (${selected.length} item${selected.length !== 1 ? 's' : ''})`}
            </button>
          </motion.div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}
      </motion.section>

      {/* Outside eating window popup */}
      {showOutsidePopup && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-lg bg-[#080808] border border-white/[0.06] rounded-xl p-8 sm:p-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease }}
            >
              <h2 className="text-2xl font-display font-bold text-primary-500 mb-4">
                You logged a meal outside of your eating window.
              </h2>
              <p className="text-sm text-white/60 leading-relaxed mb-8">
                It's hard to manage a day's worth of food in a short window, and nobody is perfect. Sometimes, you'll need to make a few exceptions — the consistency is what matters. Tomorrow is a brand new day to get right back on Track!
              </p>
              <button
                onClick={() => {
                  setShowOutsidePopup(false);
                  navigate('/dashboard');
                }}
                className="w-full border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300"
              >
                Close
              </button>
            </motion.div>
          </div>
        </>
      )}

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-16"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* ===== LOG EXERCISE SECTION ===== */}
      <motion.section {...sectionReveal}>
        <div className="flex items-center gap-3 mb-6">
          <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
          <span className="text-xs uppercase tracking-[0.2em] text-primary-500">LOG EXERCISE</span>
        </div>

        <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6">
          {/* Exercise search input */}
          <input
            placeholder="Search exercises (e.g. running, cycling, yoga)"
            value={exerciseQuery}
            onChange={(e) => setExerciseQuery(e.target.value)}
            className={inputClass}
          />

          {/* Exercise search results */}
          {exerciseSearching && (
            <p className="text-xs text-white/30 mt-3">Searching...</p>
          )}

          {exerciseResults.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {Object.entries(
                exerciseResults.reduce((groups, ex) => {
                  const cat = ex.category || 'General';
                  if (!groups[cat]) groups[cat] = [];
                  groups[cat].push(ex);
                  return groups;
                }, {})
              ).map(([category, exercises]) => (
                <div key={category}>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-1 mt-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {exercises.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectExercise(ex)}
                        className="px-3 py-2 border border-white/[0.06] hover:border-primary-500 text-sm text-white transition-all duration-300"
                      >
                        <span className="capitalize">{ex.name}</span>
                        <span className="text-white/30 ml-2 text-xs">MET {ex.met}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected exercise with duration */}
          {selectedExercise && (
            <motion.div
              className="mt-6 pt-6 border-t border-white/[0.06]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-[2px] bg-primary-500/30 mb-4" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display text-white capitalize">{selectedExercise.name}</p>
                  <p className="text-xs text-white/30">MET: {selectedExercise.met}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase tracking-[0.15em] text-white/60 whitespace-nowrap">Duration</label>
                    <input
                      type="number"
                      min="1"
                      value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-transparent border-b border-white/[0.1] text-white py-1 text-sm text-center focus:border-primary-500 outline-none transition-all"
                    />
                    <span className="text-xs text-white/30">min</span>
                  </div>
                  <button
                    onClick={() => setSelectedExercise(null)}
                    className="text-white/20 hover:text-red-400 transition-colors duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calorie estimate preview */}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-white/40">Estimated calories burned</span>
                <span className="text-sm font-display text-primary-500 tabular-nums">~{getCalorieEstimate()} kcal</span>
              </div>

              <button
                onClick={handleLogExercise}
                disabled={savingExercise}
                className="w-full bg-primary-500 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary-400 disabled:opacity-40 mt-6 font-medium"
              >
                {savingExercise ? 'Logging...' : 'Log Exercise'}
              </button>
            </motion.div>
          )}

          {exerciseError && (
            <p className="text-red-400 text-sm mt-3">{exerciseError}</p>
          )}
        </div>
      </motion.section>
    </div>
  );
}
