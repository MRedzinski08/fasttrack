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
  },
  fasting: {
    current: () => request('/api/fasting/current'),
    start: (targetHours) => request('/api/fasting/start', { method: 'POST', body: JSON.stringify({ targetHours }) }),
    break: () => request('/api/fasting/break', { method: 'POST' }),
    history: (limit) => request(`/api/fasting/history?limit=${limit || 30}`),
  },
  food: {
    search: (q) => request(`/api/food/search?q=${encodeURIComponent(q)}`),
  },
  dashboard: {
    summary: () => request('/api/dashboard/summary'),
  },
  ai: {
    summary: () => request('/api/ai/summary'),
    // chat uses streaming — handled separately in ChatPanel
  },
  history: {
    calories: (days) => request(`/api/history/calories?days=${days || 7}`),
    fasting: (days) => request(`/api/history/fasting?days=${days || 30}`),
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
