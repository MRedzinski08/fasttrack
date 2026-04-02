import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const glassStyle = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(10px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[96rem] mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl p-4 text-base">
          {error}
          <Button variant="link" onClick={() => setRetryKey((k) => k + 1)} className="ml-3 text-red-300 underline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[96rem] mx-auto px-4 py-6 space-y-6">
      <h2 className="text-xl sm:text-3xl font-medium text-primary-50">History & Insights</h2>

      {/* Activity Chart */}
      <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
        <CardHeader>
          <CardTitle className="text-xl font-medium text-primary-50">Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {calorieTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={calorieTrend} margin={{ left: -30, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2B20" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 14, fill: '#706530' }}
                  stroke="#2E2B20"
                />
                <YAxis tick={{ fontSize: 14, fill: '#706530' }} stroke="#2E2B20" />
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
            <p className="text-center text-[#5A5228] text-base py-12">No calorie data yet. Start logging meals!</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 px-4">
            {[{ label: '1W', days: 7 }, { label: '1M', days: 30 }, { label: '1Y', days: 365 }, { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) }].map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant={calorieRange === r.days ? 'default' : 'outline'}
                onClick={() => setCalorieRange(r.days)}
                className={
                  calorieRange === r.days
                    ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-full px-3 py-1.5 text-sm sm:px-5 sm:py-2 sm:text-base'
                    : 'border-[#2E2B20] bg-transparent text-[#B8A860] hover:bg-[#2E2B20] hover:text-primary-50 rounded-full px-3 py-1.5 text-sm sm:px-5 sm:py-2 sm:text-base'
                }
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
          <CardContent className="text-center py-3 sm:py-8">
            <p className="text-3xl sm:text-5xl font-medium text-primary-500">{fastingData?.adherencePercent ?? 0}%</p>
            <p className="text-sm sm:text-lg text-white/50 mt-2">Fasting Adherence</p>
            <p className="text-sm text-white/30">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
          <CardContent className="text-center py-3 sm:py-8">
            <p className="text-3xl sm:text-5xl font-medium text-green-500">{fastingData?.completedSessions ?? 0}</p>
            <p className="text-sm sm:text-lg text-white/50 mt-2">Fasts Completed</p>
            <p className="text-sm text-white/30">of {fastingData?.totalSessions ?? 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Fasting Sessions */}
      {fastingData?.sessions?.length > 0 && (
        <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
          <CardHeader>
            <CardTitle className="text-xl font-medium text-primary-50">Recent Fasting Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {fastingData.sessions.slice(0, 10).map((s) => {
              const hours = s.fast_end
                ? ((new Date(s.fast_end) - new Date(s.fast_start)) / 3600000).toFixed(1)
                : null;
              return (
                <div key={s.id} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-base font-medium text-white">
                      {new Date(s.fast_start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-white/40">
                      {new Date(s.fast_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {s.fast_end && ` → ${new Date(s.fast_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hours && <span className="text-base font-medium text-[#B8A860]">{hours}h</span>}
                    <Badge
                      className={
                        s.completed
                          ? 'bg-green-500/10 text-green-500 border-0 text-sm px-3 py-1'
                          : 'bg-red-500/10 text-red-500 border-0 text-sm px-3 py-1'
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
