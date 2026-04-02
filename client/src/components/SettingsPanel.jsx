import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

const ease = [0.16, 1, 0.3, 1];

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

const TAB_ICONS = {
  profile: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  ),
  weight: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43 1.43 1.43 2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
    </svg>
  ),
  nutrition: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
    </svg>
  ),
  fasting: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  ),
  subscription: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  ),
};

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'weight', label: 'Weight' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'fasting', label: 'Fasting' },
  { id: 'subscription', label: 'Pro' },
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
  const [subData, setSubData] = useState({ tier: 'free', status: 'none', endDate: null });
  const [subLoading, setSubLoading] = useState(false);
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
    api.billing.status().then(setSubData).catch(console.error);
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

  const inputClass = 'w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20';
  const labelClass = 'block text-xs uppercase tracking-[0.15em] text-white/60 mb-2';
  const selectClass = 'w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer [&>option]:bg-[#080808] [&>option]:text-white';

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      <motion.div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[35vw] sm:min-w-[320px] z-50 flex flex-col bg-[#080808] border-l border-white/[0.06] ${
          isOpen ? '' : 'pointer-events-none'
        }`}
        initial={false}
        animate={isOpen ? { x: 0, opacity: 1 } : { x: 30, opacity: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <span className="text-xs uppercase tracking-[0.2em] text-primary-500">SETTINGS</span>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Layout: tabs + content */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-row sm:flex-col overflow-x-auto border-b sm:border-b-0 sm:border-r border-white/[0.06] shrink-0 sm:w-[140px] sm:py-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 text-xs sm:px-4 sm:py-3 transition-all duration-300 ${
                  tab === t.id
                    ? 'text-primary-500 sm:border-l-2 border-b-2 sm:border-b-0 border-primary-500'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span className="text-primary-500">{TAB_ICONS[t.id]}</span>
                <span className="hidden sm:inline text-xs uppercase tracking-[0.1em]">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {tab === 'profile' && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm uppercase tracking-[0.15em] text-primary-500 mb-4">Profile</h3>
                <div>
                  <label className={labelClass}>Display Name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input
                      type="number"
                      min="13"
                      max="120"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Sex</label>
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
                  <label className={labelClass}>Height</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        min="3"
                        max="8"
                        value={form.heightFeet}
                        onChange={(e) => setForm({ ...form, heightFeet: e.target.value })}
                        placeholder="Feet"
                        className={inputClass}
                      />
                      <span className="absolute right-0 top-3 text-xs text-white/30">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={form.heightInches}
                        onChange={(e) => setForm({ ...form, heightInches: e.target.value })}
                        placeholder="Inches"
                        className={inputClass}
                      />
                      <span className="absolute right-0 top-3 text-xs text-white/30">in</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'weight' && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm uppercase tracking-[0.15em] text-primary-500 mb-4">Weight Goals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Current Weight (lbs)</label>
                    <input
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
                    <label className={labelClass}>Goal Weight (lbs)</label>
                    <input
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
                    <label className={labelClass}>Activity Level</label>
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
                    <label className={labelClass}>Loss Goal</label>
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
                <button
                  type="button"
                  onClick={recalculateCalories}
                  className="w-full border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black py-2 text-xs uppercase tracking-[0.15em] transition-all duration-300"
                >
                  Recalculate Recommended Calories
                </button>
                {recalcResult && (
                  <div className="text-center py-3">
                    <span className="text-sm font-display text-primary-500">{recalcResult.recommended} cal/day</span>
                    <span className="text-xs text-white/30 ml-2">(TDEE: {recalcResult.tdee} - {recalcResult.dailyDeficit} deficit)</span>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'nutrition' && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm uppercase tracking-[0.15em] text-primary-500 mb-4">Nutrition</h3>
                <p className="text-xs text-white/40 mb-4">To re-calculate your estimated calorie goal, go to the Weight tab in Settings.</p>
                <div>
                  <label className={labelClass}>Daily Calorie Goal</label>
                  <input
                    type="number"
                    min="500"
                    max="5000"
                    value={form.dailyCalorieGoal}
                    onChange={(e) => setForm({ ...form, dailyCalorieGoal: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </motion.div>
            )}

            {tab === 'fasting' && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm uppercase tracking-[0.15em] text-primary-500 mb-4">Fasting Protocol</h3>
                <p className="text-xs text-white/40 mb-4">Select the time interval that best works for your schedule and dieting goals.</p>
                <div className="grid grid-cols-2 gap-2">
                  {IF_PROTOCOLS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => selectProtocol(p)}
                      className={`py-3 text-xs uppercase tracking-[0.15em] font-medium border transition-all duration-300 ${
                        form.fastingProtocol === p.label
                          ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                          : 'border-white/[0.08] text-white/40 hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {form.fastingProtocol === 'Custom' && (
                  <div>
                    <label className={labelClass}>Fasting hours (e.g. 14)</label>
                    <input
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
              </motion.div>
            )}

            {tab === 'subscription' && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm uppercase tracking-[0.15em] text-primary-500 mb-4">FastTrack Pro</h3>
                {subData.tier === 'pro' ? (
                  <div className="space-y-5">
                    <div className="border border-primary-500/20 p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-primary-500 text-lg">&#11088;</span>
                        <div>
                          <p className="text-sm font-display text-primary-500">Pro Member</p>
                          <p className="text-xs text-white/40">
                            {subData.status === 'canceling' ? 'Cancels' : 'Renews'} {subData.endDate ? new Date(subData.endDate).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-3">Your Pro features:</p>
                      <ul className="space-y-2 text-xs text-white/40">
                        <li className="flex items-center gap-2"><span className="text-primary-500">&#10003;</span> Meal photo logging</li>
                        <li className="flex items-center gap-2"><span className="text-primary-500">&#10003;</span> QR code food scanning</li>
                        <li className="flex items-center gap-2"><span className="text-primary-500">&#10003;</span> Meal prep scheduling</li>
                        <li className="flex items-center gap-2"><span className="text-primary-500">&#10003;</span> Extended AI coaching</li>
                      </ul>
                    </div>
                    {subData.status !== 'canceling' && (
                      <button
                        onClick={async () => {
                          setSubLoading(true);
                          try {
                            const result = await api.billing.cancel();
                            setSubData((prev) => ({ ...prev, status: result.status, endDate: result.endDate }));
                          } catch (err) { console.error(err); }
                          finally { setSubLoading(false); }
                        }}
                        disabled={subLoading}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        {subLoading ? 'Processing...' : 'Cancel subscription'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-xs text-white/40">Unlock premium features to supercharge your fasting journey.</p>
                    <div className="space-y-3">
                      {[
                        'Meal photo logging — snap a photo, AI identifies your food',
                        'QR code food scanning',
                        'Meal prep — schedule your meals for the week',
                        'Extended AI coaching with deeper insights',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-white/50">
                          <span className="text-primary-500">&#10022;</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        setSubLoading(true);
                        try {
                          const { url } = await api.billing.checkout();
                          window.location.href = url;
                        } catch (err) { console.error(err); }
                        finally { setSubLoading(false); }
                      }}
                      disabled={subLoading}
                      className="w-full bg-primary-500 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary-400 disabled:opacity-40 font-medium"
                    >
                      {subLoading ? 'Loading...' : 'Upgrade to Pro \u2014 $4.99/mo'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 sm:px-6 border-t border-white/[0.06] space-y-3">
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          {saved && (
            <motion.p
              className="text-green-400 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Settings saved!
            </motion.p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary-500 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary-400 disabled:opacity-40 font-medium"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
