import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';
import InfoHeader from './InfoHeader.jsx';
import { useTheme } from '../context/ThemeContext';

export default function AdaptiveTDEECard() {
  const [weight, setWeight] = useState('');
  const [tdeeData, setTdeeData] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logMsg, setLogMsg] = useState('');
  const [loggedToday, setLoggedToday] = useState(false);
  const { info: themeInfo } = useTheme();
  const timerColors = themeInfo.timer;

  useEffect(() => {
    api.tdee.calculate().then(setTdeeData).catch(() => {});
    api.tdee.weightHistory(30).then((d) => {
      const weights = d.weights || [];
      setWeightHistory(weights);
      // Check if already logged today
      const today = new Date().toISOString().split('T')[0];
      setLoggedToday(weights.some((w) => w.logged_at?.startsWith(today)));
    }).catch(() => {});
  }, []);

  async function handleLogWeight() {
    if (!weight) return;
    setLoading(true);
    try {
      await api.tdee.logWeight(parseFloat(weight));
      setLogMsg('Weight logged');
      setWeight('');
      setLoggedToday(true);
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
    <div className="flex flex-col h-full">
      <InfoHeader title="Adaptive TDEE" description="Your TDEE (Total Daily Energy Expenditure) is how many calories your body actually burns each day. Log your weight daily and we'll calculate your real TDEE based on your weight trend vs calorie intake — then suggest the right calorie goal to reach your target weight. Note: Weight still fluctuates daily for a variety of reasons. This tool should be used to simply estimate your weight loss progress overtime." />

      {/* Weight input */}
      <input
        type="number"
        step="0.1"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Today's weight (lbs)"
        className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20 mb-3"
      />
      <button
        onClick={handleLogWeight}
        disabled={loading || !weight || loggedToday}
        className="w-full py-2.5 mt-4 mb-6 text-xs uppercase tracking-[0.15em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30"
      >
        {loggedToday ? 'Logged Today' : 'Log Weight'}
      </button>

      {logMsg && <p className="text-xs text-primary-500/60 mb-4">{logMsg}</p>}

      {/* Weight entry bar chart — always visible */}
      {(() => {
        const minSlots = 7;
        const recent = weightHistory.slice(-minSlots);
        const filled = recent.length;
        const empty = Math.max(0, minSlots - filled);
        const weights = recent.map(w => parseFloat(w.weight_lbs));
        const min = weights.length > 0 ? Math.min(...weights) : 0;
        const max = weights.length > 0 ? Math.max(...weights) : 1;
        const range = max - min || 1;
        return (
          <div className="flex gap-1 mb-2">
            {recent.map((w, i) => {
              const val = parseFloat(w.weight_lbs);
              const pct = ((val - min) / range) * 0.7 + 0.3;
              return (
                <div key={i} className="flex-1 h-6 flex items-end" title={`${val.toFixed(1)} lbs — ${new Date(w.logged_at).toLocaleDateString()}`}>
                  <div
                    className="w-full transition-all"
                    style={{
                      height: `${pct * 100}%`,
                      backgroundColor: timerColors.fasting.color,
                      boxShadow: `0 0 8px rgba(${timerColors.fasting.glow}, 0.5)`,
                    }}
                  />
                </div>
              );
            })}
            {Array.from({ length: empty }).map((_, i) => (
              <div key={`e-${i}`} className="flex-1 h-6 flex items-end">
                <div className="w-full h-[3px] rounded-sm bg-white/[0.06]" />
              </div>
            ))}
          </div>
        );
      })()}
      <p className="text-xs text-white/30 mb-4">
        {weightHistory.length > 0
          ? `${weightHistory.length} of 7 entries logged.${weightHistory.length < 7 ? ` ${7 - weightHistory.length} more to unlock insights.` : ''}`
          : 'Log your weight daily to see trends.'}
      </p>

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
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
