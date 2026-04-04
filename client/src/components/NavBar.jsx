import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { to: '/log-meal', label: 'Log', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  )},
  { to: '/history', label: 'History', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
];

export default function NavBar({ onSettingsOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0); // 0 = fully visible, 1 = fully hidden

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
      // Fade between 120px and 200px scroll
      const progress = Math.min(1, Math.max(0, (window.scrollY - 120) / 80));
      setLogoProgress(progress);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      {/* Desktop navbar -- transparent, floats over content, blurs on scroll */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 hidden md:block h-14 transition-all duration-500 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-16 h-full flex items-center justify-between">
          {/* Logo */}
          <span className="text-sm font-display tracking-[0.3em] uppercase select-none">
            <span className="text-white/80">FAST</span>
            <span className="text-primary-500">TRACK</span>
          </span>

          {/* Center nav links */}
          <div className="flex items-center gap-10">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-white/35 hover:text-white/70'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={onSettingsOpen}
              className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors duration-300"
              title="Settings"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-[11px] text-white/30 hover:text-white/50 transition-colors duration-300"
            >
              Exit
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile top logo -- fixed, pans off as you scroll past name */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-14 pointer-events-none"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          opacity: 1 - logoProgress,
          transform: `translateY(${-logoProgress * 100}%) scale(${1 - logoProgress * 0.05})`,
        }}
      >
        <span className="text-lg font-display tracking-[0.3em] uppercase select-none">
          <span className="text-white/80">FAST</span>
          <span className="text-primary-500">TRACK</span>
        </span>
      </div>

      {/* Mobile bottom tab bar -- icon-only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-white/[0.04]">
        <div className="flex items-center justify-around px-2 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center justify-center p-2 transition-colors duration-300 ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-white/20'
                }`
              }
            >
              {l.icon}
            </NavLink>
          ))}
          <button
            onClick={onSettingsOpen}
            className="flex items-center justify-center p-2 text-white/20 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </>
  );
}
