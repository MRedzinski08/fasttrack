import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';

const GRADE_COLORS = { A: '#4ade80', B: '#a3e635', C: '#FFAA00', D: '#fb923c', F: '#f87171' };

export default function WeeklyReportCard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.history.weeklyReport()
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!report) return null;

  const gradeColor = GRADE_COLORS[report.grade] || '#FFAA00';

  return (
    <motion.div
      className="border border-white/[0.06] p-5 sm:p-6 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-[2px] bg-primary-500" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary-500">Weekly Report</span>
        </div>
        <div className="text-right">
          <span className="text-4xl font-display font-bold" style={{ color: gradeColor }}>{report.grade}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xl font-display text-white tabular-nums">{report.daysLogged}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Days Logged</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-display text-white tabular-nums">{report.avgCalories}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Avg Cal/Day</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-display text-white tabular-nums">{report.fasting.adherence}%</p>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Fast Adherence</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-display text-white tabular-nums">{report.totalMeals}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Meals Logged</p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-3 text-xs">
        <div className="flex justify-between border-b border-white/[0.04] pb-2">
          <span className="text-white/40">Calorie Accuracy</span>
          <span className="text-white tabular-nums">{report.calAccuracy}% of {report.calGoal} cal goal</span>
        </div>
        <div className="flex justify-between border-b border-white/[0.04] pb-2">
          <span className="text-white/40">Avg Protein</span>
          <span className="text-white tabular-nums">{report.avgProtein}g / day</span>
        </div>
        <div className="flex justify-between border-b border-white/[0.04] pb-2">
          <span className="text-white/40">Fasts Completed</span>
          <span className="text-white tabular-nums">{report.fasting.completed} of {report.fasting.total}</span>
        </div>
        <div className="flex justify-between border-b border-white/[0.04] pb-2">
          <span className="text-white/40">Exercise</span>
          <span className="text-white tabular-nums">{report.exercise.sessions} sessions, {report.exercise.totalBurned} cal burned</span>
        </div>
        {report.avgDifficulty && (
          <div className="flex justify-between border-b border-white/[0.04] pb-2">
            <span className="text-white/40">Avg Fast Difficulty</span>
            <span className="text-white tabular-nums">{report.avgDifficulty} / 5</span>
          </div>
        )}
        {report.avgHydration && (
          <div className="flex justify-between border-b border-white/[0.04] pb-2">
            <span className="text-white/40">Avg Hydration</span>
            <span className="text-white tabular-nums">{report.avgHydration} glasses / day</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
