import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';

const ease = [0.16, 1, 0.3, 1];

const sectionReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease },
};

export default function History() {
  const [calorieRange, setCalorieRange] = useState(7);
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [fastingData, setFastingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [trend, fasting] = await Promise.all([
          api.history.calories(calorieRange),
          api.history.fasting(30),
        ]);
        setCalorieTrend(trend.trend || []);
        setFastingData(fasting);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [calorieRange, retryKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-16 py-8">
        <div className="text-red-400 text-sm">
          {error}
          <button onClick={() => setRetryKey((k) => k + 1)} className="ml-3 text-red-400 underline text-xs uppercase tracking-wider">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-16 pt-20 md:pt-20 pb-24 md:pb-16 space-y-0">

      {/* Header */}
      <motion.h1
        className="text-4xl sm:text-6xl font-display font-bold text-white mb-12"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        HISTORY
      </motion.h1>

      {/* ===== ACTIVITY CHART ===== */}
      <motion.section {...sectionReveal}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
            <span className="text-xs uppercase tracking-[0.2em] text-primary-500">ACTIVITY</span>
          </div>
          <div className="flex gap-1">
            {[
              { label: '1W', days: 7 },
              { label: '1M', days: 30 },
              { label: '1Y', days: 365 },
              { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => setCalorieRange(r.days)}
                className={`px-3 py-1 text-xs tracking-[0.1em] uppercase transition-all duration-300 ${
                  calorieRange === r.days
                    ? 'text-primary-500 border-b border-primary-500'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {calorieTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={calorieTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="historyCalorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFAA00" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#FFAA00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                stroke="transparent"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                stroke="transparent"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                formatter={(v) => [`${v} kcal`, 'Calories']}
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  color: '#FFAA00',
                  padding: '8px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="total_calories"
                stroke="#FFAA00"
                strokeWidth={1.5}
                fill="url(#historyCalorieGradient)"
                dot={false}
                activeDot={{ r: 3, fill: '#FFAA00', stroke: '#FFAA00', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-white/10 text-sm py-16">No calorie data yet. Start logging meals!</p>
        )}
      </motion.section>

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-12"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* ===== STAT NUMBERS ===== */}
      <motion.section
        className="grid grid-cols-2 gap-12 py-8"
        {...sectionReveal}
      >
        <div className="text-center">
          <p className="text-4xl sm:text-6xl font-display font-extralight text-primary-500 tabular-nums">
            {fastingData?.adherencePercent ?? 0}%
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-3">Fasting Adherence</p>
          <p className="text-xs text-white/20 mt-1">Last 30 days</p>
        </div>
        <div className="text-center">
          <p className="text-4xl sm:text-6xl font-display font-extralight text-green-400 tabular-nums">
            {fastingData?.completedSessions ?? 0}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-3">Fasts Completed</p>
          <p className="text-xs text-white/20 mt-1">of {fastingData?.totalSessions ?? 0} total</p>
        </div>
      </motion.section>

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent my-8"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* ===== RECENT FASTING SESSIONS ===== */}
      {fastingData?.sessions?.length > 0 && (
        <motion.section {...sectionReveal}>
          <div className="flex items-center gap-3 mb-6">
            <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
            <span className="text-xs uppercase tracking-[0.2em] text-primary-500">RECENT FASTING SESSIONS</span>
          </div>

          <div>
            {fastingData.sessions.slice(0, 10).map((s, i) => {
              const hours = s.fast_end
                ? ((new Date(s.fast_end) - new Date(s.fast_start)) / 3600000).toFixed(1)
                : null;
              return (
                <motion.div
                  key={s.id}
                  className="group"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="w-full h-[2px] bg-primary-500/20 mb-3" />
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <p className="text-sm font-display text-white">
                        {new Date(s.fast_start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {new Date(s.fast_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {s.fast_end && ` \u2192 ${new Date(s.fast_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {hours && <span className="text-sm font-display text-primary-500 tabular-nums">{hours}h</span>}
                      <span className={`text-xs uppercase tracking-[0.1em] ${s.completed ? 'text-green-400' : 'text-red-400'}`}>
                        {s.completed ? 'Completed' : 'Broken early'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
}
