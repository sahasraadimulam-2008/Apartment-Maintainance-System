import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementService } from '../services/announcementService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  Bell,
  PlusCircle,
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [audienceFilter, setAudienceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'All',
    priority: 'Normal',
    expiryDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = { activeOnly: 'false', limit: 50 };
      if (audienceFilter) params.targetAudience = audienceFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await announcementService.getAnnouncements(params);
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [audienceFilter, priorityFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSubmitting(true);
      await announcementService.createAnnouncement({
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetAudience: formData.targetAudience,
        priority: formData.priority,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined
      });
      setCreateModalOpen(false);
      setFormData({
        title: '',
        message: '',
        targetAudience: 'All',
        priority: 'Normal',
        expiryDate: ''
      });
      fetchAnnouncements();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Are you sure you want to remove announcement "${notice.title}"?`)) {
      return;
    }
    try {
      await announcementService.deleteAnnouncement(notice._id);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete announcement.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Community Broadcasts
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Society Notices & Announcements
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Official community advisories, scheduled maintenance disruptions, and society updates.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setErrorMessage('');
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Audiences</option>
            <option value="All">Community Wide (All)</option>
            <option value="Residents">Residents Only</option>
            <option value="Staff">Staff Only</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Alert Priorities</option>
            <option value="Urgent">Urgent Advisories</option>
            <option value="Normal">Normal Updates</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <span className="text-xs text-navy-800/60 font-medium">
          Showing {announcements.length} active announcements
        </span>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <LoadingSpinner message="Loading community notice board..." />
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((notice) => {
            const isUrgent = notice.priority === 'Urgent';
            return (
              <div
                key={notice._id}
                className={`rounded-2xl p-6 border shadow-subtle transition ${
                  isUrgent
                    ? 'bg-rose-50/40 border-rose-200/90'
                    : 'bg-white border-ivory-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Urgent Advisory
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-ivory-200 text-navy-850">
                        Target: {notice.targetAudience}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-navy-900 pt-1">
                      {notice.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-navy-800/60 shrink-0">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-teal-accent" />
                      {new Date(notice.publicationDate).toLocaleDateString()}
                    </span>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(notice)}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded transition"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-navy-800/80 leading-relaxed font-light whitespace-pre-wrap">
                  {notice.message}
                </p>

                <div className="mt-4 pt-3 border-t border-ivory-200/80 flex items-center justify-between text-[11px] text-navy-800/50">
                  <span>Posted by: {notice.creator?.name || 'Society Management'}</span>
                  {notice.expiryDate && (
                    <span>Valid until: {new Date(notice.expiryDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Community Broadcasts"
          description="There are currently no active announcements on the society board."
          actionText={user?.role === 'admin' ? 'Publish First Notice' : null}
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* Publish Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Broadcast Community Announcement"
        subtitle="Publish a verified society notice to residents or maintenance staff"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Scheduled Water Tank Cleaning"
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="All">All (Community-Wide)</option>
                <option value="Residents">Residents Only</option>
                <option value="Staff">Staff Only</option>
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
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent Advisory</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Announcement Message *
            </label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter full announcement details, schedules, instructions..."
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-ivory-200">
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
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
