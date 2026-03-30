import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const inputClass = "bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-10";
  const selectClass = "w-full border border-[#2E2B20] bg-[#22201A] text-primary-50 placeholder-[#5A5228] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-medium text-primary-50 mb-6">Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="font-medium text-primary-50">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-[#B8A860] mb-1">Display Name</Label>
              <Input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Age</Label>
                <Input
                  type="number"
                  min="13"
                  max="120"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Sex</Label>
                <select
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value })}
                  className={selectClass}
                >
                  <option value="">--</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#B8A860] mb-1">Height</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    min="3"
                    max="8"
                    value={form.heightFeet}
                    onChange={(e) => setForm({ ...form, heightFeet: e.target.value })}
                    placeholder="Feet"
                    className={inputClass}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#5A5228]">ft</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="11"
                    value={form.heightInches}
                    onChange={(e) => setForm({ ...form, heightInches: e.target.value })}
                    placeholder="Inches"
                    className={inputClass}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#5A5228]">in</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight */}
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="font-medium text-primary-50">Weight Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Current Weight (lbs)</Label>
                <Input
                  type="number"
                  min="50"
                  max="800"
                  step="0.1"
                  value={form.currentWeight}
                  onChange={(e) => setForm({ ...form, currentWeight: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Goal Weight (lbs)</Label>
                <Input
                  type="number"
                  min="50"
                  max="800"
                  step="0.1"
                  value={form.goalWeight}
                  onChange={(e) => setForm({ ...form, goalWeight: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Activity Level</Label>
                <select
                  value={form.activityLevel}
                  onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                  className={selectClass}
                >
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#B8A860] mb-1">Loss Goal</Label>
                <select
                  value={form.weeklyLossGoal}
                  onChange={(e) => setForm({ ...form, weeklyLossGoal: parseFloat(e.target.value) })}
                  className={selectClass}
                >
                  <option value={0.5}>0.5 lbs/week</option>
                  <option value={1.0}>1 lb/week</option>
                  <option value={1.5}>1.5 lbs/week</option>
                  <option value={2.0}>2 lbs/week</option>
                </select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={recalculateCalories}
              className="w-full border-[#2E2B20] bg-transparent text-primary-500 hover:bg-[#2E2B20] hover:text-primary-50 font-medium text-sm"
            >
              Recalculate Recommended Calories
            </Button>
            {recalcResult && (
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 text-center text-sm">
                <span className="font-medium text-primary-500">{recalcResult.recommended} cal/day</span>
                <span className="text-[#706530] ml-2">(TDEE: {recalcResult.tdee} - {recalcResult.dailyDeficit} deficit)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="font-medium text-primary-50">Nutrition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-[#B8A860] mb-1">Daily Calorie Goal</Label>
              <Input
                type="number"
                min="500"
                max="5000"
                value={form.dailyCalorieGoal}
                onChange={(e) => setForm({ ...form, dailyCalorieGoal: e.target.value })}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fasting */}
        <Card className="bg-[#1A1810] border-[#2E2B20] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="font-medium text-primary-50">Fasting Protocol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IF_PROTOCOLS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant={form.fastingProtocol === p.label ? 'default' : 'outline'}
                  onClick={() => selectProtocol(p)}
                  className={
                    form.fastingProtocol === p.label
                      ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium'
                      : 'border-[#2E2B20] bg-[#1A1810] text-[#B8A860] hover:border-primary-400 hover:bg-[#2E2B20] hover:text-primary-50 font-medium'
                  }
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {form.fastingProtocol === 'Custom' && (
              <div>
                <Label className="text-xs text-[#706530] mb-1">Fasting hours (e.g. 14)</Label>
                <Input
                  type="number"
                  min="8"
                  max="23"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="e.g. 14"
                  className={inputClass}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>
        )}
        {saved && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm rounded-lg px-3 py-2">
            Settings saved!
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium py-2.5 px-4"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}
