import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';

export default function AISummaryCard({ initialSummary }) {
  const [summary, setSummary] = useState(initialSummary || '');
  const [loading, setLoading] = useState(!initialSummary);
  const [phase, setPhase] = useState(initialSummary ? 'done' : 'loading');

  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary);
      setLoading(false);
      setPhase('done');
      return;
    }
    setLoading(true);
    setPhase('loading');
    api.ai.summary()
      .then((data) => {
        setSummary(data.summary);
        setPhase('exiting');
        setTimeout(() => {
          setLoading(false);
          setPhase('showing');
          setTimeout(() => setPhase('done'), 850);
        }, 850);
      })
      .catch(() => {
        setLoading(false);
        setPhase('done');
      });
  }, [initialSummary]);

  if (!loading && !summary && phase === 'done') return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary-500">Daily Coaching</span>
      </div>

      {/* Loading state */}
      {(phase === 'loading' || phase === 'exiting') && (
        <motion.div
          className={`py-6 ${phase === 'exiting' ? 'opacity-0' : 'opacity-100'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-breathe" />
            <p className="text-xs text-white/60">Analyzing</p>
          </div>
        </motion.div>
      )}

      {/* Summary text */}
      {(phase === 'showing' || phase === 'done') && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm text-white leading-loose max-w-2xl">
            {summary}
          </p>
        </motion.div>
      )}
    </div>
  );
}
