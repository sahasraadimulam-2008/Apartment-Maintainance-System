import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, getRoleHomeRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password);
      let destination = getRoleHomeRoute(user?.role);
      if (from && from !== '/login' && from !== '/register' && from !== '/') {
        // Guard against cross-role redirect loops if 'from' was a different role's dashboard
        if (
          (from === '/admin' && user?.role !== 'admin') ||
          (from === '/staff' && user?.role !== 'staff') ||
          (from === '/dashboard' && user?.role !== 'resident')
        ) {
          destination = getRoleHomeRoute(user?.role);
        } else {
          destination = from;
        }
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helper
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-accent/20 border border-teal-light/40 flex items-center justify-center text-teal-bright group-hover:scale-105 transition">
            <Building2 className="w-6 h-6 text-teal-accent" />
          </div>
          <div className="text-left">
            <span className="font-display font-extrabold text-2xl tracking-tight text-navy-900 block">
              NESTORA
            </span>
            <span className="text-[10px] tracking-wider uppercase text-navy-700/70 font-semibold block -mt-1">
              Intelligent Apartment Living
            </span>
          </div>
        </Link>
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy-900">
          Sign In to Your Residence Portal
        </h2>
        <p className="mt-2 text-xs text-navy-800/70">
          Access your maintenance requests, notices, and smart residential tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-elevated border border-ivory-300">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                  <Mail className="w-4 h-4 text-navy-600/50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                  <Lock className="w-4 h-4 text-navy-600/50" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-accent shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Verifying Credentials...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Helper */}
          <div className="mt-6 pt-6 border-t border-ivory-200">
            <p className="text-[11px] font-semibold text-navy-800/70 uppercase tracking-wider mb-2.5 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-accent" />
              Quick Demo Logins:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@example.com', 'password123')}
                className="px-2.5 py-1.5 text-xs bg-ivory-100 hover:bg-ivory-200 text-navy-900 rounded-lg border border-ivory-300 font-medium transition text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('resident@example.com', 'password123')}
                className="px-2.5 py-1.5 text-xs bg-ivory-100 hover:bg-ivory-200 text-navy-900 rounded-lg border border-ivory-300 font-medium transition text-center"
              >
                Resident
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff@example.com', 'password123')}
                className="px-2.5 py-1.5 text-xs bg-ivory-100 hover:bg-ivory-200 text-navy-900 rounded-lg border border-ivory-300 font-medium transition text-center"
              >
                Staff
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-navy-700/80">
              New resident?{' '}
              <Link to="/register" className="font-semibold text-teal-accent hover:text-teal-light">
                Register your apartment
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
