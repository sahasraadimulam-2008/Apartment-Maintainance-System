import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { staffService } from '../services/staffService';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Home,
  User,
  Phone,
  AlertCircle,
  Sparkles,
  ClipboardCheck,
  Send
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Status update modal state
  const [newStatus, setNewStatus] = useState('In Progress');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const fetchStaffWork = async () => {
    try {
      setLoading(true);
      // Backend supports getting complaints for logged in staff via assignedStaff=me or all complaints
      const res = await complaintService.getComplaints({ assignedStaff: 'me' });
      if (res.success && Array.isArray(res.data)) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.warn('Could not load assigned staff complaints:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffWork();
  }, []);

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status === 'Open' ? 'In Progress' : 'Resolved');
    setNote('');
    setFeedbackMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await complaintService.updateStatus(selectedComplaint._id, newStatus, note);
      setFeedbackMessage({ type: 'success', text: `Status updated to ${newStatus}` });
      setTimeout(() => {
        setModalOpen(false);
        fetchStaffWork();
      }, 1000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to update status'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading assigned maintenance dispatch queue..." />;
  }

  const inProgressTickets = complaints.filter((c) => c.status === 'In Progress');
  const openTickets = complaints.filter((c) => c.status === 'Open');

  return (
    <div className="space-y-8">
      {/* Staff Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Field Operations
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Technician Dispatch Queue
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Maintenance tickets assigned to your technician account. Update progress as work is completed.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-ivory-300 shadow-subtle">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-navy-900">Technician Active</span>
        </div>
      </div>

      {/* Staff Queue Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">Assigned Tickets</p>
            <p className="font-display text-2xl font-bold text-navy-900 mt-1">{complaints.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">In Progress</p>
            <p className="font-display text-2xl font-bold text-blue-700 mt-1">{inProgressTickets.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">Pending Start</p>
            <p className="font-display text-2xl font-bold text-amber-700 mt-1">{openTickets.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Work Order Cards */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-navy-900">
          Work Orders Requiring Action
        </h2>

        {complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white rounded-2xl border border-ivory-300 shadow-subtle p-6 flex flex-col justify-between space-y-4 card-hover"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display font-bold text-base text-navy-900">
                      {ticket.title}
                    </h3>
                    <PriorityBadge priority={ticket.priority} />
                  </div>

                  <p className="text-xs text-navy-800/75 leading-relaxed bg-ivory-50 p-3 rounded-xl border border-ivory-200 mb-4">
                    {ticket.description}
                  </p>

                  {/* AI Recommendation highlight */}
                  {ticket.aiSuggestions?.suggestedAction && (
                    <div className="mb-4 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs">
                      <div className="flex items-center space-x-1.5 text-teal-accent font-semibold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Diagnostic Suggestion:</span>
                      </div>
                      <p className="text-teal-950 font-normal leading-relaxed">
                        {ticket.aiSuggestions.suggestedAction}
                      </p>
                    </div>
                  )}

                  {/* Location & Resident Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-ivory-200">
                    <div className="flex items-center space-x-1.5 text-navy-800">
                      <Home className="w-3.5 h-3.5 text-navy-800/60" />
                      <span>
                        Unit: <strong>{ticket.flat ? `${ticket.flat.building}-${ticket.flat.flatNumber}` : 'General Area'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-navy-800">
                      <User className="w-3.5 h-3.5 text-navy-800/60" />
                      <span>{ticket.resident?.name || 'Resident'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-ivory-200">
                  <StatusBadge status={ticket.status} />

                  <button
                    onClick={() => handleOpenStatusModal(ticket)}
                    className="inline-flex items-center px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                    Update Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-ivory-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-base text-navy-900">All Work Orders Completed</h3>
            <p className="text-xs text-navy-800/70 mt-1 max-w-sm mx-auto">
              There are no pending tickets currently dispatched to you. Check back later or notify your facility supervisor.
            </p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Update Work Order Progress"
        subtitle={selectedComplaint?.title}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          {feedbackMessage.text && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedbackMessage.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Select Lifecycle State
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress (Work Underway)</option>
              <option value="Resolved">Resolved (Completed)</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Technician Resolution Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Inspected pipe washer, replaced silicone seal, verified water flow with resident."
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-ivory-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm disabled:opacity-50"
            >
              {updating ? 'Saving Status...' : 'Save & Record Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
