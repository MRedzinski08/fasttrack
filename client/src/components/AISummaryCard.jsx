import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Card, CardContent } from '@/components/ui/card';

export default function AISummaryCard({ initialSummary }) {
  const [summary, setSummary] = useState(initialSummary || '');
  const [loading, setLoading] = useState(!initialSummary);
  const [phase, setPhase] = useState(initialSummary ? 'done' : 'loading'); // loading | exiting | showing | done

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
    <Card className="bg-gradient-to-br from-[#1A1810] to-[#22201A] border-[#2E2B20] overflow-hidden min-h-[220px]">
      <CardContent>
        <h3 className="text-xl font-medium text-primary-500 mb-4">Daily Analysis</h3>

        {(phase === 'loading' || phase === 'exiting') && (
          <div className={`flex flex-col items-center py-10 ${phase === 'exiting' ? 'slide-out-right' : ''}`}>
            <div className="trinity-spinner mb-4">
              <svg className="ring-1" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" fill="none" stroke="#FFAA00" strokeWidth="4" strokeDasharray="31.4 62.8" strokeLinecap="butt" /></svg>
              <svg className="ring-2" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" fill="none" stroke="#FFAA00" strokeWidth="4" strokeDasharray="31.4 62.8" strokeLinecap="butt" /></svg>
              <svg className="ring-3" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" fill="none" stroke="#FFAA00" strokeWidth="4" strokeDasharray="31.4 62.8" strokeLinecap="butt" /></svg>
            </div>
            <span className="text-2xl font-semibold text-shimmer">Thinking...</span>
          </div>
        )}

        {(phase === 'showing' || phase === 'done') && (
          <p className={`text-base text-[#B8A860] leading-relaxed ${phase === 'showing' ? 'slide-in-left' : ''}`}>
            {summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
