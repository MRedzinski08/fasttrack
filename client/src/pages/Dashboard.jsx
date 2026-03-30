import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';
import FastingTimer from '../components/FastingTimer.jsx';
import CalorieBar from '../components/CalorieBar.jsx';
import MacroBar from '../components/MacroBar.jsx';
import MealCard from '../components/MealCard.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import AISummaryCard from '../components/AISummaryCard.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const summary = await api.dashboard.summary();
      setData(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      setData((prev) => ({
        ...prev,
        todayMeals: prev.todayMeals.filter((m) => m.id !== id),
        calorieTotal: prev.todayMeals
          .filter((m) => m.id !== id)
          .reduce((s, m) => s + m.calories, 0),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Hey, {data?.user?.displayName || 'there'} 👋
        </h2>
        <StreakBadge streak={data?.streak || 0} />
      </div>

      {/* Main grid */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {/* Fasting Timer */}
        <FastingTimer
          session={data?.activeFast}
          initialSeconds={data?.timeRemainingSeconds}
          onBreakFast={handleBreakFast}
        />

        {/* Calories & Macros */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
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
      </div>

      {/* AI Summary */}
      <AISummaryCard initialSummary={data?.aiSummary} />

      {/* Recent Meals */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Today's Meals</h3>
          <a href="/log-meal" className="text-sm text-blue-600 hover:underline font-medium">+ Log Meal</a>
        </div>
        {data?.todayMeals?.length > 0 ? (
          data.todayMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            No meals logged today. <a href="/log-meal" className="text-blue-500 hover:underline">Log your first meal</a>
          </p>
        )}
      </div>
    </div>
  );
}
