import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatTime(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatElapsed(session) {
  if (!session?.fast_start) return null;
  const startTime = new Date(session.fast_start);
  const now = new Date();
  const diffMs = now - startTime;
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  const timeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  let elapsed = '';
  if (hours > 0 && minutes > 0) elapsed = `${hours} hour${hours !== 1 ? 's' : ''} & ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours > 0) elapsed = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else elapsed = `${minutes} minute${minutes !== 1 ? 's' : ''}`;

  return { elapsed, timeStr };
}

export default function FastingTimer({ session, initialSeconds }) {
  const [seconds, setSeconds] = useState(initialSeconds || 0);
  const [, setTick] = useState(0); // force re-render for elapsed time
  const isEatingWindow = seconds <= 0;
  const isWarning = seconds > 0 && seconds <= 1800;

  useEffect(() => {
    setSeconds(initialSeconds || 0);
  }, [initialSeconds]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const colorClass = isEatingWindow
    ? 'text-primary-600'
    : isWarning
    ? 'text-amber-500'
    : 'text-green-500';

  const ringColor = isEatingWindow
    ? '#CCB200'
    : isWarning
    ? '#f59e0b'
    : '#22c55e';

  const statusLabel = isEatingWindow
    ? 'Eating Window Open'
    : isWarning
    ? 'Almost There!'
    : 'Fasting';

  const badgeClass = isEatingWindow
    ? 'bg-primary-500/10 text-primary-500 border-0'
    : isWarning
    ? 'bg-amber-500/10 text-amber-500 border-0'
    : 'bg-green-500/10 text-green-500 border-0';

  const dotColor = isEatingWindow
    ? 'bg-primary-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-green-500';

  // Circular progress
  const totalSeconds = session ? session.target_hours * 3600 : 1;
  const elapsed = totalSeconds - seconds;
  const progress = Math.min(1, Math.max(0, elapsed / totalSeconds));
  const radius = 120;
  const svgSize = (radius + 16) * 2;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const elapsedInfo = formatElapsed(session);

  return (
    <Card className="border-2 border-white/20 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
      }}>
      <CardContent className="text-center py-8">
        {/* Header */}
        <h2 className={`text-4xl sm:text-5xl font-medium mb-6 ${isEatingWindow ? 'text-primary-500' : 'text-green-500'}`}>
          {isEatingWindow ? 'TIME TO EAT!' : 'FASTING'}
        </h2>

        {/* Circular progress ring */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <svg width={svgSize} height={svgSize} className="-rotate-90">
            {/* Progress */}
            <circle
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="24"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Timer text centered inside the ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl sm:text-4xl md:text-5xl font-medium tabular-nums tracking-tight ${colorClass}`}>
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* Status info */}
        {session ? (
          <p className="text-white font-medium text-xl sm:text-2xl mb-8 px-4 leading-relaxed">
            {isEatingWindow ? (
              'Your eating window is open. Log a meal to start your next fast.'
            ) : (
              elapsedInfo ? (
                <>
                  Your fast started <span className="font-medium text-primary-50">{elapsedInfo.elapsed}</span> ago at <span className="font-medium text-primary-50">{elapsedInfo.timeStr}</span>.
                </>
              ) : (
                `${session.target_hours}h fast in progress`
              )
            )}
          </p>
        ) : (
          <p className="text-[#5A5228] text-base sm:text-lg font-medium mb-8">No active fasting session</p>
        )}

        {/* Log Meal button */}
        <Link
          to="/log-meal"
          className="inline-block bg-primary-500 hover:bg-primary-400 text-primary-900 font-medium text-lg sm:text-xl tracking-wide py-4 rounded-xl transition-colors select-none text-center"
          style={{ width: 'calc(50% - 8px)' }}
        >
          Log Meal
        </Link>
      </CardContent>
    </Card>
  );
}
