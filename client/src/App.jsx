import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
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

  return (
    <div className="min-h-screen bg-black">
      <NavBar onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="relative z-[1]">
        <AnimatedRoutes />
      </main>
      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-11 h-11 rounded-full border border-white/[0.08] bg-[#0A0A0A] flex items-center justify-center transition-all hover:border-primary-500/40 group"
        title="AI Coach"
      >
        <svg className="w-5 h-5 text-white/30 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
