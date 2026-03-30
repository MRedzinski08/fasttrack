import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
          <Button variant="link" onClick={() => setRetryKey((k) => k + 1)} className="ml-3 text-red-300 underline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-medium text-primary-50">History & Insights</h2>

      <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-primary-50">Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {calorieTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={calorieTrend}>
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
                <Line type="monotone" dataKey="total_calories" stroke="#FFDF00" strokeWidth={2} dot={{ r: 3, fill: '#CCB200' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[#5A5228] text-sm py-12">No calorie data yet. Start logging meals!</p>
          )}
          <div className="flex gap-2 mt-4">
            {[{ label: '1W', days: 7 }, { label: '1M', days: 30 }, { label: '1Y', days: 365 }, { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) }].map((r) => (
              <Button
                key={r.label}
                size="xs"
                variant={calorieRange === r.days ? 'default' : 'outline'}
                onClick={() => setCalorieRange(r.days)}
                className={
                  calorieRange === r.days
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

      <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardContent className="text-center">
            <p className="text-2xl sm:text-3xl font-medium text-primary-600">{fastingData?.adherencePercent ?? 0}%</p>
            <p className="text-sm text-[#706530] mt-1">Fasting Adherence</p>
            <p className="text-xs text-[#5A5228]">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardContent className="text-center">
            <p className="text-2xl sm:text-3xl font-medium text-green-600">{fastingData?.completedSessions ?? 0}</p>
            <p className="text-sm text-[#706530] mt-1">Fasts Completed</p>
            <p className="text-xs text-[#5A5228]">of {fastingData?.totalSessions ?? 0} total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardContent className="text-center">
            <p className="text-2xl sm:text-3xl font-medium text-purple-600">{fastingData?.longestFastHours ?? 0}h</p>
            <p className="text-sm text-[#706530] mt-1">Longest Fast</p>
            <p className="text-xs text-[#5A5228]">Personal record</p>
          </CardContent>
        </Card>
      </div>

      {fastingData?.sessions?.length > 0 && (
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-primary-50">Recent Fasting Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {fastingData.sessions.slice(0, 10).map((s) => {
              const hours = s.fast_end
                ? ((new Date(s.fast_end) - new Date(s.fast_start)) / 3600000).toFixed(1)
                : null;
              return (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-[#2E2B20] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#B8A860]">
                      {new Date(s.fast_start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-[#5A5228]">
                      {new Date(s.fast_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {s.fast_end && ` → ${new Date(s.fast_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hours && <span className="text-sm font-medium text-[#B8A860]">{hours}h</span>}
                    <Badge
                      className={
                        s.completed
                          ? 'bg-green-500/10 text-green-500 border-0'
                          : 'bg-red-500/10 text-red-500 border-0'
                      }
                    >
                      {s.completed ? 'Completed' : 'Broken early'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
