import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { 
  Compass, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Layers,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Dashboard', href: '/home', icon: CheckCircle2 },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Compare', href: '/compare', icon: Layers },
    { name: 'Action Plan', href: '/plan', icon: Calendar },
    { name: 'Passport', href: '/passport', icon: FileText },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SP';

  return (
    <div className="sticky top-0 z-40">
      {/* Profile Incomplete Onboarding Banner */}
      {isAuthenticated && user && !user.profileCompleted && (
        <div className="bg-gold-surface border-b border-gold/40 text-ink text-xs px-4 py-2 flex items-center justify-between select-none">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold">Profile Incomplete:</strong> Complete your Eligibility DNA to unlock personalized scheme matches.
              </span>
            </div>
            <Link
              to="/wizard"
              className="font-bold text-ink underline hover:text-gold-hover shrink-0 font-serif"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      <header className="bg-paper/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo with Path Motif */}
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-ink group"
              aria-label="ScholarPath Home"
            >
              <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center text-paper shadow-subtle group-hover:bg-ink/90 transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M4 18 L9 10 L14 15 L20 6" />
                  <circle cx="20" cy="6" r="2" fill="#D9A441" stroke="none" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight font-serif text-ink leading-tight">
                  Scholar<span className="text-green">Path</span>
                </span>
                <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">
                  Official Scheme Matcher
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors',
                        'hover:text-ink hover:bg-paper-muted/80',
                        'focus-visible:outline-2 focus-visible:outline-ink',
                        isActive
                          ? 'text-ink bg-paper-surface border border-line shadow-subtle'
                          : 'text-muted'
                      )
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Action / Auth Area */}
            <div className="flex items-center gap-3">
              <Link
                to="/quick-check"
                className={cn(
                  'hidden sm:inline-flex items-center justify-center font-medium rounded-md min-h-[44px] px-3.5 py-1.5 text-xs',
                  'bg-paper-surface border border-line text-ink hover:bg-paper-muted/60 transition-colors shadow-subtle',
                  'focus-visible:outline-2 focus-visible:outline-ink'
                )}
              >
                Quick Check
              </Link>

              {isAuthenticated && user ? (
                /* Authenticated User Menu */
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-paper-muted border border-line transition-colors focus-visible:outline-2 focus-visible:outline-ink"
                    aria-expanded={dropdownOpen}
                    aria-label="User account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-ink text-paper font-bold text-xs flex items-center justify-center font-serif">
                      {userInitials}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-ink leading-tight truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-muted leading-tight">
                        {user.profileCompleted ? 'DNA Ready' : 'Incomplete'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-paper-surface border border-line rounded-lg shadow-lg py-1.5 z-50 text-xs">
                      <div className="px-3.5 py-2 border-b border-line bg-paper-muted/50">
                        <p className="font-bold text-ink truncate">{user.name}</p>
                        <p className="text-[11px] text-muted truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-ink hover:bg-paper-muted transition-colors font-medium"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-muted" />
                        <span>Profile & Eligibility DNA</span>
                      </Link>

                      <Link
                        to="/passport"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-ink hover:bg-paper-muted transition-colors font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted" />
                        <span>Certificate Passport</span>
                      </Link>

                      <Link
                        to="/wizard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-gold-hover hover:bg-paper-muted transition-colors font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Edit Eligibility DNA</span>
                      </Link>

                      <div className="border-t border-line my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated Sign In / Register Links */
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-ink hover:text-muted transition-colors px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-ink"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className={cn(
                      'inline-flex items-center justify-center font-semibold rounded-md min-h-[44px] px-3.5 py-1.5 text-xs',
                      'bg-ink text-paper hover:bg-ink/90 transition-colors shadow-subtle',
                      'focus-visible:outline-2 focus-visible:outline-ink'
                    )}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
