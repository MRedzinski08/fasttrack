import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

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
  if (hours > 0 && minutes > 0) elapsed = `${hours}h ${minutes}m`;
  else if (hours > 0) elapsed = `${hours}h`;
  else elapsed = `${minutes}m`;
  return { elapsed, timeStr };
}

// Hard-edge flat extrusion — each layer is a solid color offset with no blur
function makeHardExtrude(color, layers = 6) {
  return Array.from({ length: layers }, (_, i) => {
    const d = i + 1;
    return `${d}px ${d}px 0px ${color}`;
  }).join(', ');
}

export default function FastingTimer({ session, initialSeconds, eatingWindowActive = false }) {
  const [seconds, setSeconds] = useState(initialSeconds || 0);
  const [, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const isEatingWindow = eatingWindowActive;
  const fastComplete = !eatingWindowActive && seconds <= 0;
  const isWarning = !isEatingWindow && !fastComplete && seconds > 0 && seconds <= 1800;

  const timerRef = useRef(null);
  const isInView = useInView(timerRef, { once: false, margin: '-10% 0px -10% 0px' });

  useEffect(() => {
    setSeconds(initialSeconds || 0);
  }, [initialSeconds]);

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 640); }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Colors
  const colorClass = isEatingWindow ? 'text-primary-500' : fastComplete ? 'text-primary-500' : isWarning ? 'text-amber-500' : 'text-green-400';
  const extrudeColor = isEatingWindow ? '#664400' : fastComplete ? '#664400' : isWarning ? '#5C3D06' : '#1A5C32';
  const barColor = isEatingWindow ? 'bg-primary-500' : fastComplete ? 'bg-primary-500' : isWarning ? 'bg-amber-500' : 'bg-green-400';
  const glowColor = isEatingWindow ? '255,170,0' : fastComplete ? '255,170,0' : isWarning ? '245,158,11' : '74,222,128';
  const statusLabel = isEatingWindow ? 'EATING WINDOW' : fastComplete ? 'FAST COMPLETE — LOG A MEAL' : isWarning ? 'ALMOST THERE' : 'FASTING';
  const marqueeWord = isEatingWindow ? 'EAT' : fastComplete ? 'EAT' : 'FASTING';

  // Progress
  const totalSeconds = session ? session.target_hours * 3600 : 1;
  const elapsedSec = totalSeconds - seconds;
  const progress = Math.min(1, Math.max(0, elapsedSec / totalSeconds));
  const elapsedInfo = formatElapsed(session);
  const timeStr = formatTime(seconds);

  const hardShadow = makeHardExtrude(extrudeColor, isMobile ? 4 : 8);

  return (
    <div className="relative py-16 sm:py-24" ref={timerRef}>

      {/* Ambient glow behind timer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: isInView ? 0.5 : 0,
        }}
        transition={{ duration: 2 }}
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(${glowColor},0.06) 0%, transparent 70%)`,
        }}
      />

      {/* Main timer display */}
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className={`text-[70px] sm:text-[130px] lg:text-[180px] font-display font-bold tracking-tighter tabular-nums ${colorClass} block text-center leading-none`}
            animate={{
              textShadow: isInView ? hardShadow : 'none',
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {timeStr}
          </motion.span>
        </motion.div>
      </div>

      {/* Animated progress bar with glowing tip */}
      <div className="relative w-full mt-10">
        <div className="w-full h-[2px] bg-white/[0.06]">
          <motion.div
            className={`h-full ${barColor} relative`}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${barColor}`}
              style={{ boxShadow: `0 0 14px rgba(${glowColor},0.7), 0 0 40px rgba(${glowColor},0.3)` }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between mt-6 px-2">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${barColor}`}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
            {statusLabel}
          </span>
        </div>

        <span className="text-sm text-white text-center">
          {session ? (
            isEatingWindow ? (
              'Eating window is open — log your meals'
            ) : fastComplete ? (
              'Fast complete! Log a meal to start your eating window'
            ) : (
              elapsedInfo ? (
                <>Started {elapsedInfo.elapsed} ago at {elapsedInfo.timeStr}</>
              ) : (
                `${session.target_hours}h fast in progress`
              )
            )
          ) : (
            <span className="text-white/60">No active session</span>
          )}
        </span>

        <Link
          to="/log-meal"
          className="text-xs uppercase tracking-[0.2em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black px-5 py-2 transition-all duration-300"
        >
          Log Meal
        </Link>
      </div>

      {/* Floating accent particles — larger and more visible */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 12}%`,
              top: `${10 + (i % 4) * 22}%`,
              width: 2 + (i % 4) * 2,
              height: 2 + (i % 4) * 2,
              background: `rgba(${glowColor}, ${0.05 + (i % 4) * 0.15})`,
              boxShadow: `0 0 ${4 + (i % 3) * 6}px rgba(${glowColor}, ${0.1 + (i % 3) * 0.15})`,
            }}
            animate={{
              y: [0, -30 - i * 5, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Scrolling marquee */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none select-none">
        <div className="animate-marquee whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-[100px] sm:text-[140px] font-display font-bold text-white/[0.02] inline-block mx-12 tracking-tighter">
              {marqueeWord}
            </span>
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={`d-${i}`} className="text-[100px] sm:text-[140px] font-display font-bold text-white/[0.02] inline-block mx-12 tracking-tighter">
              {marqueeWord}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
