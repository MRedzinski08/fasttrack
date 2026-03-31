import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api.js';
import FastingTimer from '../components/FastingTimer.jsx';
import CalorieBar from '../components/CalorieBar.jsx';
import MacroBar from '../components/MacroBar.jsx';
import MealCard from '../components/MealCard.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import AISummaryCard from '../components/AISummaryCard.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScrollScale } from '../hooks/useScrollScale.js';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [chartRange, setChartRange] = useState(7);

  const scrollRef = useScrollScale(0.92, 500);

  const load = useCallback(async () => {
    try {
      const [summary, trend] = await Promise.all([
        api.dashboard.summary(),
        api.history.calories(chartRange),
      ]);
      setData(summary);
      setCalorieTrend(trend.trend || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chartRange]);

  useEffect(() => { load(); }, [load]);

  async function handleBreakFast() {
    try {
      const result = await api.fasting.break();
      setData((prev) => ({
        ...prev,
        activeFast: result.newSession,
        timeRemainingSeconds: result.newSession.target_hours * 3600,
      }));
    } catch (err) {
      console.error(err);
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {error}
          <Button variant="link" onClick={load} className="ml-3 text-red-300 underline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div data-scroll-scale>
        <div className="inline-block">
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-[64px] font-medium text-primary-50">Hey,</span>
            <StreakBadge streak={data?.streak || 0} />
          </div>
          <div className="text-4xl sm:text-[64px] sm:leading-tight font-light text-primary-50">
            {(data?.user?.displayName || 'there').split(' ')[0]}!
          </div>
        </div>
        <p className="text-[#B8A860] text-lg sm:text-2xl mt-2">
          {(data?.streak || 0) <= 1
            ? "Let's get right back on track!"
            : `You've been locked in for ${data?.streak} days. Keep going!`}
        </p>
      </div>

      {/* Fasting Timer — full width, centered */}
      <div data-scroll-scale>
      <FastingTimer
        session={data?.activeFast}
        initialSeconds={data?.timeRemainingSeconds}
        onBreakFast={handleBreakFast}
      />
      </div>

      {/* Calories & Macros — own row */}
      <Card data-scroll-scale className="border-2 border-white/20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)' }}>
        <CardContent className="space-y-5">
          <CalorieBar
            current={data?.calorieTotal || 0}
            goal={data?.user?.dailyCalorieGoal || 2000}
          />
          <MacroBar
            protein={data?.macros?.protein || 0}
            carbs={data?.macros?.carbs || 0}
            fat={data?.macros?.fat || 0}
          />
        </CardContent>
      </Card>

      {/* Calorie Trend */}
      <Card data-scroll-scale className="border-2 border-white/20 rounded-2xl !py-4" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)' }}>
        <CardHeader className="!pb-0 !pt-0">
          <CardTitle className="text-xl font-medium text-primary-50">Your Activity</CardTitle>
        </CardHeader>
        <CardContent className="!pb-0">
          {calorieTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={calorieTrend} margin={{ left: -30, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2B20" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: '#706530' }}
                  stroke="#2E2B20"
                />
                <YAxis tick={{ fontSize: 11, fill: '#706530' }} stroke="#2E2B20" />
                <Tooltip
                  labelFormatter={(d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(v) => [`${v} kcal`, 'Calories']}
                  contentStyle={{ backgroundColor: '#1A1810', border: '1px solid #2E2B20', borderRadius: '8px', color: '#B8A860' }}
                  labelStyle={{ color: '#B8A860' }}
                />
                <Line type="monotone" dataKey="total_calories" stroke="#FFAA00" strokeWidth={2} dot={{ r: 3, fill: '#CC8800' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[#5A5228] text-sm py-8">No calorie data yet. Start logging meals!</p>
          )}
          <div className="flex gap-2 -mt-[6px] px-4">
            {[{ label: '1W', days: 7 }, { label: '1M', days: 30 }, { label: '1Y', days: 365 }, { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) }].map((r) => (
              <Button
                key={r.label}
                size="xs"
                variant={chartRange === r.days ? 'default' : 'outline'}
                onClick={() => setChartRange(r.days)}
                className={
                  chartRange === r.days
                    ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-full'
                    : 'border-[#2E2B20] bg-transparent text-[#B8A860] hover:bg-[#2E2B20] hover:text-primary-50 rounded-full'
                }
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <div data-scroll-scale><AISummaryCard initialSummary={data?.aiSummary} /></div>

      {/* Recent Meals */}
      <Card data-scroll-scale className="border-2 border-white/20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-medium text-primary-50">Today's Meals</CardTitle>
            <Button variant="link" asChild className="text-primary-500 hover:text-primary-400 p-0 h-auto text-sm font-medium">
              <Link to="/log-meal">+ Log Meal</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.todayMeals?.length > 0 ? (
            data.todayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
            ))
          ) : (
            <p className="text-sm text-[#5A5228] text-center py-6">
              No meals logged today.{' '}
              <Link to="/log-meal" className="text-primary-500 hover:underline">Log your first meal</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
