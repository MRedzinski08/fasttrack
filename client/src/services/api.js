import { auth } from './firebase.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Auth
export const api = {
  auth: {
    register: (data) =>
      fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    me: () => request('/api/auth/me'),
    updateProfile: (data) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    calculateCalories: (data) => request('/api/auth/calculate-calories', { method: 'POST', body: JSON.stringify(data) }),
  },
  meals: {
    getToday: () => request('/api/meals'),
    getByDate: (date) => request(`/api/meals?date=${date}`),
    log: (data) => request('/api/meals', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/meals/${id}`, { method: 'DELETE' }),
    recent: () => request('/api/meals/recent'),
  },
  fasting: {
    current: () => request('/api/fasting/current'),
    start: (targetHours) => request('/api/fasting/start', { method: 'POST', body: JSON.stringify({ targetHours }) }),
    break: () => request('/api/fasting/break', { method: 'POST' }),
    startEating: () => request('/api/fasting/start-eating', { method: 'POST' }),
    logDifficulty: (sessionId, rating) => request('/api/fasting/difficulty', { method: 'POST', body: JSON.stringify({ sessionId, rating }) }),
    getDifficulty: () => request('/api/fasting/difficulty'),
    history: (limit) => request(`/api/fasting/history?limit=${limit || 30}`),
  },
  food: {
    search: (q) => request(`/api/food/search?q=${encodeURIComponent(q)}`),
    saved: () => request('/api/food/saved'),
    save: (data) => request('/api/food/saved', { method: 'POST', body: JSON.stringify(data) }),
    deleteSaved: (id) => request(`/api/food/saved/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    summary: () => request('/api/dashboard/summary'),
  },
  ai: {
    summary: () => request('/api/ai/summary'),
    // chat uses streaming — handled separately in ChatPanel
  },
  billing: {
    checkout: () => request('/api/billing/checkout', { method: 'POST' }),
    status: () => request('/api/billing/status'),
    checkoutSuccess: (sessionId) => request('/api/billing/checkout-success', { method: 'POST', body: JSON.stringify({ sessionId }) }),
    cancel: () => request('/api/billing/cancel', { method: 'POST' }),
  },
  photo: {
    analyze: (imageBase64) => request('/api/photo/analyze', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
  },
  barcode: {
    lookup: (code) => request(`/api/barcode/lookup?code=${encodeURIComponent(code)}`),
  },
  mealPrep: {
    get: () => request('/api/meal-prep'),
    add: (data) => request('/api/meal-prep', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/meal-prep/${id}`, { method: 'DELETE' }),
    log: (id) => request(`/api/meal-prep/${id}/log`, { method: 'POST' }),
  },
  exercise: {
    list: (q, category) => request(`/api/exercise/list?${q ? `q=${encodeURIComponent(q)}` : ''}${category ? `&category=${category}` : ''}`),
    log: (data) => request('/api/exercise', { method: 'POST', body: JSON.stringify(data) }),
    today: () => request('/api/exercise/today'),
    delete: (id) => request(`/api/exercise/${id}`, { method: 'DELETE' }),
  },
  history: {
    calories: (days) => request(`/api/history/calories?days=${days || 7}`),
    fasting: (days) => request(`/api/history/fasting?days=${days || 30}`),
    weeklyReport: () => request('/api/history/weekly-report'),
  },
  hydration: {
    get: () => request('/api/hydration'),
    add: () => request('/api/hydration', { method: 'POST' }),
    remove: () => request('/api/hydration', { method: 'DELETE' }),
  },
  mealBuilder: {
    suggest: (data) => request('/api/meal-builder/suggest', { method: 'POST', body: JSON.stringify(data) }),
  },
  tdee: {
    logWeight: (weight) => request('/api/tdee/weight', { method: 'POST', body: JSON.stringify({ weight }) }),
    weightHistory: (days) => request(`/api/tdee/weight?days=${days || 30}`),
    calculate: () => request('/api/tdee/calculate'),
  },
  mood: {
    log: (data) => request('/api/mood', { method: 'POST', body: JSON.stringify(data) }),
    history: (days) => request(`/api/mood/history?days=${days || 14}`),
    insights: () => request('/api/mood/insights'),
  },
  grocery: {
    generate: (days) => request('/api/grocery/generate', { method: 'POST', body: JSON.stringify({ days }) }),
  },
};

export async function streamChat(message, history, onChunk) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) throw new Error('Chat request failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) onChunk(parsed.content);
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
