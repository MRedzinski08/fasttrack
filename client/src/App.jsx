import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NavBar from './components/NavBar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogMeal from './pages/LogMeal.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionClass, setTransitionClass] = useState('page-enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionClass('page-exit');
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionClass('page-enter');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  return (
    <div key={displayLocation.pathname} className={transitionClass}>
      <Routes location={displayLocation}>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log-meal" element={<ProtectedRoute><LogMeal /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bgRef = useRef(null);

  useEffect(() => {
    let currentY = 0;
    let targetY = 0;
    let rafId;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function animate() {
      currentY = lerp(currentY, targetY, 0.015);
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${currentY}px)`;
      }
      rafId = requestAnimationFrame(animate);
    }

    function handleScroll() {
      targetY = window.scrollY * 0.15;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-metallic-gold">
      <div ref={bgRef} className="bg-metallic-gold-bg" />
      <NavBar onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="relative z-[1]">
        <AnimatedRoutes />
      </main>
      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(10px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)',
        }}
        title="AI Coach"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
