import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

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
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recommended, setRecommended] = useState(null);
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();

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
    setDirection(1);
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 500);
  }
  function back() {
    setError('');
    setDirection(-1);
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 500);
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
      next();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Shared dark-theme styles
  const input = 'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400' + ' bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder-[#5A5228]';
  const label = 'block text-sm font-medium text-[#B8A860] mb-1';
  const btnBack = 'flex-1 border border-[#2E2B20] text-[#B8A860] font-medium py-2.5 rounded-lg hover:bg-[#2E2B20] transition-colors';
  const btnPrimary = 'flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-gray-900 font-medium py-2.5 rounded-lg transition-colors';

  const steps = [
    // Step 0: Welcome + Sex
    () => (
      <>
        <h2 className="text-2xl font-medium text-primary-50 mb-2">Welcome to FastTrack!</h2>
        <p className="text-[#706530] text-sm mb-6">Let's set up your profile so we can personalize your experience.</p>
        <label className="block text-sm font-medium text-[#B8A860] mb-3">What's your biological sex?</label>
        <div className="grid grid-cols-2 gap-3">
          {['male', 'female'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ sex: s })}
              className={`py-3 rounded-lg text-sm font-medium border transition-colors capitalize ${
                form.sex === s
                  ? 'bg-primary-500 text-gray-900 border-primary-500'
                  : 'bg-[#22201A] text-[#B8A860] border-[#2E2B20] hover:border-primary-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#5A5228] mt-2">Used for accurate calorie calculation (Mifflin-St Jeor formula).</p>
        <button
          onClick={next}
          disabled={!form.sex}
          className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-gray-900 font-medium py-2.5 rounded-lg transition-colors"
        >
          Continue
        </button>
      </>
    ),

    // Step 1: Age + Height
    () => (
      <>
        <h2 className="text-xl font-medium text-primary-50 mb-4">About You</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Age</label>
            <input type="number" min="13" max="120" value={form.age}
              onChange={(e) => update({ age: e.target.value })} placeholder="e.g. 28" className={input} />
          </div>
          <div>
            <label className={label}>Height</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input type="number" min="3" max="8" value={form.heightFeet}
                  onChange={(e) => update({ heightFeet: e.target.value })} placeholder="Feet" className={input} />
                <span className="absolute right-3 top-2.5 text-xs text-[#5A5228]">ft</span>
              </div>
              <div className="relative">
                <input type="number" min="0" max="11" value={form.heightInches}
                  onChange={(e) => update({ heightInches: e.target.value })} placeholder="Inches" className={input} />
                <span className="absolute right-3 top-2.5 text-xs text-[#5A5228]">in</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} disabled={!form.age || !form.heightFeet} className={btnPrimary}>Continue</button>
        </div>
      </>
    ),

    // Step 2: Weight
    () => (
      <>
        <h2 className="text-xl font-medium text-primary-50 mb-4">Your Weight Goals</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Current Weight (lbs)</label>
            <input type="number" min="50" max="800" step="0.1" value={form.currentWeight}
              onChange={(e) => update({ currentWeight: e.target.value })} placeholder="e.g. 185" className={input} />
          </div>
          <div>
            <label className={label}>Goal Weight (lbs)</label>
            <input type="number" min="50" max="800" step="0.1" value={form.goalWeight}
              onChange={(e) => update({ goalWeight: e.target.value })} placeholder="e.g. 165" className={input} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} disabled={!form.currentWeight || !form.goalWeight} className={btnPrimary}>Continue</button>
        </div>
      </>
    ),

    // Step 3: Activity Level + Loss Rate
    () => (
      <>
        <h2 className="text-xl font-medium text-primary-50 mb-4">Activity & Goals</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#B8A860] mb-2">Activity Level</label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => update({ activityLevel: a.value })}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    form.activityLevel === a.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-[#2E2B20] hover:border-primary-400'
                  }`}
                >
                  <span className="text-sm font-medium text-primary-50">{a.label}</span>
                  <span className="block text-xs text-[#706530]">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#B8A860] mb-2">Weight Loss Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {LOSS_RATES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update({ weeklyLossGoal: r.value })}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    form.weeklyLossGoal === r.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-[#2E2B20] hover:border-primary-400'
                  }`}
                >
                  <span className="text-sm font-medium text-primary-50">{r.label}</span>
                  <span className="block text-xs text-[#706530]">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={calculateCalories} className={btnPrimary}>Calculate My Plan</button>
        </div>
      </>
    ),

    // Step 4: Calorie Recommendation
    () => (
      <>
        <h2 className="text-xl font-medium text-primary-50 mb-2">Your Recommended Plan</h2>
        <p className="text-[#706530] text-sm mb-5">Based on your stats, here's what we recommend:</p>

        {recommended && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-5 mb-5 space-y-3">
            <div className="text-center">
              <p className="text-4xl font-medium text-primary-400">{recommended.recommended}</p>
              <p className="text-sm text-primary-300 font-medium">calories per day</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-xs text-[#706530]">
              <div className="bg-[#22201A] rounded-lg p-2">
                <p className="font-medium text-primary-50">{recommended.tdee}</p>
                <p>Maintenance (TDEE)</p>
              </div>
              <div className="bg-[#22201A] rounded-lg p-2">
                <p className="font-medium text-primary-50">-{recommended.dailyDeficit}</p>
                <p>Daily deficit</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className={label}>Daily Calorie Goal</label>
          <input type="number" min="1200" max="5000" value={form.dailyCalorieGoal}
            onChange={(e) => update({ dailyCalorieGoal: e.target.value })} className={input} />
          <p className="text-xs text-[#5A5228] mt-1">You can adjust this anytime in Settings.</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} className={btnPrimary}>Continue</button>
        </div>
      </>
    ),

    // Step 5: Fasting Protocol
    () => (
      <>
        <h2 className="text-xl font-medium text-primary-50 mb-2">Choose Your Fasting Schedule</h2>
        <p className="text-[#706530] text-sm mb-5">Select an intermittent fasting protocol:</p>
        <div className="space-y-2">
          {IF_PROTOCOLS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => update({ fastingHours: p.hours, fastingProtocol: p.label })}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                form.fastingProtocol === p.label
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-[#2E2B20] hover:border-primary-400'
              }`}
            >
              <span className="text-lg font-medium text-primary-50">{p.label}</span>
              <span className="block text-xs text-[#706530] mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={finish} disabled={saving}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-gray-900 font-medium py-2.5 rounded-lg transition-colors">
            {saving ? 'Setting up…' : 'Finish Setup'}
          </button>
        </div>
      </>
    ),

    // Step 6: Congratulations
    () => {
      const firstName = firebaseUser?.displayName?.split(' ')[0] || 'there';
      return (
        <>
          <div className="text-center py-4">
            <div className="text-5xl mb-4">&#127881;</div>
            <h2 className="text-2xl font-medium text-primary-50 mb-3">
              You're already on the right Track to better eating habits.
            </h2>
            <p className="text-xl text-primary-400 font-medium mb-6">
              You've got this, {firstName}!
            </p>
            <p className="text-sm text-[#706530] mb-8">Your personalized plan is ready. Let's get started.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium py-3 rounded-lg transition-colors text-lg"
            >
              Go to Dashboard
            </button>
          </div>
        </>
      );
    },
  ];

  const slideClass = animating
    ? direction === 1
      ? 'translate-x-[-120%] opacity-0 scale-95'
      : 'translate-x-[120%] opacity-0 scale-95'
    : 'translate-x-0 opacity-100 scale-100';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden" style={{ background: '#0F0E08' }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2.5 mb-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              i === step ? 'bg-primary-500 scale-125' : i < step ? 'bg-primary-700' : 'opacity-30 bg-primary-600'
            }`}
          />
        ))}
      </div>
      {/* The entire card slides */}
      <div className={`rounded-2xl shadow-2xl p-7 sm:p-10 w-full max-w-lg transition-all duration-500 ease-in-out ${slideClass}`} style={{ background: '#1A1810' }}>
        {steps[step]()}
      </div>
    </div>
  );
}
