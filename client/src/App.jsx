import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
      <NavBar onChatOpen={() => setChatOpen(true)} onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="relative z-[1]">
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log-meal" element={<ProtectedRoute><LogMeal /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
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
