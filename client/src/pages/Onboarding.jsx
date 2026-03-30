import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Intense exercise + physical job' },
];

const IF_PROTOCOLS = [
  { label: '16:8', hours: 16, desc: '16h fast, 8h eating — most popular' },
  { label: '18:6', hours: 18, desc: '18h fast, 6h eating — moderate' },
  { label: '20:4', hours: 20, desc: '20h fast, 4h eating — advanced' },
];

const LOSS_RATES = [
  { value: 0.5, label: '0.5 lbs/week', desc: 'Gentle & sustainable' },
  { value: 1.0, label: '1 lb/week', desc: 'Recommended' },
  { value: 1.5, label: '1.5 lbs/week', desc: 'Moderate' },
  { value: 2.0, label: '2 lbs/week', desc: 'Aggressive' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recommended, setRecommended] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sex: '',
    age: '',
    heightFeet: '',
    heightInches: '',
    currentWeight: '',
    goalWeight: '',
    activityLevel: 'moderate',
    weeklyLossGoal: 1.0,
    fastingHours: 16,
    fastingProtocol: '16:8',
    dailyCalorieGoal: 2000,
  });

  function update(fields) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function next() {
    setError('');
    setStep((s) => s + 1);
  }
  function back() {
    setError('');
    setStep((s) => s - 1);
  }

  async function calculateCalories() {
    const totalInches = (parseInt(form.heightFeet) || 0) * 12 + (parseInt(form.heightInches) || 0);
    try {
      const result = await api.auth.calculateCalories({
        weightLbs: parseFloat(form.currentWeight),
        heightInches: totalInches,
        age: parseInt(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        weeklyLossGoal: form.weeklyLossGoal,
      });
      setRecommended(result);
      update({ dailyCalorieGoal: result.recommended });
    } catch (err) {
      console.error(err);
    }
    next();
  }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      const totalInches = (parseInt(form.heightFeet) || 0) * 12 + (parseInt(form.heightInches) || 0);
      await api.auth.updateProfile({
        currentWeight: parseFloat(form.currentWeight),
        goalWeight: parseFloat(form.goalWeight),
        heightInches: totalInches,
        age: parseInt(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        weeklyLossGoal: form.weeklyLossGoal,
        fastingHours: form.fastingHours,
        fastingProtocol: form.fastingProtocol,
        dailyCalorieGoal: parseInt(form.dailyCalorieGoal),
        onboardingComplete: true,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    // Step 0: Welcome + Sex
    () => (
      <>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to FastTrack!</h2>
        <p className="text-gray-500 text-sm mb-6">Let's set up your profile so we can personalize your experience.</p>
        <label className="block text-sm font-medium text-gray-700 mb-3">What's your biological sex?</label>
        <div className="grid grid-cols-2 gap-3">
          {['male', 'female'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ sex: s })}
              className={`py-3 rounded-lg text-sm font-semibold border transition-colors capitalize ${
                form.sex === s
                  ? 'bg-primary-500 text-gray-900 border-primary-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Used for accurate calorie calculation (Mifflin-St Jeor formula).</p>
        <button
          onClick={next}
          disabled={!form.sex}
          className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
        >
          Continue
        </button>
      </>
    ),

    // Step 1: Age + Height
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-4">About You</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              min="13"
              max="120"
              value={form.age}
              onChange={(e) => update({ age: e.target.value })}
              placeholder="e.g. 28"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
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
                  onChange={(e) => update({ heightFeet: e.target.value })}
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
                  onChange={(e) => update({ heightInches: e.target.value })}
                  placeholder="Inches"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">in</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
          <button
            onClick={next}
            disabled={!form.age || !form.heightFeet}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </>
    ),

    // Step 2: Weight
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Weight Goals</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (lbs)</label>
            <input
              type="number"
              min="50"
              max="800"
              step="0.1"
              value={form.currentWeight}
              onChange={(e) => update({ currentWeight: e.target.value })}
              placeholder="e.g. 185"
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
              onChange={(e) => update({ goalWeight: e.target.value })}
              placeholder="e.g. 165"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
          <button
            onClick={next}
            disabled={!form.currentWeight || !form.goalWeight}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </>
    ),

    // Step 3: Activity Level + Loss Rate
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Activity & Goals</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => update({ activityLevel: a.value })}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    form.activityLevel === a.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-gray-800">{a.label}</span>
                  <span className="block text-xs text-gray-500">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight Loss Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {LOSS_RATES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update({ weeklyLossGoal: r.value })}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    form.weeklyLossGoal === r.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-gray-800">{r.label}</span>
                  <span className="block text-xs text-gray-500">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
          <button
            onClick={calculateCalories}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            Calculate My Plan
          </button>
        </div>
      </>
    ),

    // Step 4: Calorie Recommendation
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your Recommended Plan</h2>
        <p className="text-gray-500 text-sm mb-5">Based on your stats, here's what we recommend:</p>

        {recommended && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-5 space-y-3">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-700">{recommended.recommended}</p>
              <p className="text-sm text-primary-600 font-medium">calories per day</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-xs text-gray-600">
              <div className="bg-white rounded-lg p-2">
                <p className="font-bold text-gray-800">{recommended.tdee}</p>
                <p>Maintenance (TDEE)</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="font-bold text-gray-800">-{recommended.dailyDeficit}</p>
                <p>Daily deficit</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calorie Goal</label>
          <input
            type="number"
            min="1200"
            max="5000"
            value={form.dailyCalorieGoal}
            onChange={(e) => update({ dailyCalorieGoal: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <p className="text-xs text-gray-400 mt-1">You can adjust this anytime in Settings.</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
          <button
            onClick={next}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </>
    ),

    // Step 5: Fasting Protocol
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Choose Your Fasting Schedule</h2>
        <p className="text-gray-500 text-sm mb-5">Select an intermittent fasting protocol:</p>
        <div className="space-y-2">
          {IF_PROTOCOLS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => update({ fastingHours: p.hours, fastingProtocol: p.label })}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                form.fastingProtocol === p.label
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <span className="text-lg font-bold text-gray-800">{p.label}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
          <button
            onClick={finish}
            disabled={saving}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Setting up…' : "Let's Go!"}
          </button>
        </div>
      </>
    ),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-8 w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary-500' : i < step ? 'bg-primary-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {steps[step]()}
      </div>
    </div>
  );
}
