import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { flatService } from '../services/flatService';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Home,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Registration Type: 'resident' | 'staff'
  const [accountType, setAccountType] = useState('resident');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    flatId: '',
    jobRole: 'Plumber',
    staffInviteCode: ''
  });

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Directory of flats for optional resident assignment
  const [availableFlats, setAvailableFlats] = useState([]);
  const [loadingFlats, setLoadingFlats] = useState(false);

  // Submission & Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Touched state for live inline validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    staffInviteCode: false
  });

  // Load flats directory for optional selection
  useEffect(() => {
    let isMounted = true;
    const fetchFlats = async () => {
      try {
        setLoadingFlats(true);
        const res = await flatService.getFlats({ limit: 100 });
        if (isMounted && res.success && Array.isArray(res.data)) {
          setAvailableFlats(res.data);
        }
      } catch (err) {
        console.warn('Could not load flat directory:', err.message);
      } finally {
        if (isMounted) setLoadingFlats(false);
      }
    };
    fetchFlats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Inline Validation Helpers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(formData.email.trim());
  const isPasswordValid = formData.password.length >= 6;
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isNameValid = formData.name.trim().length >= 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Mark all touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
      staffInviteCode: true
    });

    if (!isNameValid) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (accountType === 'staff' && !formData.staffInviteCode.trim()) {
      setErrorMessage('Please enter the Administrator Authorization Code to register a maintenance staff account.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: accountType
      };

      if (accountType === 'resident') {
        payload.flat = formData.flatId || undefined;
      } else if (accountType === 'staff') {
        payload.jobRole = formData.jobRole;
        payload.staffInviteCode = formData.staffInviteCode.trim();
      }

      const res = await register(payload);

      if (accountType === 'staff') {
        setSuccessMessage('Technician account authorized successfully! Redirecting to your Staff Dispatch Board...');
        setTimeout(() => {
          navigate('/staff', { replace: true });
        }, 1200);
      } else {
        setSuccessMessage('Welcome to NESTORA! Your resident account is ready. Redirecting to your Residence Portal...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Welcome Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
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
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
          Create Your NESTORA Account
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-navy-800/70 max-w-sm mx-auto">
          Join our connected residential community for streamlined maintenance, transparent notices, and smart services.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-elevated border border-ivory-300">
          
          {/* Account Role Selector Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-navy-800/80 uppercase tracking-wider mb-2 text-center">
              Select Registration Type
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-ivory-100/80 rounded-xl border border-ivory-300">
              {/* Resident Tab */}
              <button
                type="button"
                onClick={() => {
                  setAccountType('resident');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg text-center transition ${
                  accountType === 'resident'
                    ? 'bg-white text-navy-900 shadow-sm border border-ivory-300'
                    : 'text-navy-700 hover:text-navy-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Home className={`w-4 h-4 ${accountType === 'resident' ? 'text-teal-accent' : 'text-navy-400'}`} />
                  <span className="text-xs sm:text-sm font-bold">Resident</span>
                </div>
                <span className="text-[11px] text-navy-600/80 mt-0.5 hidden sm:inline">
                  Apartment Owners & Tenants
                </span>
              </button>

              {/* Staff Tab */}
              <button
                type="button"
                onClick={() => {
                  setAccountType('staff');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg text-center transition ${
                  accountType === 'staff'
                    ? 'bg-white text-navy-900 shadow-sm border border-ivory-300'
                    : 'text-navy-700 hover:text-navy-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wrench className={`w-4 h-4 ${accountType === 'staff' ? 'text-amber-accent' : 'text-navy-400'}`} />
                  <span className="text-xs sm:text-sm font-bold">Maintenance Staff</span>
                </div>
                <span className="text-[11px] text-navy-600/80 mt-0.5 hidden sm:inline">
                  Facility Technicians
                </span>
              </button>
            </div>
          </div>

          {/* Feedback & Alert Banners */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 flex items-start space-x-3 text-emerald-900 text-xs shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">{successMessage}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Please wait while your workspace loads...</p>
              </div>
            </div>
          )}

          {/* Staff Authorization Information Card */}
          {accountType === 'staff' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Authorized Staff Onboarding</p>
                <p className="text-amber-800/80 leading-relaxed font-light">
                  Staff accounts require an <strong>Administrator Authorization Code</strong> issued by the Property Management Office to access work dispatch orders and service tickets.
                </p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                {touched.name && !isNameValid && (
                  <span className="text-[11px] text-rose-600">Minimum 2 characters required</span>
                )}
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                  <User className="w-4 h-4 text-navy-600/50" />
                </div>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  placeholder={accountType === 'staff' ? 'e.g. Marcus Vance' : 'e.g. Sarah Connor'}
                  className={`block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent transition ${
                    touched.name && !isNameValid ? 'border-rose-300 bg-rose-50/30' : 'border-ivory-300'
                  }`}
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                {touched.email && !isEmailValid && (
                  <span className="text-[11px] text-rose-600">Enter a valid email address</span>
                )}
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                  <Mail className="w-4 h-4 text-navy-600/50" />
                </div>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  placeholder={accountType === 'staff' ? 'technician@maintenance.com' : 'resident@apartment.com'}
                  className={`block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent transition ${
                    touched.email && !isEmailValid ? 'border-rose-300 bg-rose-50/30' : 'border-ivory-300'
                  }`}
                />
              </div>
            </div>

            {/* Phone & Specialty/Flat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Phone Number {accountType === 'staff' && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                    <Phone className="w-4 h-4 text-navy-600/50" />
                  </div>
                  <input
                    type="tel"
                    required={accountType === 'staff'}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="+1 555-0199"
                    className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent transition"
                  />
                </div>
              </div>

              {/* Conditional: Flat Unit for Resident / Job Role for Staff */}
              {accountType === 'resident' ? (
                <div>
                  <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                    Apartment Flat <span className="text-navy-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                      <Home className="w-4 h-4 text-navy-600/50" />
                    </div>
                    <select
                      name="flatId"
                      value={formData.flatId}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent transition"
                    >
                      <option value="">Select Flat (Can be assigned later)</option>
                      {availableFlats.map((flat) => (
                        <option key={flat._id} value={flat._id}>
                          {flat.building} - Unit {flat.flatNumber} ({flat.bhkType || 'Apartment'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                    Technician Specialty <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                      <Wrench className="w-4 h-4 text-navy-600/50" />
                    </div>
                    <select
                      name="jobRole"
                      value={formData.jobRole}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent transition"
                    >
                      <option value="Plumber">Plumbing Specialist</option>
                      <option value="Electrician">Licensed Electrician</option>
                      <option value="HVAC Technician">HVAC & Cooling Technician</option>
                      <option value="Carpenter">Carpentry & Hardware</option>
                      <option value="Cleaner">Facility Sanitation & Cleaning</option>
                      <option value="Security Guard">Security & Access Officer</option>
                      <option value="Maintenance Supervisor">Maintenance Supervisor</option>
                      <option value="Other">General Facility Maintenance</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Staff Only: Administrator Authorization Code */}
            {accountType === 'staff' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                    Administrator Authorization Code <span className="text-rose-500">*</span>
                  </label>
                  {touched.staffInviteCode && !formData.staffInviteCode.trim() && (
                    <span className="text-[11px] text-rose-600">Authorization code is required</span>
                  )}
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                    <Key className="w-4 h-4 text-amber-600" />
                  </div>
                  <input
                    type="password"
                    required
                    name="staffInviteCode"
                    value={formData.staffInviteCode}
                    onChange={handleChange}
                    onBlur={() => handleBlur('staffInviteCode')}
                    placeholder="Enter management-issued authorization code"
                    className="block w-full pl-9 pr-3 py-2.5 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-amber-500 transition tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-navy-600/70 mt-1 flex items-center">
                  <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                  Default development authorization code: <code className="ml-1 bg-ivory-200 px-1 py-0.2 rounded text-navy-900 font-mono text-[10px]">NESTORA-STAFF-2026</code>
                </p>
              </div>
            )}

            {/* Password Row with Visibility Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {touched.password && !isPasswordValid && (
                    <span className="text-[11px] text-rose-600">Min. 6 chars</span>
                  )}
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                    <Lock className="w-4 h-4 text-navy-600/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Min. 6 chars"
                    className={`block w-full pl-9 pr-10 py-2.5 bg-ivory-50 border rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent transition ${
                      touched.password && !isPasswordValid ? 'border-rose-300 bg-rose-50/30' : 'border-ivory-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  {touched.confirmPassword && !doPasswordsMatch && (
                    <span className="text-[11px] text-rose-600">Passwords do not match</span>
                  )}
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                    <Lock className="w-4 h-4 text-navy-600/50" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Confirm password"
                    className={`block w-full pl-9 pr-10 py-2.5 bg-ivory-50 border rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent transition ${
                      touched.confirmPassword && !doPasswordsMatch ? 'border-rose-300 bg-rose-50/30' : 'border-ivory-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting || Boolean(successMessage)}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition shadow-sm hover:shadow disabled:opacity-50 ${
                  accountType === 'staff'
                    ? 'bg-navy-900 hover:bg-navy-800 focus:ring-amber-500'
                    : 'bg-teal-accent hover:bg-teal-light focus:ring-teal-bright'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {accountType === 'staff' ? 'Authorizing Technician Profile...' : 'Creating Resident Profile...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {accountType === 'staff' ? 'Register As Maintenance Staff' : 'Complete Resident Registration'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Need Staff Code Assistance Box */}
          {accountType === 'staff' && (
            <div className="mt-6 pt-5 border-t border-ivory-200">
              <div className="flex items-start space-x-2 text-xs text-navy-700/80">
                <HelpCircle className="w-4 h-4 text-navy-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Don't have an authorization code? Contact the Property Management Office at{' '}
                  <span className="font-semibold text-navy-900">management@apartment.com</span> or visit the security desk for onboarding credentials.
                </p>
              </div>
            </div>
          )}

          {/* Sign In Navigation Link */}
          <div className="mt-6 pt-5 border-t border-ivory-200 text-center">
            <p className="text-xs text-navy-700/80">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-accent hover:text-teal-light transition">
                Sign in to your account &rarr;
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
