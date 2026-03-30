import { useState } from 'react';
import { api } from '../services/api.js';

export default function AISummaryCard({ initialSummary }) {
  const [summary, setSummary] = useState(initialSummary || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateSummary() {
    setLoading(true);
    setError('');
    try {
      const data = await api.ai.summary();
      setSummary(data.summary);
    } catch {
      setError('Could not generate summary. Check your OpenAI API key.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-yellow-50 rounded-xl p-5 border border-primary-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary-800">AI Daily Summary</h3>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="text-xs text-primary-700 hover:text-primary-900 disabled:opacity-50 font-medium"
        >
          {loading ? 'Generating…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <div className="text-center py-3">
          <p className="text-xs text-gray-500 mb-2">No summary yet for today.</p>
          <button
            onClick={generateSummary}
            disabled={loading}
            className="text-xs bg-primary-500 hover:bg-primary-600 text-gray-900 px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
          >
            {loading ? 'Generating…' : 'Generate Summary'}
          </button>
        </div>
      )}
    </div>
  );
}
