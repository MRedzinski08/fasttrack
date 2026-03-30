import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

const IF_PROTOCOLS = [
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'Custom', hours: null },
];

export default function Settings() {
  const [form, setForm] = useState({
    displayName: '',
    dailyCalorieGoal: 2000,
    fastingHours: 16,
    fastingProtocol: '16:8',
  });
  const [customHours, setCustomHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auth.me().then((data) => {
      const u = data.user;
      setForm({
        displayName: u.display_name || '',
        dailyCalorieGoal: u.daily_calorie_goal || 2000,
        fastingHours: u.fasting_hours || 16,
        fastingProtocol: u.fasting_protocol || '16:8',
      });
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

      await api.auth.updateProfile({
        displayName: form.displayName,
        dailyCalorieGoal: parseInt(form.dailyCalorieGoal),
        fastingHours: hours,
        fastingProtocol: form.fastingProtocol === 'Custom' ? `${hours}:${24 - hours}` : form.fastingProtocol,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calorie Goal</label>
          <input
            type="number"
            min="500"
            max="5000"
            value={form.dailyCalorieGoal}
            onChange={(e) => setForm({ ...form, dailyCalorieGoal: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fasting Protocol</label>
          <div className="grid grid-cols-4 gap-2">
            {IF_PROTOCOLS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectProtocol(p)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  form.fastingProtocol === p.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {form.fastingProtocol === 'Custom' && (
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Fasting hours (e.g. 14)</label>
              <input
                type="number"
                min="8"
                max="23"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="e.g. 14"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
