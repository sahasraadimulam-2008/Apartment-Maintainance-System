import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Wrench,
  BotMessageSquare,
  ArrowRight,
  CheckCircle2,
  Bell,
  CreditCard,
  Zap,
  Users,
  Compass
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('plumbing');

  const demoScenarios = {
    plumbing: {
      title: 'Kitchen Pipe Burst',
      description: 'Continuous heavy water leakage under kitchen sink flooding cabinets.',
      category: 'Plumbing',
      priority: 'High',
      action: 'Shut off isolation valve under sink and dispatch plumber with sealing gasket.'
    },
    electrical: {
      title: 'Main Breaker Sparking',
      description: 'Sparks and burning odor observed near apartment corridor distribution board.',
      category: 'Electrical',
      priority: 'Critical',
      action: 'Isolate main circuit breaker and alert facility electrician for urgent safety inspection.'
    },
    hvac: {
      title: 'Living Room AC Rattling',
      description: 'Air conditioner compressor producing loud metallic vibrating sound.',
      category: 'HVAC',
      priority: 'Medium',
      action: 'Inspect compressor mounting brackets and replace worn vibration damper pads.'
    }
  };

  const scenario = demoScenarios[activeTab];

  return (
    <div className="min-h-screen bg-ivory-50 text-navy-900 selection:bg-teal-light/20 selection:text-teal-glow">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur-md border-b border-navy-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-accent/20 border border-teal-light/40 flex items-center justify-center text-teal-bright">
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
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-xs sm:text-sm font-medium text-ivory-200 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-teal-accent hover:bg-teal-light text-white shadow-sm hover:shadow transition inline-flex items-center"
            >
              Resident Portal
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-ivory-50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-accent/20 border border-teal-light/30 text-teal-bright text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-bright" />
              <span>Next-Generation Residential Infrastructure</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              Precision Living, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-bright via-teal-light to-amber-light">
                Intelligently Managed.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ivory-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              NESTORA unites residents, facility managers, and technicians into an integrated ecosystem powered by AI-driven triage, instant dispatching, and transparent society administration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-teal-accent hover:bg-teal-light text-white font-semibold rounded-xl transition shadow-glow-teal inline-flex items-center justify-center text-sm"
              >
                Enter Resident Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 bg-navy-800 hover:bg-navy-750 text-ivory-100 border border-navy-700 font-semibold rounded-xl transition text-sm text-center"
              >
                Register Your Flat
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-navy-800/80 pt-8">
              <div className="p-3">
                <p className="text-2xl font-bold font-display text-teal-bright">99.8%</p>
                <p className="text-xs text-ivory-400 mt-1">Maintenance SLA Accuracy</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-bold font-display text-amber-light">&lt; 3 Min</p>
                <p className="text-xs text-ivory-400 mt-1">Average AI Triage Time</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-bold font-display text-white">Zero</p>
                <p className="text-xs text-ivory-400 mt-1">Duplicate Data Storage</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-bold font-display text-teal-bright">100%</p>
                <p className="text-xs text-ivory-400 mt-1">RBAC Privacy Isolation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Maintenance Showcase */}
      <section className="py-20 bg-ivory-100 border-y border-ivory-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
              Core Intelligence Feature
            </span>
            <h2 className="font-display text-3xl font-bold text-navy-900 mt-2">
              Autonomous Maintenance Triage
            </h2>
            <p className="text-sm text-navy-800/70 mt-3 font-light">
              Residents describe their issue in plain language. NESTORA's backend AI service classifies trade specialization, estimates risk priority, and formulates technical recommendations in seconds.
            </p>
          </div>

          {/* Interactive Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-elevated border border-ivory-300 p-6 sm:p-8">
            <div className="flex space-x-2 border-b border-ivory-200 pb-4 mb-6">
              <button
                onClick={() => setActiveTab('plumbing')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'plumbing'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-800/70 hover:bg-ivory-200'
                }`}
              >
                Scenario 1: Plumbing Leak
              </button>
              <button
                onClick={() => setActiveTab('electrical')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'electrical'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-800/70 hover:bg-ivory-200'
                }`}
              >
                Scenario 2: Electrical Hazard
              </button>
              <button
                onClick={() => setActiveTab('hvac')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'hvac'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-800/70 hover:bg-ivory-200'
                }`}
              >
                Scenario 3: HVAC Noise
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Resident Input Side */}
              <div className="bg-ivory-50 p-5 rounded-xl border border-ivory-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800/60 block mb-2">
                  Resident Description
                </span>
                <h4 className="font-display font-semibold text-base text-navy-900 mb-1">
                  "{scenario.title}"
                </h4>
                <p className="text-xs text-navy-800/80 leading-relaxed italic bg-white p-3 rounded-lg border border-ivory-200">
                  {scenario.description}
                </p>
                <div className="mt-4 flex items-center text-xs text-teal-accent font-medium">
                  <Sparkles className="w-3.5 h-3.5 mr-1 animate-pulse" />
                  Processed by NESTORA AI Service
                </div>
              </div>

              {/* AI Structured Output Side */}
              <div className="bg-navy-950 text-white p-5 rounded-xl border border-navy-850">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-bright block mb-3">
                  Structured AI Categorization
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-navy-850 pb-2">
                    <span className="text-ivory-400">Classified Trade:</span>
                    <span className="font-semibold text-teal-bright bg-teal-accent/20 px-2 py-0.5 rounded border border-teal-light/30">
                      {scenario.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-navy-850 pb-2">
                    <span className="text-ivory-400">Calculated Priority:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded ${
                      scenario.priority === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : scenario.priority === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {scenario.priority}
                    </span>
                  </div>
                  <div className="text-xs pt-1">
                    <span className="text-ivory-400 block mb-1">Recommended Technician Action:</span>
                    <p className="text-ivory-200 text-xs bg-navy-900 p-2.5 rounded-lg border border-navy-800 leading-relaxed">
                      {scenario.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
              Platform Modules
            </span>
            <h2 className="font-display text-3xl font-bold text-navy-900 mt-2">
              Comprehensive Residential Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-teal-accent/10 border border-teal-accent/20 flex items-center justify-center text-teal-accent mb-5">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                Ticket Lifecycle & Audit History
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                Complete audit trails for every service request. Status transitions from Open, In Progress, to Resolved are timestamped and logged with technician notes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-amber-accent/10 border border-amber-accent/20 flex items-center justify-center text-amber-accent mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                Multi-Tier Role Authorization
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                Residents only see their personal tickets. Administrators oversee inventory and staff allocations. Staff members receive dedicated work orders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-teal-accent/10 border border-teal-accent/20 flex items-center justify-center text-teal-accent mb-5">
                <BotMessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                24/7 Verified AI Concierge
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                An intelligent society chatbot grounded strictly in official community bylaws, visitor parking policies, pool hours, and waste segregation schedules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-navy-900/10 border border-navy-900/20 flex items-center justify-center text-navy-900 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                Flat & Resident Association
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                Unique building and flat unit indexing. Manage tenancy, occupancy states, square footages, and resident mappings with zero duplicate records.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-teal-accent/10 border border-teal-accent/20 flex items-center justify-center text-teal-accent mb-5">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                Broadcast Announcements
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                Deliver critical society updates, water supply pauses, or fire drill alerts targeted precisely to Residents, Staff, or the entire residential community.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-amber-accent/10 border border-amber-accent/20 flex items-center justify-center text-amber-accent mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy-900 mb-2">
                Maintenance Dues & Receipts
              </h3>
              <p className="text-sm text-navy-800/70 leading-relaxed">
                Structured maintenance fee scheduling and audit tracking. Record offline receipts, bank references, and UPI payments with verified transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-navy-950 py-16 text-white text-center border-t border-navy-850">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Experience Intelligent Residential Management
          </h2>
          <p className="text-ivory-300 text-sm max-w-xl mx-auto mb-8 font-light">
            Sign in to access your apartment dashboard, file maintenance complaints, review society announcements, or chat with the AI Concierge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              to="/login"
              className="px-6 py-3 bg-teal-accent hover:bg-teal-light text-white font-semibold rounded-xl text-sm transition shadow-glow-teal"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-navy-850 hover:bg-navy-800 text-ivory-200 border border-navy-750 font-semibold rounded-xl text-sm transition"
            >
              Register New Resident
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
