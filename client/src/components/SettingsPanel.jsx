import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
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

const TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'weight', label: 'Weight', icon: '⚖️' },
  { id: 'nutrition', label: 'Nutrition', icon: '🍎' },
  { id: 'fasting', label: 'Fasting', icon: '⏱️' },
];

export default function SettingsPanel({ isOpen, onClose }) {
  const [tab, setTab] = useState('profile');
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
    if (!isOpen) return;
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
  }, [isOpen]);

  async function handleSave() {
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

  const inputClass = "bg-white/5 border-white/10 text-primary-50 placeholder:text-white/20 !h-14 !text-base";
  const selectClass = "w-full border border-white/10 bg-white/5 text-primary-50 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "text-base font-medium text-white/60 mb-2";

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[35vw] sm:min-w-[380px] z-50 flex flex-col transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-medium text-primary-50">Settings</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors text-xl">
            ✕
          </button>
        </div>

        {/* Layout: sidebar tabs + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Vertical tabs */}
          <div className="flex flex-col border-r border-white/10 w-[160px] shrink-0 py-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className={`flex items-center gap-3 px-5 py-4 text-base font-medium text-left transition-colors ${
                  tab === t.id
                    ? 'text-primary-500 bg-white/5 border-r-2 border-primary-500'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/3'
                }`}
              >
                <span className="text-lg" style={{ filter: 'grayscale(1) brightness(1.5) sepia(1) hue-rotate(10deg) saturate(3)' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {tab === 'profile' && (
            <>
              <h3 className="text-2xl font-medium text-primary-500 mb-2">Profile</h3>
              <div>
                <Label className={labelClass}>Display Name</Label>
                <Input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Age</Label>
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
                  <Label className={labelClass}>Sex</Label>
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
                <Label className={labelClass}>Height</Label>
                <div className="grid grid-cols-2 gap-4">
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
                    <span className="absolute right-3 top-2.5 text-xs text-white/30">ft</span>
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
                    <span className="absolute right-3 top-2.5 text-xs text-white/30">in</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'weight' && (
            <>
              <h3 className="text-2xl font-medium text-primary-500 mb-2">Weight Goals</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Current Weight (lbs)</Label>
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
                  <Label className={labelClass}>Goal Weight (lbs)</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Activity Level</Label>
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
                  <Label className={labelClass}>Loss Goal</Label>
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
                className="w-full border-white/10 bg-white/5 text-primary-500 hover:bg-white/10 hover:text-primary-400 font-medium text-base !py-3 !h-auto"
              >
                Recalculate Recommended Calories
              </Button>
              {recalcResult && (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center text-base">
                  <span className="font-medium text-primary-500">{recalcResult.recommended} cal/day</span>
                  <span className="text-white/40 ml-2">(TDEE: {recalcResult.tdee} - {recalcResult.dailyDeficit} deficit)</span>
                </div>
              )}
            </>
          )}

          {tab === 'nutrition' && (
            <>
              <h3 className="text-2xl font-medium text-primary-500 mb-2">Nutrition</h3>
              <p className="text-base text-white/60 mb-5">To re-calculate your estimated calorie goal, go to the Weight tab in Settings.</p>
              <div>
                <Label className={labelClass}>Daily Calorie Goal</Label>
                <Input
                  type="number"
                  min="500"
                  max="5000"
                  value={form.dailyCalorieGoal}
                  onChange={(e) => setForm({ ...form, dailyCalorieGoal: e.target.value })}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {tab === 'fasting' && (
            <>
              <h3 className="text-2xl font-medium text-primary-500 mb-2">Fasting Protocol</h3>
              <p className="text-base text-white/60 mb-5">Select the time interval that best works for your schedule and dieting goals.</p>
              <div className="grid grid-cols-2 gap-4">
                {IF_PROTOCOLS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant={form.fastingProtocol === p.label ? 'default' : 'outline'}
                    onClick={() => selectProtocol(p)}
                    className={
                      form.fastingProtocol === p.label
                        ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium !py-5 !text-xl !h-auto'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-primary-50 font-medium !py-5 !text-xl !h-auto'
                    }
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              {form.fastingProtocol === 'Custom' && (
                <div>
                  <Label className="text-xs text-white/40 mb-1">Fasting hours (e.g. 14)</Label>
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
            </>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/10 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-base rounded-xl px-4 py-3">{error}</div>
          )}
          {saved && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-base rounded-xl px-4 py-3">
              Settings saved!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium !py-4 !text-lg !h-auto"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </>
  );
}
