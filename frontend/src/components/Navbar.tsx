import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/tree', label: 'Family Tree', icon: '🌳' },
  { path: '/members', label: 'Members', icon: '👥' },
  { path: '/relationships', label: 'Relationships', icon: '🔗' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl no-underline">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="8" r="4" fill="white" />
              <circle cx="8" cy="20" r="3" fill="white" opacity="0.8" />
              <circle cx="24" cy="20" r="3" fill="white" opacity="0.8" />
              <line x1="16" y1="12" x2="8" y2="17" stroke="white" strokeWidth="2" />
              <line x1="16" y1="12" x2="24" y2="17" stroke="white" strokeWidth="2" />
            </svg>
            Family Trees
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                  location.pathname === item.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm hidden sm:block">
              {user?.display_name}
            </span>
            <button
              onClick={logout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-3 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all no-underline ${
                location.pathname === item.path
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
