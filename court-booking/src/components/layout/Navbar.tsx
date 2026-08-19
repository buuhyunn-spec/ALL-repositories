import { Link, NavLink } from 'react-router-dom';
import { CalendarDays, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-gray-900">
          <span className="w-8 h-8 rounded-lg bg-[#1B6547] flex items-center justify-center text-white text-sm">
            <CalendarDays size={16} />
          </span>
          <span className="font-display text-xl">CourtBook</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink
            to="/courts"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green-50 text-[#1B6547]' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            Browse Courts
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green-50 text-[#1B6547]' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            My Bookings
          </NavLink>
        </nav>

        {/* Auth CTA */}
        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#1B6547] text-white hover:bg-[#155438] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          <NavLink
            to="/courts"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Courts
          </NavLink>
          <NavLink
            to="/bookings"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            My Bookings
          </NavLink>
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-1 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1B6547] border border-[#1B6547] text-center"
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
