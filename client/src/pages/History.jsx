import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api.js';

export default function History() {
  const [calorieRange, setCalorieRange] = useState(7);
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [fastingData, setFastingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [trend, fasting] = await Promise.all([
          api.history.calories(calorieRange),
          api.history.fasting(30),
        ]);
        setCalorieTrend(trend.trend || []);
        setFastingData(fasting);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [calorieRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">History & Insights</h2>

      {/* Calorie Trend */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Calorie Trend</h3>
          <div className="flex gap-2">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setCalorieRange(d)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  calorieRange === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {calorieTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={calorieTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                formatter={(v) => [`${v} kcal`, 'Calories']}
              />
              <Line type="monotone" dataKey="total_calories" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 text-sm py-12">No calorie data yet. Start logging meals!</p>
        )}
      </div>

      {/* Fasting Stats */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{fastingData?.adherencePercent ?? 0}%</p>
          <p className="text-sm text-gray-500 mt-1">Fasting Adherence</p>
          <p className="text-xs text-gray-400">Last 30 days</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{fastingData?.completedSessions ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Fasts Completed</p>
          <p className="text-xs text-gray-400">of {fastingData?.totalSessions ?? 0} total</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-purple-600">{fastingData?.longestFastHours ?? 0}h</p>
          <p className="text-sm text-gray-500 mt-1">Longest Fast</p>
          <p className="text-xs text-gray-400">Personal record</p>
        </div>
      </div>

      {/* Recent fasting sessions */}
      {fastingData?.sessions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Fasting Sessions</h3>
          <div className="space-y-0">
            {fastingData.sessions.slice(0, 10).map((s) => {
              const hours = s.fast_end
                ? ((new Date(s.fast_end) - new Date(s.fast_start)) / 3600000).toFixed(1)
                : null;
              return (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(s.fast_start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.fast_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {s.fast_end && ` → ${new Date(s.fast_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hours && <span className="text-sm font-semibold text-gray-700">{hours}h</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.completed ? 'Completed' : 'Broken early'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
