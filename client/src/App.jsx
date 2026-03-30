import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NavBar from './components/NavBar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogMeal from './pages/LogMeal.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onChatOpen={() => setChatOpen(true)} />
      <main>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log-meal" element={<ProtectedRoute><LogMeal /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
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
