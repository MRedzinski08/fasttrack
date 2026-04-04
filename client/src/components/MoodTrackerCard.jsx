import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

const ENERGY_LABELS = ['', 'Very Low', 'Low', 'Okay', 'Good', 'Great'];
const CONTEXTS = [
  { value: 'general', label: 'General' },
  { value: 'fasting', label: 'While Fasting' },
  { value: 'post_meal', label: 'After a Meal' },
];

export default function MoodTrackerCard() {
  const [rating, setRating] = useState(0);
  const [context, setContext] = useState('general');
  const [insights, setInsights] = useState(null);
  const [recentMoods, setRecentMoods] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [logMsg, setLogMsg] = useState('');

  useEffect(() => {
    api.mood.insights().then(setInsights).catch(() => {});
    api.mood.history(7).then((d) => setRecentMoods(d.moods || [])).catch(() => {});
  }, []);

  async function handleLog() {
    if (!rating) return;
    try {
      await api.mood.log({ rating, context });
      setLogMsg('Logged');
      setRating(0);
      setTimeout(() => setLogMsg(''), 2000);
      // Refresh
      const [ins, hist] = await Promise.all([
        api.mood.insights(),
        api.mood.history(7),
      ]);
      setInsights(ins);
      setRecentMoods(hist.moods || []);
    } catch (err) {
      setLogMsg(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500">Mood & Energy</span>
      </div>

      {/* Rating selector */}
      <div className="space-y-3 mb-6">
        <p className="text-xs text-white/40">How's your energy right now?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`flex-1 py-2.5 text-sm font-display transition-all duration-200 border ${
                rating === n
                  ? 'border-primary-500 text-primary-500 bg-primary-500/10'
                  : 'border-white/[0.06] text-white/30 hover:border-white/[0.12]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-white/50 text-center">{ENERGY_LABELS[rating]}</p>
        )}

        {/* Context */}
        <div className="flex gap-2">
          {CONTEXTS.map((c) => (
            <button
              key={c.value}
              onClick={() => setContext(c.value)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-all duration-200 border ${
                context === c.value
                  ? 'border-primary-500/50 text-primary-500'
                  : 'border-white/[0.06] text-white/30 hover:border-white/[0.12]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleLog}
          disabled={!rating}
          className="w-full py-2.5 text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30"
        >
          Log Energy
        </button>
        {logMsg && <p className="text-xs text-primary-500/60 text-center">{logMsg}</p>}
      </div>

      {/* Recent entries */}
      {recentMoods.length > 0 && (
        <div className="flex gap-1 mb-4">
          {recentMoods.slice(0, 14).reverse().map((m, i) => (
            <div
              key={i}
              className="flex-1 h-6 flex items-end"
              title={`${ENERGY_LABELS[m.rating]} — ${new Date(m.logged_at).toLocaleDateString()}`}
            >
              <div
                className="w-full transition-all"
                style={{
                  height: `${(m.rating / 5) * 100}%`,
                  backgroundColor: m.rating >= 4 ? '#4ade80' : m.rating >= 3 ? '#FFAA00' : '#f87171',
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Insights toggle */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <>
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="text-xs text-primary-500/50 hover:text-primary-500 transition-colors uppercase tracking-[0.15em]"
          >
            {showInsights ? 'Hide' : 'View'} Insights ({insights.totalEntries} entries)
          </button>

          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-display text-primary-500">{insights.overallAvg}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">avg energy / 5</span>
                </div>

                {insights.insights.map((insight, i) => (
                  <p key={i} className="text-xs text-white/50 leading-relaxed">{insight}</p>
                ))}

                {insights.postMealCorrelation?.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Post-meal energy by type</p>
                    <div className="flex gap-4">
                      {insights.postMealCorrelation.map((r, i) => (
                        <div key={i} className="text-center">
                          <p className="text-sm font-display text-white tabular-nums">{r.avg_rating}</p>
                          <p className="text-[9px] text-white/30 capitalize">{r.meal_type.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {insights && !insights.insights && (
        <p className="text-xs text-white/30 mt-2">{insights.message}</p>
      )}
    </div>
  );
}
