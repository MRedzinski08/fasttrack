import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';
import InfoHeader from './InfoHeader.jsx';
import { useTheme } from '../context/ThemeContext';

const ENERGY_LABELS = ['', 'Very Low', 'Low', 'Okay', 'Good', 'Great'];

export default function MoodTrackerCard() {
  const [rating, setRating] = useState(0);
  const [insights, setInsights] = useState(null);
  const [recentMoods, setRecentMoods] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [logMsg, setLogMsg] = useState('');
  const [loggedToday, setLoggedToday] = useState(false);

  const { info: themeInfo } = useTheme();
  const timerColors = themeInfo.timer;

  useEffect(() => {
    api.mood.insights().then(setInsights).catch(() => {});
    api.mood.history(7).then((d) => {
      const moods = d.moods || [];
      setRecentMoods(moods);
      const today = new Date().toISOString().split('T')[0];
      setLoggedToday(moods.some((m) => m.logged_at?.startsWith(today)));
    }).catch(() => {});
  }, []);

  async function handleLog() {
    if (!rating || loggedToday) return;
    try {
      await api.mood.log({ rating, context: 'general' });
      setLogMsg('Logged');
      setRating(0);
      setLoggedToday(true);
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
    <div className="flex flex-col h-full">
      <InfoHeader title="Mood & Energy" description="Rate your energy throughout the day to discover patterns. After a week of entries, we'll show you how your energy correlates with what you eat, when you eat, and your fasting schedule." />

      {/* Rating selector — stays near header */}
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
      <p className="text-xs text-white/50 text-center h-4 mt-2">{rating > 0 ? ENERGY_LABELS[rating] : '\u00A0'}</p>
      <button
        onClick={handleLog}
        disabled={!rating || loggedToday}
        className="w-full py-2.5 mt-[7px] mb-6 text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30"
      >
        {loggedToday ? 'Logged Today' : 'Log Energy'}
      </button>
      {logMsg && <p className="text-xs text-primary-500/60 text-center">{logMsg}</p>}

      {/* Recent entries — always visible */}
      {(() => {
        const minSlots = 7;
        const recent = recentMoods.slice(0, minSlots).reverse();
        const filled = recent.length;
        const empty = Math.max(0, minSlots - filled);
        return (
          <div className="flex gap-1 mb-2">
            {recent.map((m, i) => (
              <div
                key={i}
                className="flex-1 h-6 flex items-end"
                title={`${ENERGY_LABELS[m.rating]} — ${new Date(m.logged_at).toLocaleDateString()}`}
              >
                <div
                  className="w-full transition-all"
                  style={{
                    height: `${(m.rating / 5) * 100}%`,
                    backgroundColor: timerColors.fasting.color,
                    boxShadow: `0 0 8px rgba(${timerColors.fasting.glow}, 0.5)`,
                  }}
                />
              </div>
            ))}
            {Array.from({ length: empty }).map((_, i) => (
              <div key={`e-${i}`} className="flex-1 h-6 flex items-end">
                <div className="w-full h-[3px] rounded-sm bg-white/[0.06]" />
              </div>
            ))}
          </div>
        );
      })()}
      <p className="text-xs text-white/30 mb-4">
        {recentMoods.length > 0
          ? `${insights?.totalEntries || recentMoods.length} entries logged.${insights?.totalEntries < 7 ? ` ${7 - (insights?.totalEntries || 0)} more to unlock insights.` : ''}`
          : 'Log your energy to see trends.'}
      </p>

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

                {insights.macroCorrelation?.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Energy by diet type</p>
                    <div className="flex gap-4">
                      {insights.macroCorrelation.map((r, i) => (
                        <div key={i} className="text-center">
                          <p className="text-sm font-display text-white tabular-nums">{r.avg_rating}</p>
                          <p className="text-[9px] text-white/30 capitalize">{r.meal_type.replace(/_/g, ' ')}</p>
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

    </div>
  );
}
