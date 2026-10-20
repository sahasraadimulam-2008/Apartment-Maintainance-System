import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { residentService } from '../services/residentService';
import { flatService } from '../services/flatService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  Users,
  Search,
  Mail,
  Phone,
  Home,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function ResidentsPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState([]);
  const [flatsList, setFlatsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlatFilter, setSelectedFlatFilter] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    flatId: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (searchQuery) params.search = searchQuery;
      if (selectedFlatFilter) params.flatId = selectedFlatFilter;

      const res = await residentService.getResidents(params);
      if (res.success && Array.isArray(res.data)) {
        setResidents(res.data);
      }
    } catch (err) {
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [selectedFlatFilter]);

  useEffect(() => {
    flatService.getFlats({ limit: 100 }).then((res) => {
      if (res.success) setFlatsList(res.data || []);
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResidents();
  };

  const handleOpenEdit = (resident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      phone: resident.phone || '',
      flatId: resident.flat?._id || resident.flat || '',
      isActive: resident.isActive !== false
    });
    setErrorMessage('');
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingResident) return;
    setErrorMessage('');
    try {
      setSubmitting(true);
      await residentService.updateResident(editingResident._id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        flatId: formData.flatId || undefined,
        isActive: formData.isActive
      });
      setEditModalOpen(false);
      fetchResidents();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to update resident profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
          Residential Roster
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
          Resident Community Directory
        </h1>
        <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
          View registered residents, verified contact numbers, and associated apartment residences.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-800/40">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents by name, email, or phone..."
            className="block w-full pl-9 pr-20 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs sm:text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-navy-900 text-white rounded text-xs font-semibold hover:bg-navy-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={selectedFlatFilter}
            onChange={(e) => setSelectedFlatFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Apartment Flats</option>
            {flatsList.map((f) => (
              <option key={f._id} value={f._id}>
                {f.building} - Unit {f.flatNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Residents Table */}
      {loading ? (
        <LoadingSpinner message="Loading resident directory..." />
      ) : residents.length > 0 ? (
        <div className="bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/70 text-navy-800/70 uppercase tracking-wider font-semibold border-b border-ivory-200">
                <tr>
                  <th className="py-3.5 px-6">Resident Details</th>
                  <th className="py-3.5 px-6">Contact Coordinates</th>
                  <th className="py-3.5 px-6">Assigned Apartment</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  {user?.role === 'admin' && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 text-navy-900">
                {residents.map((r) => (
                  <tr key={r._id} className="hover:bg-ivory-50/70 transition">
                    <td className="py-4 px-6 font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-teal-accent/15 border border-teal-light/30 flex items-center justify-center text-teal-accent font-bold">
                          {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-navy-900">{r.name}</p>
                          <p className="text-[11px] text-navy-800/60 flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" />
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-navy-800">
                      {r.phone ? (
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-navy-800/60" />
                          <span>{r.phone}</span>
                        </div>
                      ) : (
                        <span className="text-navy-800/40 italic">No phone recorded</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {r.flat ? (
                        <div className="flex items-center space-x-1.5 text-navy-900 font-medium">
                          <Home className="w-3.5 h-3.5 text-teal-accent" />
                          <span>
                            {typeof r.flat === 'object'
                              ? `${r.flat.building} - Unit ${r.flat.flatNumber}`
                              : 'Assigned Unit'}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {r.isActive !== false ? (
                        <span className="inline-flex items-center text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3 h-3 mr-1" /> Deactivated
                        </span>
                      )}
                    </td>

                    {user?.role === 'admin' && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-teal-accent hover:bg-teal-50 border border-teal-200 transition"
                          title="Edit Resident"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Residents Found"
          description="No resident accounts match the specified criteria."
        />
      )}

      {/* Edit Resident Modal */}
      {editingResident && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Resident: ${editingResident.name}`}
          subtitle="Update resident contact details and flat association"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Assign Apartment Unit
              </label>
              <select
                value={formData.flatId}
                onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">No flat assigned (Unassigned)</option>
                {flatsList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.building} - Unit {f.flatNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-teal-accent rounded border-ivory-300 focus:ring-teal-accent"
              />
              <label htmlFor="isActive" className="text-xs font-medium text-navy-900">
                Account Active & Allowed Portal Access
              </label>
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
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
