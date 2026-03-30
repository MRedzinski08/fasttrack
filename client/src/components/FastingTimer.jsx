import { useEffect, useState } from 'react';

function formatTime(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function FastingTimer({ session, initialSeconds, onBreakFast }) {
  const [seconds, setSeconds] = useState(initialSeconds || 0);
  const isEatingWindow = seconds <= 0;
  const isWarning = seconds > 0 && seconds <= 1800;

  useEffect(() => {
    setSeconds(initialSeconds || 0);
  }, [initialSeconds]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const colorClass = isEatingWindow
    ? 'text-primary-600'
    : isWarning
    ? 'text-amber-500'
    : 'text-green-600';

  const statusLabel = isEatingWindow
    ? 'Eating Window Open'
    : isWarning
    ? 'Almost There!'
    : 'Fasting';

  const statusBg = isEatingWindow
    ? 'bg-primary-50 text-primary-700'
    : isWarning
    ? 'bg-amber-50 text-amber-700'
    : 'bg-green-50 text-green-700';

  const dotColor = isEatingWindow
    ? 'bg-primary-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-green-500';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4 ${statusBg}`}>
        <span className={`w-2 h-2 rounded-full mr-1.5 ${dotColor}`} />
        {statusLabel}
      </div>

      <div className={`text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums tracking-tight mb-2 ${colorClass}`}>
        {formatTime(seconds)}
      </div>

      {session ? (
        <p className="text-gray-400 text-sm mb-5">
          {isEatingWindow
            ? 'Your eating window is open — enjoy your meal!'
            : `${session.target_hours}h fast · started ${new Date(session.fast_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      ) : (
        <p className="text-gray-400 text-sm mb-5">No active fasting session</p>
      )}

      <button
        onClick={onBreakFast}
        className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
      >
        {isEatingWindow ? 'Start New Fast' : 'Break Fast'}
      </button>
    </div>
  );
}
