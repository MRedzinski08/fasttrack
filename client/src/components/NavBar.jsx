import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '@/components/ui/button';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/log-meal', label: 'Log Meal' },
  { to: '/history', label: 'History' },
];

export default function NavBar({ onSettingsOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-40 border-b-2 border-white/20" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)' }}>
      <div className="max-w-[96rem] mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <span className="text-lg sm:text-2xl font-medium text-primary-500 tracking-tight">FastTrack</span>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((l, i) => (
            <div key={l.to} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-6 bg-primary-500/30" />}
              <Button
                variant="ghost"
                asChild
                className="text-[#B8A860] hover:text-primary-50 hover:bg-[#2E2B20] text-lg sm:text-2xl px-10 py-3"
              >
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? 'bg-primary-500/10 !text-primary-500' : ''
                  }
                >
                  {l.label}
                </NavLink>
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={onSettingsOpen}
            className="text-[#706530] hover:text-primary-500 hover:bg-[#2E2B20] !px-4 !py-3 !h-auto"
            title="Settings"
          >
            <svg className="!w-7 !h-7 sm:!w-8 sm:!h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-lg sm:text-2xl text-[#706530] hover:text-[#B8A860] hover:bg-[#2E2B20]"
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-[#2E2B20]">
        {navLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex-1 py-2 text-center text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-[#706530]'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
        <button
          onClick={onSettingsOpen}
          className="flex-1 py-2 text-center text-xs font-medium text-[#706530] transition-colors"
        >
          Settings
        </button>
      </div>
    </nav>
  );
}
