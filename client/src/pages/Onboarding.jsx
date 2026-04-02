import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ease = [0.16, 1, 0.3, 1];

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

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const dirRef = useRef(1);
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
    dirRef.current = 1;
    setStep((s) => s + 1);
  }

  function back() {
    setError('');
    dirRef.current = -1;
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
      next();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20';
  const labelClass = 'block text-xs uppercase tracking-[0.15em] text-white/60 mb-2';
  const btnBack = 'flex-1 border border-white/[0.08] text-white/60 py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:border-white/20 hover:text-white';
  const btnPrimary = 'flex-1 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 font-medium';
  const selectionBtn = (active) => `w-full text-left px-5 py-4 border transition-all duration-300 ${active ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-white/[0.08] text-white/60 hover:border-white/20'}`;

  const firstName = firebaseUser?.displayName?.split(' ')[0] || 'there';
  const totalSteps = 8;

  const steps = [
    // Step 0: Welcome
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">{firstName}, welcome to FastTrack!</h2>
        <p className="text-sm text-white/60 mb-10 leading-relaxed">We have a few questions for you to optimize your intermittent fasting experience. In less than a minute, you'll be on your way!</p>
        <button onClick={next} className={`w-full ${btnPrimary}`}>
          Continue
        </button>
      </div>
    ),

    // Step 1: Sex
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">Let's get started!</h2>
        <label className={labelClass}>What's your biological sex?</label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {['male', 'female'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ sex: s })}
              className={`py-4 text-sm uppercase tracking-[0.15em] font-medium border transition-all duration-300 ${
                form.sex === s
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-white/[0.08] text-white/60 hover:border-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40 mb-8">Used for accurate calorie calculation (Mifflin-St Jeor formula).</p>
        <button onClick={next} disabled={!form.sex} className={`w-full ${btnPrimary}`}>
          Continue
        </button>
      </div>
    ),

    // Step 2: Age + Height
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">About You</h2>
        <div className="space-y-6 mb-8">
          <div>
            <label className={labelClass}>Age</label>
            <input type="number" min="13" max="120" value={form.age}
              onChange={(e) => update({ age: e.target.value })} placeholder="e.g. 28" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input type="number" min="3" max="8" value={form.heightFeet}
                  onChange={(e) => update({ heightFeet: e.target.value })} placeholder="Feet" className={inputClass} />
                <span className="absolute right-0 top-3 text-xs text-white/30">ft</span>
              </div>
              <div className="relative">
                <input type="number" min="0" max="11" value={form.heightInches}
                  onChange={(e) => update({ heightInches: e.target.value })} placeholder="Inches" className={inputClass} />
                <span className="absolute right-0 top-3 text-xs text-white/30">in</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} disabled={!form.age || !form.heightFeet} className={btnPrimary}>Continue</button>
        </div>
      </div>
    ),

    // Step 3: Weight
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">Your Weight Goals</h2>
        <div className="space-y-6 mb-8">
          <div>
            <label className={labelClass}>Current Weight (lbs)</label>
            <input type="number" min="50" max="800" step="0.1" value={form.currentWeight}
              onChange={(e) => update({ currentWeight: e.target.value })} placeholder="e.g. 185" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Goal Weight (lbs)</label>
            <input type="number" min="50" max="800" step="0.1" value={form.goalWeight}
              onChange={(e) => update({ goalWeight: e.target.value })} placeholder="e.g. 165" className={inputClass} />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} disabled={!form.currentWeight || !form.goalWeight} className={btnPrimary}>Continue</button>
        </div>
      </div>
    ),

    // Step 4: Activity Level + Loss Rate
    () => (
      <div className="flex flex-col justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">Activity & Goals</h2>
        <div className="space-y-8 mb-8">
          <div>
            <label className={labelClass}>Activity Level</label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button key={a.value} type="button" onClick={() => update({ activityLevel: a.value })}
                  className={selectionBtn(form.activityLevel === a.value)}>
                  <span className="text-sm font-medium block">{a.label}</span>
                  <span className="text-xs text-white/40 block mt-0.5">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Weight Loss Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {LOSS_RATES.map((r) => (
                <button key={r.value} type="button" onClick={() => update({ weeklyLossGoal: r.value })}
                  className={selectionBtn(form.weeklyLossGoal === r.value)}>
                  <span className="text-sm font-medium block">{r.label}</span>
                  <span className="text-xs text-white/40 block mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={calculateCalories} className={btnPrimary}>Calculate My Plan</button>
        </div>
      </div>
    ),

    // Step 5: Calorie Recommendation
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">Your Recommended Plan</h2>
        <p className="text-sm text-white/60 mb-8">Based on your stats, here's what we recommend:</p>

        {recommended && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-5xl sm:text-6xl font-display font-bold text-primary-500">{recommended.recommended}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-primary-500/70 mt-2">calories per day</p>
            </div>
            <motion.div
              className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease }}
            />
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-2xl font-display text-white">{recommended.tdee}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Maintenance (TDEE)</p>
              </div>
              <div>
                <p className="text-2xl font-display text-white">-{recommended.dailyDeficit}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Daily deficit</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <label className={labelClass}>Daily Calorie Goal</label>
          <input type="number" min="1200" max="5000" value={form.dailyCalorieGoal}
            onChange={(e) => update({ dailyCalorieGoal: e.target.value })} className={inputClass} />
          <p className="text-xs text-white/40 mt-2">You can adjust this anytime in Settings.</p>
        </div>

        <div className="flex gap-4">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={next} className={btnPrimary}>Continue</button>
        </div>
      </div>
    ),

    // Step 6: Fasting Protocol
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">Choose Your Fasting Schedule</h2>
        <p className="text-sm text-white/60 mb-8">Select an intermittent fasting protocol:</p>
        <div className="space-y-2 mb-8">
          {IF_PROTOCOLS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => update({ fastingHours: p.hours, fastingProtocol: p.label })}
              className={selectionBtn(form.fastingProtocol === p.label)}
            >
              <span className="text-sm font-medium block">{p.label}</span>
              <span className="text-xs text-white/40 block mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-4">
          <button onClick={back} className={btnBack}>Back</button>
          <button onClick={finish} disabled={saving} className={btnPrimary}>
            {saving ? 'Setting up...' : 'Finish Setup'}
          </button>
        </div>
      </div>
    ),

    // Step 7: Congratulations
    () => (
      <div className="flex flex-col min-h-[50vh] justify-center text-center">
        <div className="text-6xl sm:text-7xl mb-6">&#127881;</div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
          You're already on the right Track to better eating habits.
        </h2>
        <p className="text-xl font-display text-primary-500 mb-8">
          You've got this, {firstName}!
        </p>
        <p className="text-sm text-white/40 mb-10">Your personalized plan is ready. Let's get started.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full ${btnPrimary}`}
        >
          Go to Dashboard
        </button>
      </div>
    ),
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Progress dots */}
      <motion.div
        className="flex justify-center gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === step ? 'bg-primary-500 scale-125' : i < step ? 'bg-primary-500/40' : 'bg-white/10'
            }`}
          />
        ))}
      </motion.div>

      {/* Step content with AnimatePresence */}
      <div className="w-full max-w-xl mx-auto relative">
        <AnimatePresence mode="wait" custom={dirRef.current}>
          <motion.div
            key={step}
            custom={dirRef.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease }}
          >
            {steps[step]()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
