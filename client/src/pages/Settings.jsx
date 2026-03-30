import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

const IF_PROTOCOLS = [
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'Custom', hours: null },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly Active' },
  { value: 'moderate', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export default function Settings() {
  const [form, setForm] = useState({
    displayName: '',
    dailyCalorieGoal: 2000,
    fastingHours: 16,
    fastingProtocol: '16:8',
    currentWeight: '',
    goalWeight: '',
    heightFeet: '',
    heightInches: '',
    age: '',
    sex: '',
    activityLevel: 'moderate',
    weeklyLossGoal: 1.0,
  });
  const [customHours, setCustomHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [recalcResult, setRecalcResult] = useState(null);

  useEffect(() => {
    api.auth.me().then((data) => {
      const u = data.user;
      const totalInches = u.height_inches || 0;
      setForm({
        displayName: u.display_name || '',
        dailyCalorieGoal: u.daily_calorie_goal || 2000,
        fastingHours: u.fasting_hours || 16,
        fastingProtocol: u.fasting_protocol || '16:8',
        currentWeight: u.current_weight || '',
        goalWeight: u.goal_weight || '',
        heightFeet: totalInches ? Math.floor(totalInches / 12).toString() : '',
        heightInches: totalInches ? (totalInches % 12).toString() : '',
        age: u.age || '',
        sex: u.sex || '',
        activityLevel: u.activity_level || 'moderate',
        weeklyLossGoal: parseFloat(u.weekly_loss_goal) || 1.0,
      });
      if (u.fasting_protocol === 'Custom' || !['16:8', '18:6', '20:4'].includes(u.fasting_protocol)) {
        setCustomHours(u.fasting_hours?.toString() || '');
      }
    }).catch(console.error);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const hours = form.fastingProtocol === 'Custom'
        ? parseInt(customHours)
        : form.fastingHours;
      const totalInches = (parseInt(form.heightFeet) || 0) * 12 + (parseInt(form.heightInches) || 0);
      await api.auth.updateProfile({
        displayName: form.displayName,
        dailyCalorieGoal: parseInt(form.dailyCalorieGoal),
        fastingHours: hours,
        fastingProtocol: form.fastingProtocol === 'Custom' ? `${hours}:${24 - hours}` : form.fastingProtocol,
        currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : undefined,
        goalWeight: form.goalWeight ? parseFloat(form.goalWeight) : undefined,
        heightInches: totalInches || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        sex: form.sex || undefined,
        activityLevel: form.activityLevel,
        weeklyLossGoal: form.weeklyLossGoal,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function recalculateCalories() {
    const totalInches = (parseInt(form.heightFeet) || 0) * 12 + (parseInt(form.heightInches) || 0);
    if (!form.currentWeight || !totalInches || !form.age || !form.sex) {
      setError('Fill in weight, height, age, and sex to recalculate.');
      return;
    }
    try {
      const result = await api.auth.calculateCalories({
        weightLbs: parseFloat(form.currentWeight),
        heightInches: totalInches,
        age: parseInt(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        weeklyLossGoal: form.weeklyLossGoal,
      });
      setRecalcResult(result);
      setForm((prev) => ({ ...prev, dailyCalorieGoal: result.recommended }));
    } catch (err) {
      setError(err.message);
    }
  }

  function selectProtocol(p) {
    if (p.hours) {
      setForm((prev) => ({ ...prev, fastingProtocol: p.label, fastingHours: p.hours }));
    } else {
      setForm((prev) => ({ ...prev, fastingProtocol: 'Custom' }));
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Profile</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                min="13"
                max="120"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  max="8"
                  value={form.heightFeet}
                  onChange={(e) => setForm({ ...form, heightFeet: e.target.value })}
                  placeholder="Feet"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">ft</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={form.heightInches}
                  onChange={(e) => setForm({ ...form, heightInches: e.target.value })}
                  placeholder="Inches"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Weight Goals</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (lbs)</label>
              <input
                type="number"
                min="50"
                max="800"
                step="0.1"
                value={form.currentWeight}
                onChange={(e) => setForm({ ...form, currentWeight: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Weight (lbs)</label>
              <input
                type="number"
                min="50"
                max="800"
                step="0.1"
                value={form.goalWeight}
                onChange={(e) => setForm({ ...form, goalWeight: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
              <select
                value={form.activityLevel}
                onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loss Goal</label>
              <select
                value={form.weeklyLossGoal}
                onChange={(e) => setForm({ ...form, weeklyLossGoal: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value={0.5}>0.5 lbs/week</option>
                <option value={1.0}>1 lb/week</option>
                <option value={1.5}>1.5 lbs/week</option>
                <option value={2.0}>2 lbs/week</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={recalculateCalories}
            className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold py-2 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Recalculate Recommended Calories
          </button>
          {recalcResult && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-center text-sm">
              <span className="font-bold text-primary-700">{recalcResult.recommended} cal/day</span>
              <span className="text-gray-500 ml-2">(TDEE: {recalcResult.tdee} - {recalcResult.dailyDeficit} deficit)</span>
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Nutrition</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calorie Goal</label>
            <input
              type="number"
              min="500"
              max="5000"
              value={form.dailyCalorieGoal}
              onChange={(e) => setForm({ ...form, dailyCalorieGoal: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Fasting */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Fasting Protocol</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IF_PROTOCOLS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectProtocol(p)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  form.fastingProtocol === p.label
                    ? 'bg-primary-500 text-gray-900 border-primary-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {form.fastingProtocol === 'Custom' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fasting hours (e.g. 14)</label>
              <input
                type="number"
                min="8"
                max="23"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="e.g. 14"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
            Settings saved!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
