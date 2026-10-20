import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { staffService } from '../services/staffService';
import { StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  Wrench,
  PlusCircle,
  Search,
  Phone,
  Mail,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Key
} from 'lucide-react';

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    jobRole: 'Plumber',
    email: '',
    phone: '',
    availabilityStatus: 'Available'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (roleFilter) params.jobRole = roleFilter;
      if (availabilityFilter) params.availabilityStatus = availabilityFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await staffService.getStaff(params);
      if (res.success && Array.isArray(res.data)) {
        setStaff(res.data);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, availabilityFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSubmitting(true);
      await staffService.createStaff({
        name: formData.name.trim(),
        jobRole: formData.jobRole,
        contactDetails: {
          email: formData.email.trim(),
          phone: formData.phone.trim()
        },
        availabilityStatus: formData.availabilityStatus
      });
      setCreateModalOpen(false);
      setFormData({
        name: '',
        jobRole: 'Plumber',
        email: '',
        phone: '',
        availabilityStatus: 'Available'
      });
      fetchStaff();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to create staff technician.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (member) => {
    setSelectedStaff(member);
    setFormData({
      name: member.name,
      jobRole: member.jobRole,
      email: member.contactDetails?.email || '',
      phone: member.contactDetails?.phone || '',
      availabilityStatus: member.availabilityStatus || 'Available'
    });
    setErrorMessage('');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setErrorMessage('');
    try {
      setSubmitting(true);
      await staffService.updateStaff(selectedStaff._id, {
        name: formData.name.trim(),
        jobRole: formData.jobRole,
        contactDetails: {
          email: formData.email.trim(),
          phone: formData.phone.trim()
        },
        availabilityStatus: formData.availabilityStatus
      });
      setEditModalOpen(false);
      fetchStaff();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to update staff record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Are you sure you want to remove staff technician ${member.name}?`)) {
      return;
    }
    try {
      await staffService.deleteStaff(member._id);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete staff member.');
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.jobRole?.toLowerCase().includes(q) ||
      s.contactDetails?.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Human Resources & Dispatch
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Facility Maintenance Staff
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Manage trade specializations, availability states, and contact directories for technicians.
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
            Add Staff Member
          </button>
        )}
      </div>

      {/* Administrator Staff Onboarding Code Banner */}
      {user?.role === 'admin' && (
        <div className="bg-ivory-100/90 rounded-2xl border border-ivory-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-subtle">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <Key className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-navy-900">Technician Onboarding Authorization Code</p>
              <p className="text-navy-700/80 mt-0.5">
                New maintenance personnel can onboard themselves on the registration portal using this secure administrator authorization code.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-ivory-300 self-start sm:self-center shrink-0">
            <span className="text-navy-900 font-mono font-bold tracking-wider">NESTORA-STAFF-2026</span>
            <span className="text-[10px] text-teal-accent font-semibold uppercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              Active Key
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-800/40">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or specialization..."
            className="block w-full pl-9 pr-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs sm:text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Trade Specializations</option>
            <option value="Plumber">Plumber</option>
            <option value="Electrician">Electrician</option>
            <option value="Carpenter">Carpenter</option>
            <option value="HVAC Technician">HVAC Technician</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Security Guard">Security Guard</option>
            <option value="Maintenance Supervisor">Maintenance Supervisor</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Availabilities</option>
            <option value="Available">Available</option>
            <option value="On Duty">On Duty</option>
            <option value="On Leave">On Leave</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          {(roleFilter || availabilityFilter || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('');
                setAvailabilityFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <LoadingSpinner message="Loading technician roster..." />
      ) : filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-2xl border border-ivory-300 shadow-subtle p-6 flex flex-col justify-between space-y-4 card-hover"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-accent/15 border border-teal-light/30 flex items-center justify-center text-teal-accent font-bold">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-navy-900">
                        {member.name}
                      </h3>
                      <span className="text-xs font-semibold text-teal-accent">
                        {member.jobRole}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={member.availabilityStatus} />
                </div>

                <div className="space-y-1.5 mt-5 text-xs text-navy-800 bg-ivory-50 p-3 rounded-xl border border-ivory-200">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-navy-800/60" />
                    <span className="font-medium">{member.contactDetails?.phone || 'No phone'}</span>
                  </div>
                  {member.contactDetails?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-navy-800/60" />
                      <span className="truncate">{member.contactDetails.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-navy-800/70 mt-4 pt-3 border-t border-ivory-200">
                  <span>Assigned Work Tickets:</span>
                  <span className="font-bold text-navy-900 bg-ivory-100 px-2 py-0.5 rounded">
                    {member.assignedComplaints?.length || 0}
                  </span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-ivory-200">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 rounded-lg text-teal-accent hover:bg-teal-50 border border-teal-200 transition"
                    title="Edit Staff Member"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Staff Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Staff Technicians Found"
          description="No staff members match the selected trade specialization or availability."
          actionText={user?.role === 'admin' ? 'Add Staff Member' : null}
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Facility Maintenance Technician"
        subtitle="Register a technician profile for task assignments"
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
              Staff Member Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Marcus Vance"
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Trade Role *
              </label>
              <select
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="Plumber">Plumber</option>
                <option value="Electrician">Electrician</option>
                <option value="Carpenter">Carpenter</option>
                <option value="HVAC Technician">HVAC Technician</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Security Guard">Security Guard</option>
                <option value="Maintenance Supervisor">Maintenance Supervisor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Availability Status
              </label>
              <select
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="Available">Available</option>
                <option value="On Duty">On Duty</option>
                <option value="On Leave">On Leave</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0182"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tech@apartment.com"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>
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
              {submitting ? 'Registering...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      {selectedStaff && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Staff: ${selectedStaff.name}`}
          subtitle="Modify technician availability and contact details"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Staff Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Trade Specialization
                </label>
                <select
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                >
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="HVAC Technician">HVAC Technician</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Maintenance Supervisor">Maintenance Supervisor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Availability
                </label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                >
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Technician'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
