import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';

export default function AdaptiveTDEECard() {
  const [weight, setWeight] = useState('');
  const [tdeeData, setTdeeData] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logMsg, setLogMsg] = useState('');

  useEffect(() => {
    api.tdee.calculate().then(setTdeeData).catch(() => {});
    api.tdee.weightHistory(30).then((d) => setWeightHistory(d.weights || [])).catch(() => {});
  }, []);

  async function handleLogWeight() {
    if (!weight) return;
    setLoading(true);
    try {
      await api.tdee.logWeight(parseFloat(weight));
      setLogMsg('Weight logged');
      setWeight('');
      setTimeout(() => setLogMsg(''), 2000);
      // Refresh data
      const [tdee, history] = await Promise.all([
        api.tdee.calculate(),
        api.tdee.weightHistory(30),
      ]);
      setTdeeData(tdee);
      setWeightHistory(history.weights || []);
    } catch (err) {
      setLogMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplySuggestion() {
    if (!tdeeData?.suggestion) return;
    try {
      await api.auth.updateProfile({ dailyCalorieGoal: tdeeData.suggestion.suggestedGoal });
      setLogMsg('Calorie goal updated');
      setTimeout(() => setLogMsg(''), 2000);
    } catch (err) {
      setLogMsg(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500">Adaptive TDEE</span>
      </div>

      {/* Weight logging */}
      <div className="flex gap-3 items-end mb-6">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Today's weight (lbs)"
          className="flex-1 bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
        />
        <button
          onClick={handleLogWeight}
          disabled={loading || !weight}
          className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30 shrink-0"
        >
          Log
        </button>
      </div>

      {logMsg && <p className="text-xs text-primary-500/60 mb-4">{logMsg}</p>}

      {/* Weight trend mini-display */}
      {weightHistory.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
          {weightHistory.slice(-7).map((w, i) => (
            <div key={i} className="text-center shrink-0">
              <p className="text-xs text-white tabular-nums">{parseFloat(w.weight_lbs).toFixed(1)}</p>
              <p className="text-[9px] text-white/30">{new Date(w.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}

      {/* TDEE Result */}
      {tdeeData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {tdeeData.tdee ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-display text-primary-500 tabular-nums">{tdeeData.tdee}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">Est. TDEE</p>
                </div>
                <div>
                  <p className="text-2xl font-display text-white tabular-nums">{tdeeData.avgIntake}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">Avg Intake</p>
                </div>
                <div>
                  <p className={`text-2xl font-display tabular-nums ${tdeeData.weightChange < 0 ? 'text-green-400' : tdeeData.weightChange > 0 ? 'text-red-400' : 'text-white'}`}>
                    {tdeeData.weightChange > 0 ? '+' : ''}{tdeeData.weightChange}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">lbs / {tdeeData.daySpan}d</p>
                </div>
              </div>

              {tdeeData.suggestion && (
                <div className="border border-white/[0.06] p-4 space-y-3">
                  <p className="text-xs text-white/60">{tdeeData.suggestion.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-white/40">{tdeeData.suggestion.currentGoal} cal</span>
                      <span className="text-white/20 mx-2">&rarr;</span>
                      <span className="text-primary-500">{tdeeData.suggestion.suggestedGoal} cal</span>
                    </div>
                    <button
                      onClick={handleApplySuggestion}
                      className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] bg-primary-500 text-black hover:bg-primary-400 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-white/40">{tdeeData.message}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
