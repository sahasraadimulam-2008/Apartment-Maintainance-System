import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { staffService } from '../services/staffService';
import { flatService } from '../services/flatService';
import { aiService } from '../services/aiService';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Sparkles,
  Wrench,
  User,
  Home,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [flatsList, setFlatsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // New Complaint Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    flatId: '',
    category: '',
    priority: '',
    useAiClassification: true
  });
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status & Staff update state inside detail modal
  const [updateStatusVal, setUpdateStatusVal] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [assignStaffVal, setAssignStaffVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await complaintService.getComplaints(params);
      if (res.success && Array.isArray(res.data)) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, priorityFilter]);

  // Load staff and flats for Admin dropdowns
  useEffect(() => {
    if (user?.role === 'admin') {
      staffService.getStaff({ limit: 100 }).then((res) => {
        if (res.success) setStaffList(res.data || []);
      });
      flatService.getFlats({ limit: 100 }).then((res) => {
        if (res.success) setFlatsList(res.data || []);
      });
    } else if (user?.role === 'resident' && user.flat) {
      // Pre-set user flat in form
      setFormData((prev) => ({
        ...prev,
        flatId: typeof user.flat === 'object' ? user.flat._id : user.flat
      }));
    }
  }, [user]);

  // Handle live AI pre-classification test
  const handleAiPreClassify = async () => {
    if (!formData.description.trim()) {
      setFormError('Please enter a description first to test AI categorization.');
      return;
    }

    try {
      setAiClassifying(true);
      setFormError('');
      const res = await aiService.classifyComplaint({
        title: formData.title,
        description: formData.description,
        allowFallback: true
      });

      if (res.success && res.data) {
        setAiPreview(res.data);
        // Pre-fill category and priority
        setFormData((prev) => ({
          ...prev,
          category: res.data.category || prev.category,
          priority: res.data.priority || prev.priority
        }));
      }
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'AI classification failed');
    } finally {
      setAiClassifying(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        flatId: formData.flatId || (typeof user.flat === 'object' ? user.flat._id : user.flat),
        category: formData.category || undefined,
        priority: formData.priority || undefined,
        useAiClassification: formData.useAiClassification
      };

      await complaintService.createComplaint(payload);
      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        flatId: typeof user.flat === 'object' ? user.flat._id : user.flat || '',
        category: '',
        priority: '',
        useAiClassification: true
      });
      setAiPreview(null);
      fetchComplaints();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatusVal(complaint.status);
    setAssignStaffVal(complaint.assignedStaff?._id || '');
    setUpdateNote('');
    setActionMsg({ type: '', text: '' });
    setDetailModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      const res = await complaintService.updateStatus(selectedComplaint._id, updateStatusVal, updateNote);
      if (res.success) {
        setSelectedComplaint(res.data);
        setActionMsg({ type: 'success', text: `Status changed to ${updateStatusVal}` });
        fetchComplaints();
      }
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Status update failed'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedComplaint || !assignStaffVal) return;
    try {
      setActionLoading(true);
      const res = await complaintService.assignStaff(selectedComplaint._id, assignStaffVal, 'Assigned by admin');
      if (res.success) {
        setSelectedComplaint(res.data);
        setActionMsg({ type: 'success', text: 'Technician assigned successfully' });
        fetchComplaints();
      }
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Staff assignment failed'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter complaints in memory by search query
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.flat?.flatNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Maintenance Operations
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Service Complaints & Work Orders
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Track, prioritize, and resolve residential maintenance tickets.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setFormError('');
              setAiPreview(null);
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-teal-accent hover:bg-teal-light text-white text-xs sm:text-sm font-semibold rounded-xl shadow-glow-teal transition"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            File Maintenance Request
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-800/40">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title, keyword, or flat..."
            className="block w-full pl-9 pr-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs sm:text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="HVAC">HVAC</option>
            <option value="Security">Security</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Civil/Structural">Civil/Structural</option>
            <option value="General">General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(statusFilter || categoryFilter || priorityFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
                setPriorityFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Complaints List / Table */}
      {loading ? (
        <LoadingSpinner message="Querying maintenance tickets..." />
      ) : filteredComplaints.length > 0 ? (
        <div className="bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/70 text-navy-800/70 uppercase tracking-wider font-semibold border-b border-ivory-200">
                <tr>
                  <th className="py-3.5 px-6">Ticket Title & Problem</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned Technician</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 text-navy-900">
                {filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-ivory-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-navy-900">{c.title}</span>
                        {c.aiSuggestions && (
                          <span className="p-1 bg-teal-accent/15 text-teal-accent rounded" title="AI Assessed">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy-800/60 line-clamp-1 mt-0.5 max-w-sm">{c.description}</p>
                    </td>

                    <td className="py-4 px-6 font-medium text-navy-800">
                      {c.flat ? `${c.flat.building} - Unit ${c.flat.flatNumber}` : 'General Facility'}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-ivory-200 font-medium text-navy-850">
                        {c.category}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-4 px-6 text-navy-800">
                      {c.assignedStaff ? (
                        <div className="flex items-center space-x-1.5">
                          <Wrench className="w-3.5 h-3.5 text-teal-accent" />
                          <span className="font-medium">{c.assignedStaff.name}</span>
                        </div>
                      ) : (
                        <span className="text-navy-800/40 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-accent hover:bg-teal-50 border border-teal-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Maintenance Complaints Found"
          description="No complaints match the active filters or search keyword."
          actionText="Submit New Request"
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="File Residential Maintenance Ticket"
        subtitle="Submit your issue for technician dispatch and automated AI assessment"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Complaint Headline / Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Water leak under bathroom sink"
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                Problem Description *
              </label>
              <button
                type="button"
                onClick={handleAiPreClassify}
                disabled={aiClassifying}
                className="text-xs text-teal-accent hover:text-teal-light font-semibold flex items-center transition"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {aiClassifying ? 'Analyzing...' : 'AI Auto-Classify'}
              </button>
            </div>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue in detail, including exact symptoms, location, and urgency..."
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          {/* AI Preview Result Card */}
          {aiPreview && (
            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-teal-900 font-bold">
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-accent" />
                  AI Suggested Categorization:
                </span>
                <span className="text-[10px] text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded">
                  {aiPreview.provider || 'AI Engine'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-teal-950 font-medium">
                <div>Category: <strong>{aiPreview.category}</strong></div>
                <div>Urgency: <strong>{aiPreview.priority}</strong></div>
              </div>
              {aiPreview.suggestedAction && (
                <p className="text-[11px] text-teal-900/80 bg-white/70 p-2 rounded">
                  Suggested Action: {aiPreview.suggestedAction}
                </p>
              )}
            </div>
          )}

          {/* Admin Flat Selector if admin */}
          {user?.role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Affected Flat Unit
              </label>
              <select
                value={formData.flatId}
                onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Select Flat...</option>
                {flatsList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.building} - Unit {f.flatNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Category & Priority Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Auto (AI Recommended)</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="HVAC">HVAC</option>
                <option value="Security">Security</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Civil/Structural">Civil/Structural</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Auto (AI Assessed)</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-ivory-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting Ticket...' : 'Register Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Details & Action Drawer Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={selectedComplaint.title}
          subtitle={`Ticket ID: ${selectedComplaint._id}`}
        >
          <div className="space-y-6 text-xs text-navy-900">
            {actionMsg.text && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  actionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-ivory-50 rounded-xl border border-ivory-200">
              <div className="flex items-center space-x-2">
                <StatusBadge status={selectedComplaint.status} />
                <PriorityBadge priority={selectedComplaint.priority} />
                <span className="font-semibold text-navy-800 bg-white px-2 py-0.5 rounded border border-ivory-300">
                  {selectedComplaint.category}
                </span>
              </div>
              <span className="text-navy-800/60">
                Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-navy-800/60 mb-1">
                Resident Problem Description
              </h4>
              <p className="bg-white p-3.5 rounded-xl border border-ivory-200 leading-relaxed text-navy-900">
                {selectedComplaint.description}
              </p>
            </div>

            {/* AI Diagnostics Box */}
            {selectedComplaint.aiSuggestions?.suggestedAction && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between text-teal-900 font-bold">
                  <span className="flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-accent" />
                    AI Maintenance Diagnostic
                  </span>
                  <span className="text-[10px] text-teal-700 bg-teal-200/50 px-2 py-0.5 rounded">
                    Confidence: {Math.round((selectedComplaint.aiSuggestions.confidenceScore || 0.9) * 100)}%
                  </span>
                </div>
                <p className="text-teal-950 leading-relaxed">
                  {selectedComplaint.aiSuggestions.suggestedAction}
                </p>
              </div>
            )}

            {/* Location & Resident */}
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-ivory-50 rounded-xl border border-ivory-200">
              <div>
                <p className="text-[10px] font-bold text-navy-800/60 uppercase">Apartment Location</p>
                <p className="font-semibold text-navy-900 mt-0.5">
                  {selectedComplaint.flat ? `${selectedComplaint.flat.building} - Unit ${selectedComplaint.flat.flatNumber}` : 'General Facility'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-navy-800/60 uppercase">Resident Name</p>
                <p className="font-semibold text-navy-900 mt-0.5">
                  {selectedComplaint.resident?.name || 'Resident'}
                </p>
              </div>
            </div>

            {/* Lifecycle Status History Audit Trail */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-navy-800/60 mb-2">
                Lifecycle Audit Trail
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedComplaint.statusHistory?.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-[11px] flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-navy-900">{h.status}</span>
                      {h.note && <p className="text-navy-800/70 mt-0.5">{h.note}</p>}
                    </div>
                    <span className="text-navy-800/50 text-[10px] shrink-0">
                      {new Date(h.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin/Staff Controls */}
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <div className="pt-4 border-t border-ivory-200 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-navy-800/60">
                  Supervisor Controls
                </h4>

                {/* Status Update */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <select
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value)}
                    className="px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-xs"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <input
                    type="text"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Audit note..."
                    className="px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-xs"
                  />

                  <button
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition"
                  >
                    Update Status
                  </button>
                </div>

                {/* Staff Assignment (Admin Only) */}
                {user?.role === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center pt-2">
                    <select
                      value={assignStaffVal}
                      onChange={(e) => setAssignStaffVal(e.target.value)}
                      className="px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-xs"
                    >
                      <option value="">Assign Technician...</option>
                      {staffList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.jobRole})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssignStaff}
                      disabled={actionLoading || !assignStaffVal}
                      className="px-3 py-2 bg-teal-accent text-white font-semibold rounded-lg hover:bg-teal-light transition disabled:opacity-50"
                    >
                      Assign Technician
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
