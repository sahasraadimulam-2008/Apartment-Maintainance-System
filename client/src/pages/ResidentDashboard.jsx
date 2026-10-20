import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { announcementService } from '../services/announcementService';
import { paymentService } from '../services/paymentService';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Building2,
  Home,
  PlusCircle,
  Clock,
  CheckCircle2,
  Bell,
  CreditCard,
  BotMessageSquare,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResidentData = async () => {
      try {
        setLoading(true);
        const [complaintsRes, announcementsRes, paymentsRes] = await Promise.allSettled([
          complaintService.getComplaints({ limit: 10 }),
          announcementService.getAnnouncements({ activeOnly: 'true', limit: 4 }),
          paymentService.getPayments({ limit: 5 })
        ]);

        if (complaintsRes.status === 'fulfilled' && complaintsRes.value.success) {
          setComplaints(complaintsRes.value.data || []);
        }
        if (announcementsRes.status === 'fulfilled' && announcementsRes.value.success) {
          setAnnouncements(announcementsRes.value.data || []);
        }
        if (paymentsRes.status === 'fulfilled' && paymentsRes.value.success) {
          setPayments(paymentsRes.value.data || []);
        }
      } catch (err) {
        console.error('Error fetching resident dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidentData();
  }, []);

  const openTickets = complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress');
  const resolvedTickets = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
  const pendingPayment = payments.find((p) => p.status === 'Pending' || p.status === 'Overdue');

  if (loading) {
    return <LoadingSpinner message="Loading your apartment residence data..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 rounded-2xl p-6 sm:p-8 text-white shadow-elevated border border-navy-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-accent/20 border border-teal-light/30 text-teal-bright text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-bright" />
              <span>Resident Portal Active</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-ivory-300 mt-1 max-w-xl font-light leading-relaxed">
              Manage your apartment maintenance tickets, view community updates, and consult your society AI Concierge.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/complaints"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-accent hover:bg-teal-light text-white transition shadow-glow-teal"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Service Request
            </Link>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-navy-800 hover:bg-navy-750 text-ivory-100 border border-navy-700 transition"
            >
              <BotMessageSquare className="w-4 h-4 mr-2 text-teal-bright" />
              Ask AI Concierge
            </Link>
          </div>
        </div>

        {/* Assigned Flat Chip */}
        {user?.flat && (
          <div className="mt-6 pt-5 border-t border-navy-800/80 flex flex-wrap items-center gap-4 text-xs text-ivory-300">
            <div className="flex items-center space-x-2 bg-navy-900/80 px-3 py-1.5 rounded-lg border border-navy-750">
              <Home className="w-4 h-4 text-teal-bright" />
              <span>
                Unit: <strong className="text-white">{typeof user.flat === 'object' ? `${user.flat.building} - Flat ${user.flat.flatNumber}` : 'Assigned Unit'}</strong>
              </span>
            </div>
            {typeof user.flat === 'object' && user.flat.floor !== undefined && (
              <span className="bg-navy-900/80 px-3 py-1.5 rounded-lg border border-navy-750">
                Floor: <strong className="text-white">{user.flat.floor}</strong>
              </span>
            )}
            {typeof user.flat === 'object' && user.flat.bhkType && (
              <span className="bg-navy-900/80 px-3 py-1.5 rounded-lg border border-navy-750">
                Type: <strong className="text-white">{user.flat.bhkType}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Overview Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Active Complaints
            </p>
            <p className="font-display text-2xl font-bold text-navy-900 mt-1">
              {openTickets.length}
            </p>
            <span className="text-[11px] text-amber-700 font-medium">In resolution pipeline</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Resolved Tickets
            </p>
            <p className="font-display text-2xl font-bold text-navy-900 mt-1">
              {resolvedTickets.length}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">Successfully completed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Maintenance Status
            </p>
            <p className="font-display text-2xl font-bold text-navy-900 mt-1">
              {pendingPayment ? `$${pendingPayment.amount}` : 'All Clear'}
            </p>
            <span className="text-[11px] text-teal-accent font-medium">
              {pendingPayment ? `Due: ${pendingPayment.billingPeriod}` : 'No overdue charges'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Complaints & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active Complaints */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden">
          <div className="px-6 py-5 border-b border-ivory-200 flex items-center justify-between bg-ivory-50/50">
            <div>
              <h2 className="font-display font-semibold text-base text-navy-900">
                My Maintenance Complaints
              </h2>
              <p className="text-xs text-navy-800/70">
                Track status and technician responses for your apartment
              </p>
            </div>
            <Link
              to="/complaints"
              className="text-xs font-semibold text-teal-accent hover:text-teal-light flex items-center"
            >
              View Full History
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-ivory-200">
            {complaints.length > 0 ? (
              complaints.slice(0, 5).map((complaint) => (
                <div key={complaint._id} className="p-5 hover:bg-ivory-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-navy-900">{complaint.title}</span>
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <p className="text-xs text-navy-800/70 line-clamp-1">{complaint.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-navy-800/50 pt-1">
                      <span>Category: <strong className="text-navy-800">{complaint.category}</strong></span>
                      <span>&bull;</span>
                      <span>Filed: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <StatusBadge status={complaint.status} />
                    <Link
                      to="/complaints"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-navy-800 bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-navy-800/70 mb-3">You have not submitted any complaints yet.</p>
                <Link
                  to="/complaints"
                  className="inline-flex items-center px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  File First Ticket
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Society Notices Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-ivory-300 shadow-subtle p-6">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-teal-accent" />
                <h3 className="font-display font-semibold text-base text-navy-900">
                  Society Notices
                </h3>
              </div>
              <Link to="/announcements" className="text-xs text-teal-accent hover:underline font-medium">
                All
              </Link>
            </div>

            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((notice) => (
                  <div key={notice._id} className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-xs text-navy-900 leading-tight">
                        {notice.title}
                      </h4>
                      {notice.priority === 'Urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-semibold shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy-800/70 line-clamp-2 leading-relaxed">
                      {notice.message}
                    </p>
                    <p className="text-[10px] text-navy-800/50 pt-1">
                      {new Date(notice.publicationDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-navy-800/60 text-center py-4">No active broadcasts at this time.</p>
              )}
            </div>
          </div>

          {/* AI Concierge Teaser Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 text-white border border-navy-800 shadow-subtle">
            <div className="flex items-center space-x-2 text-teal-bright text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Residence Concierge</span>
            </div>
            <h4 className="font-display font-bold text-base mb-2">
              Have questions regarding clubhouse rules or guest parking?
            </h4>
            <p className="text-xs text-ivory-300 leading-relaxed mb-4 font-light">
              Ask our verified AI Concierge about quiet hours, amenities booking, and society guidelines.
            </p>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center text-xs font-semibold text-teal-bright hover:text-white transition"
            >
              Start Conversation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
