import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/common/Badge';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Users,
  Home,
  Wrench,
  Bell,
  CreditCard,
  BotMessageSquare,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation links based on user role
  const getNavItems = () => {
    const role = user?.role;

    if (role === 'admin') {
      return [
        { name: 'Overview', path: '/admin', icon: LayoutDashboard },
        { name: 'Complaints', path: '/complaints', icon: ClipboardList },
        { name: 'Flats', path: '/flats', icon: Home },
        { name: 'Residents', path: '/residents', icon: Users },
        { name: 'Staff', path: '/staff-management', icon: Wrench },
        { name: 'Announcements', path: '/announcements', icon: Bell },
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'AI Concierge', path: '/ai-assistant', icon: BotMessageSquare, highlight: true }
      ];
    }

    if (role === 'staff') {
      return [
        { name: 'Staff Board', path: '/staff', icon: LayoutDashboard },
        { name: 'Complaints', path: '/complaints', icon: ClipboardList },
        { name: 'Announcements', path: '/announcements', icon: Bell },
        { name: 'AI Concierge', path: '/ai-assistant', icon: BotMessageSquare, highlight: true }
      ];
    }

    // Resident
    return [
      { name: 'My Residence', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Complaints', path: '/complaints', icon: ClipboardList },
      { name: 'Announcements', path: '/announcements', icon: Bell },
      { name: 'Maintenance Dues', path: '/payments', icon: CreditCard },
      { name: 'AI Concierge', path: '/ai-assistant', icon: BotMessageSquare, highlight: true }
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-navy-950 text-ivory-50 border-b border-navy-850 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <NavLink to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-teal-accent/20 border border-teal-light/40 flex items-center justify-center text-teal-bright group-hover:scale-105 transition">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-xl tracking-tight text-white block">
                    NESTORA
                  </span>
                  <span className="text-[10px] tracking-wider uppercase text-ivory-300 font-medium block -mt-1">
                    Intelligent Apartment Living
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
                      isActive
                        ? 'bg-navy-850 text-white shadow-inner border border-navy-750'
                        : item.highlight
                        ? 'text-teal-bright hover:bg-teal-accent/15 hover:text-white'
                        : 'text-ivory-300 hover:text-white hover:bg-navy-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-1.5 ${item.highlight ? 'text-teal-bright' : 'opacity-80'}`} />
                    {item.name}
                    {item.highlight && (
                      <span className="ml-1.5 px-1.5 py-0.2 bg-teal-accent/30 text-teal-bright text-[10px] font-semibold rounded-full border border-teal-light/30">
                        AI
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-navy-850 transition border border-transparent hover:border-navy-750 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-accent/20 border border-teal-light/40 flex items-center justify-center text-teal-bright font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block leading-tight">
                    <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-ivory-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-ivory-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-elevated border border-ivory-300 py-2 z-50 text-navy-900"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-ivory-200">
                      <p className="text-xs font-semibold text-navy-900">{user?.name}</p>
                      <p className="text-xs text-navy-700/70 truncate">{user?.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <RoleBadge role={user?.role} />
                        {user?.flat && (
                          <span className="text-[11px] font-medium text-navy-800 bg-ivory-100 px-2 py-0.5 rounded border border-ivory-300">
                            Unit {typeof user.flat === 'object' ? `${user.flat.building}-${user.flat.flatNumber}` : 'Assigned'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center transition"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-ivory-300 hover:text-white hover:bg-navy-850"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-navy-850 bg-navy-900 px-4 pt-3 pb-5 space-y-1">
            <div className="px-3 py-2 mb-2 bg-navy-850 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[11px] text-ivory-400">{user?.email}</p>
              </div>
              <RoleBadge role={user?.role} />
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-navy-800 text-teal-bright font-semibold'
                      : 'text-ivory-300 hover:text-white hover:bg-navy-850'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}

            <div className="pt-3 mt-3 border-t border-navy-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:bg-navy-850 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-ivory-300 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-800/60 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-navy-900 font-display">NESTORA</span>
            <span>&bull;</span>
            <span>Intelligent Apartment Living &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center text-teal-accent font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-accent" />
              AI-Powered Residential Platform
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
