import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useInView } from 'framer-motion';
import { api } from '../services/api.js';
import { useTheme } from '../context/ThemeContext';
import FastingTimer from '../components/FastingTimer.jsx';
import CalorieBar from '../components/CalorieBar.jsx';
import MacroBar from '../components/MacroBar.jsx';
import MealCard from '../components/MealCard.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import AISummaryCard from '../components/AISummaryCard.jsx';
import ProGate from '../components/ProGate.jsx';
import MealPrepCard from '../components/MealPrepCard.jsx';
import PhotoLogCard from '../components/PhotoLogCard.jsx';
import QRScanCard from '../components/QRScanCard.jsx';
import MealBuilderCard from '../components/MealBuilderCard.jsx';
import AdaptiveTDEECard from '../components/AdaptiveTDEECard.jsx';
import MoodTrackerCard from '../components/MoodTrackerCard.jsx';
import GroceryListCard from '../components/GroceryListCard.jsx';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Shared animation preset for sections                              */
/* ------------------------------------------------------------------ */
const sectionReveal = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8 },
};

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                             */
/* ------------------------------------------------------------------ */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { value, ref };
}

/* ------------------------------------------------------------------ */
/*  Stat cell for the static metrics grid                             */
/* ------------------------------------------------------------------ */
function StatCell({ target, label, color }) {
  const { value, ref } = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-5xl font-display font-extralight tabular-nums" style={{ color }}>
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] uppercase tracking-[0.2em] mt-2" style={{ color: 'var(--ft-text)' }}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [chartRange, setChartRange] = useState(7);
  const [exerciseData, setExerciseData] = useState([]);

  const load = useCallback(async () => {
    try {
      const [summary, trend, exercises] = await Promise.all([
        api.dashboard.summary(),
        api.history.calories(chartRange),
        api.exercise.today(),
      ]);
      setData(summary);
      setCalorieTrend(trend.trend || []);
      setExerciseData(exercises.exercises || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chartRange]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    load();
    if (searchParams.get('upgraded') === 'true') {
      api.billing.status().catch(console.error);
    }
  }, [load, searchParams]);

  // Reload when settings are saved (e.g. fasting protocol change)
  useEffect(() => {
    function onSettingsSaved() { load(); }
    window.addEventListener('settings-saved', onSettingsSaved);
    return () => window.removeEventListener('settings-saved', onSettingsSaved);
  }, [load]);

  async function handleDeleteMeal(id) {
    try {
      await api.meals.delete(id);
      setData((prev) => {
        const remaining = prev.todayMeals.filter((m) => m.id !== id);
        return {
          ...prev,
          todayMeals: remaining,
          calorieTotal: remaining.reduce((s, m) => s + m.calories, 0),
          macros: {
            protein: remaining.reduce((s, m) => s + parseFloat(m.protein_g || 0), 0),
            carbs: remaining.reduce((s, m) => s + parseFloat(m.carbs_g || 0), 0),
            fat: remaining.reduce((s, m) => s + parseFloat(m.fat_g || 0), 0),
          },
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteExercise(id) {
    try {
      await api.exercise.delete(id);
      setExerciseData((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-6">
        <span className="text-lg font-display tracking-[0.3em] uppercase select-none">
          <span className="text-white/80">FAST</span>
          <span className="text-primary-500">TRACK</span>
        </span>
        <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] text-white/30 text-center max-w-[280px] leading-relaxed">This app is still in development. As a tester, you may experience increased loading times — this is normal, and will take less than a minute to complete.</p>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl p-6 text-base">
          {error}
          <Button variant="link" onClick={load} className="ml-3 text-red-300 underline">Retry</Button>
        </div>
      </div>
    );
  }

  /* ---- Derived values ---- */
  const goal = data?.user?.dailyCalorieGoal || 2000;
  const intake = data?.calorieTotal || 0;
  const burned = exerciseData.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const net = goal - intake + burned;
  const isOver = net < 0;

  const firstName = (data?.user?.displayName || 'there').split(' ')[0];

  // Theme-aware metric colors
  const { isDark, info: themeInfo } = useTheme();
  const metricColors = isDark
    ? { goal: '#FFAA00', consumed: '#ffffff', burned: '#fb923c', remaining: '#4ade80', over: '#f87171' }
    : { goal: themeInfo.accent, consumed: '#111111', burned: '#C2410C', remaining: '#15803D', over: '#B91C1C' };

  const metrics = [
    { value: goal, label: 'GOAL', color: metricColors.goal },
    { value: intake, label: 'CONSUMED', color: metricColors.consumed },
    { value: burned, label: 'BURNED', color: metricColors.burned },
    { value: Math.abs(net), label: isOver ? 'OVER' : 'REMAINING', color: isOver ? metricColors.over : metricColors.remaining },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-16 pt-20 md:pt-20 pb-48 md:pb-32 space-y-0">

      {/* Scanning line -- pure aesthetic */}
      <div className="line-scan" />

      {/* ===== SECTION 1 -- HERO GREETING ===== */}
      <motion.section
        className="relative py-12 sm:py-20"
        {...sectionReveal}
      >
        <p className="text-sm font-display uppercase tracking-[0.3em] text-white mb-2">
          Hey,
        </p>

        <motion.h1
          className="text-[60px] sm:text-[100px] lg:text-[140px] font-display font-bold tracking-tighter text-white leading-none"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {firstName}
        </motion.h1>

        {/* Streak + motivational row */}
        <motion.div
          className="flex items-center gap-6 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <StreakBadge streak={data?.streak || 0} />
          <div className="w-px h-8 bg-white/10" />
          <p className="text-sm text-white/60 uppercase tracking-[0.15em]">
            {(data?.streak || 0) <= 1
              ? "Let's get back on track"
              : 'Keep the momentum going'}
          </p>
        </motion.div>

        {/* Animated accent line that draws in */}
        <motion.div
          className="h-[1px] bg-gradient-to-r from-primary-500 via-primary-500 to-transparent mt-8"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.section>

      {/* ===== SECTION 2 -- METRICS TICKER ===== */}
      <motion.section
        className="py-8 border-y border-white/[0.08]"
        {...sectionReveal}
      >
        {/* Scrolling header */}
        <div className="overflow-hidden mb-8 pointer-events-none select-none" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div className="animate-marquee whitespace-nowrap flex items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="text-4xl sm:text-5xl font-display tracking-[0.3em] uppercase inline-block mx-8">
                <span className="text-primary-500">CALORIE</span>
                <span style={{ color: 'var(--ft-text)' }}> COUNTER</span>
              </span>
            ))}
          </div>
        </div>

        {/* Static grid for readability */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <StatCell target={goal} label="Goal" color={metricColors.goal} />
          <StatCell target={intake} label="Eaten" color={metricColors.consumed} />
          <StatCell target={burned} label="Burned" color={metricColors.burned} />
          <StatCell
            target={Math.abs(net)}
            label={isOver ? 'Over' : 'Left'}
            color={isOver ? metricColors.over : metricColors.remaining}
          />
        </div>
      </motion.section>

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* ===== SECTION 3 -- FASTING TIMER (full bleed) ===== */}
      <motion.section {...sectionReveal}>
        <FastingTimer
          session={data?.activeFast}
          initialSeconds={data?.timeRemainingSeconds}
          eatingWindowActive={data?.eatingWindowActive || false}
        />
      </motion.section>

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* ===== CALORIES / MACROS ===== */}
      <motion.section className="py-6" {...sectionReveal}>
        <div className="border border-white/[0.06] p-5 sm:p-6 space-y-5">
          <CalorieBar
            current={data?.calorieTotal || 0}
            goal={data?.user?.dailyCalorieGoal || 2000}
          />
          <MacroBar
            protein={data?.macros?.protein || 0}
            carbs={data?.macros?.carbs || 0}
            fat={data?.macros?.fat || 0}
          />
        </div>
      </motion.section>

      {/* ===== QUICK ACTIONS ===== */}
      <motion.section className="py-8" {...sectionReveal}>
        <span className="text-xs uppercase tracking-[0.2em] text-primary-500 block mb-6 text-center">ACTIONS</span>

        <div className="flex items-start justify-around px-2">
          {/* Log Meal */}
          <Link to="/log-meal" className="group text-center">
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m0-18c-1.5 2-3 3-5 3m5-3c1.5 2 3 3 5 3M5 21h14" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Meal</span>
            </motion.div>
          </Link>

          {/* Log Exercise */}
          <Link to="/log-meal" className="group text-center">
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Exercise</span>
            </motion.div>
          </Link>

          {/* Meal Prep */}
          <div
            className="group text-center cursor-pointer"
            onClick={() => document.getElementById('meal-prep-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Prep</span>
            </motion.div>
          </div>

          {/* Meal Builder */}
          <div
            className="group text-center cursor-pointer"
            onClick={() => document.getElementById('meal-builder-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Build</span>
            </motion.div>
          </div>

          {/* Take Photo */}
          <div
            className="group text-center cursor-pointer"
            onClick={() => document.getElementById('photo-log-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Photo</span>
            </motion.div>
          </div>

          {/* Scan Code */}
          <div
            className="group text-center cursor-pointer"
            onClick={() => document.getElementById('qr-scan-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-white group-hover:text-primary-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4zM4 10h2v2H4v-2zm6-6h2v2h-2V4zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2zm6-6h2v2h-2v-2z" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white">Scan</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== SECTION 4 -- TWO-COLUMN SPLIT ===== */}
      <motion.section
        className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-0"
        {...sectionReveal}
      >
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="pr-0 lg:pr-8 space-y-8">

          {/* Activity Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
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
                    onClick={() => setChartRange(r.days)}
                    className={`px-3 py-1 text-xs tracking-[0.1em] uppercase transition-all duration-300 ${
                      chartRange === r.days
                        ? 'text-primary-500 border-b border-primary-500'
                        : 'text-white/60 hover:text-white/60'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {calorieTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={calorieTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(v) => [`${v} cal`, 'Calories']}
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
                    fill="url(#calorieGradient)"
                    dot={false}
                    activeDot={{ r: 3, fill: '#FFAA00', stroke: '#FFAA00', strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-white/10 text-sm py-16">No data yet. Start logging to see trends.</p>
            )}
          </div>

        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="pl-0 lg:pl-8 lg:border-l lg:border-white/[0.08] space-y-8 mt-8 lg:mt-0">

          {/* Today's Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
                <span className="text-xs uppercase tracking-[0.2em] text-primary-500">TODAY'S MEALS</span>
              </div>
              <Link to="/log-meal" className="text-xs tracking-[0.2em] uppercase text-primary-500/50 hover:text-primary-500 transition-colors duration-300">
                + Add
              </Link>
            </div>
            {data?.todayMeals?.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
                {data.todayMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
                ))}
              </div>
            ) : (
              <div className="py-3">
                <p className="text-white/10 text-sm">Nothing logged yet</p>
              </div>
            )}
          </div>

          {/* Today's Exercise */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} />
                <span className="text-xs uppercase tracking-[0.2em] text-primary-500">TODAY'S EXERCISE</span>
              </div>
              <Link to="/log-meal" className="text-xs tracking-[0.2em] uppercase text-primary-500/50 hover:text-primary-500 transition-colors duration-300">
                + Add
              </Link>
            </div>
            {exerciseData.length > 0 ? (
              <>
                <div className="max-h-[240px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
                  {exerciseData.map((exercise) => (
                    <div key={exercise.id} className="mb-4 group transition-all duration-200 hover:translate-x-1">
                      <div className="w-full h-[2px] bg-orange-400/40 mb-2" />
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-white truncate capitalize">{exercise.exercise_name}</p>
                          <p className="text-xs text-white tracking-wide mt-1">
                            {exercise.duration_min}min &middot; {exercise.calories_burned} cal
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-400 transition-all duration-200 ml-3"
                        >
                          <span className="text-lg leading-none">&times;</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/[0.08]">
                  <span className="text-xs tracking-[0.2em] uppercase text-white">Total</span>
                  <span className="text-sm font-display font-light text-orange-400 tabular-nums">
                    {exerciseData.reduce((s, e) => s + (e.calories_burned || 0), 0)} cal
                  </span>
                </div>
              </>
            ) : (
              <div className="py-3">
                <p className="text-white/10 text-sm">No exercises yet</p>
              </div>
            )}
          </div>

        </div>
      </motion.section>

      {/* ===== DAILY COACHING ===== */}
      <motion.section className="py-6" {...sectionReveal}>
        <div className="border border-white/[0.06] p-5 sm:p-6">
          <AISummaryCard initialSummary={data?.aiSummary} />
        </div>
      </motion.section>

      {/* Animated divider */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* Actions section moved above activity graph */}

      {/* ===== SECTION 6 -- PRO FEATURES ===== */}
      <motion.section className="py-12" {...sectionReveal}>
        <div className="flex items-center gap-4 mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-primary-500/60 font-medium">PRO</span>
          <hr className="flex-1 border-white/[0.08]" />
        </div>

        {/* AI Meal Builder */}
        <div id="meal-builder-section">
          <ProGate feature="AI Meal Builder">
            <MealBuilderCard />
          </ProGate>
        </div>
      </motion.section>

      {/* Meal Prep + Grocery List combined */}
      <motion.section id="meal-prep-section" className="py-6" {...sectionReveal}>
        <ProGate feature="Meal Prep & Grocery">
          <div className="space-y-8">
            <MealPrepCard />
            <div className="border-t border-white/[0.06] pt-8">
              <GroceryListCard />
            </div>
          </div>
        </ProGate>
      </motion.section>

      {/* Photo + QR */}
      <motion.section
        id="photo-log-section"
        className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
        {...sectionReveal}
      >
        <ProGate feature="Photo Logging"><PhotoLogCard onMealLogged={load} /></ProGate>
        <div id="qr-scan-section">
          <ProGate feature="QR Code Scanner"><QRScanCard onMealLogged={load} /></ProGate>
        </div>
      </motion.section>

      {/* Adaptive TDEE + Mood/Energy */}
      <motion.section className="py-6 grid grid-cols-2 gap-4 sm:gap-6 items-stretch" {...sectionReveal}>
        <ProGate feature="Adaptive TDEE"><AdaptiveTDEECard /></ProGate>
        <ProGate feature="Mood Tracking"><MoodTrackerCard /></ProGate>
      </motion.section>
    </div>
  );
}
