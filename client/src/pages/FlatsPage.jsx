import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { flatService } from '../services/flatService';
import { residentService } from '../services/residentService';
import { StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  Home,
  PlusCircle,
  Search,
  UserPlus,
  Trash2,
  Users,
  Building,
  Layers,
  Square,
  AlertCircle
} from 'lucide-react';

export default function FlatsPage() {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [residentsList, setResidentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [buildingFilter, setBuildingFilter] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    flatNumber: '',
    building: '',
    floor: 1,
    bhkType: '2BHK',
    squareFootage: 1100
  });
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchFlats = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (buildingFilter) params.building = buildingFilter;
      if (occupancyFilter) params.occupancyStatus = occupancyFilter;

      const res = await flatService.getFlats(params);
      if (res.success && Array.isArray(res.data)) {
        setFlats(res.data);
      }
    } catch (err) {
      console.error('Error fetching flats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, [buildingFilter, occupancyFilter]);

  // Load residents list for assignment modal
  useEffect(() => {
    if (user?.role === 'admin') {
      residentService.getResidents({ limit: 100 }).then((res) => {
        if (res.success) setResidentsList(res.data || []);
      });
    }
  }, [user]);

  const handleCreateFlat = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSubmitting(true);
      await flatService.createFlat({
        flatNumber: formData.flatNumber.trim(),
        building: formData.building.trim(),
        floor: Number(formData.floor),
        bhkType: formData.bhkType,
        squareFootage: Number(formData.squareFootage)
      });
      setCreateModalOpen(false);
      setFormData({
        flatNumber: '',
        building: '',
        floor: 1,
        bhkType: '2BHK',
        squareFootage: 1100
      });
      fetchFlats();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to create flat.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignResident = async (e) => {
    e.preventDefault();
    if (!selectedFlat || !selectedResidentId) return;
    setErrorMessage('');
    try {
      setSubmitting(true);
      await flatService.assignResident(selectedFlat._id, selectedResidentId);
      setAssignModalOpen(false);
      setSelectedResidentId('');
      fetchFlats();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to assign resident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlat = async (flat) => {
    if (!window.confirm(`Are you sure you want to remove flat ${flat.building}-${flat.flatNumber}?`)) {
      return;
    }
    try {
      await flatService.deleteFlat(flat._id);
      fetchFlats();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete flat');
    }
  };

  const filteredFlats = flats.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.flatNumber?.toLowerCase().includes(q) ||
      f.building?.toLowerCase().includes(q) ||
      f.bhkType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Estate Directory
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Apartment Unit Management
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Browse building inventory, occupancy status, and map residents to their residences.
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
            Add Apartment Unit
          </button>
        )}
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
            placeholder="Search by flat number or block..."
            className="block w-full pl-9 pr-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs sm:text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Occupancies</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>

          <input
            type="text"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            placeholder="Filter by Building..."
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          />

          {(occupancyFilter || buildingFilter || searchQuery) && (
            <button
              onClick={() => {
                setOccupancyFilter('');
                setBuildingFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Flats Grid */}
      {loading ? (
        <LoadingSpinner message="Querying apartment unit records..." />
      ) : filteredFlats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlats.map((flat) => (
            <div
              key={flat._id}
              className="bg-white rounded-2xl border border-ivory-300 shadow-subtle p-6 flex flex-col justify-between card-hover space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-accent">
                      {flat.building}
                    </span>
                    <h3 className="font-display font-bold text-xl text-navy-900">
                      Unit {flat.flatNumber}
                    </h3>
                  </div>
                  <StatusBadge status={flat.occupancyStatus} />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-navy-800">
                  <div className="flex items-center space-x-1.5 bg-ivory-50 p-2 rounded-lg border border-ivory-200">
                    <Layers className="w-3.5 h-3.5 text-navy-800/60" />
                    <span>Floor {flat.floor}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-ivory-50 p-2 rounded-lg border border-ivory-200">
                    <Home className="w-3.5 h-3.5 text-navy-800/60" />
                    <span>{flat.bhkType || '2BHK'}</span>
                  </div>
                </div>

                {flat.squareFootage > 0 && (
                  <div className="flex items-center space-x-1.5 text-xs text-navy-800/60 mt-2">
                    <Square className="w-3.5 h-3.5" />
                    <span>{flat.squareFootage} sq. ft.</span>
                  </div>
                )}

                {/* Associated Residents */}
                <div className="mt-4 pt-4 border-t border-ivory-200">
                  <p className="text-[11px] font-semibold text-navy-800/60 uppercase tracking-wider mb-1.5 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Residents ({flat.residents?.length || 0})
                  </p>
                  {flat.residents && flat.residents.length > 0 ? (
                    <div className="space-y-1">
                      {flat.residents.map((r) => (
                        <span
                          key={r._id || r}
                          className="inline-block text-xs bg-teal-50 text-teal-800 font-medium px-2 py-0.5 rounded border border-teal-200 mr-1.5"
                        >
                          {r.name || 'Resident'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-navy-800/40 italic">No residents assigned</p>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {user?.role === 'admin' && (
                <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
                  <button
                    onClick={() => {
                      setSelectedFlat(flat);
                      setSelectedResidentId('');
                      setErrorMessage('');
                      setAssignModalOpen(true);
                    }}
                    className="inline-flex items-center text-xs font-semibold text-teal-accent hover:text-teal-light"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Assign Resident
                  </button>

                  <button
                    onClick={() => handleDeleteFlat(flat)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete flat"
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
          title="No Apartment Flats Found"
          description="No flats match the current filter criteria."
          actionText={user?.role === 'admin' ? 'Add Flat Unit' : null}
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* Add Flat Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Apartment Unit"
        subtitle="Create an apartment record inside a building block"
      >
        <form onSubmit={handleCreateFlat} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Building / Block Name *
              </label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="e.g. Tower A or Block 1"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Flat / Unit Number *
              </label>
              <input
                type="text"
                required
                value={formData.flatNumber}
                onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                placeholder="e.g. 101 or A-101"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Floor *
              </label>
              <input
                type="number"
                required
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                BHK Type
              </label>
              <select
                value={formData.bhkType}
                onChange={(e) => setFormData({ ...formData, bhkType: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Sq. Footage
              </label>
              <input
                type="number"
                value={formData.squareFootage}
                onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
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
              {submitting ? 'Creating Unit...' : 'Add Flat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Resident Modal */}
      {selectedFlat && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title={`Assign Resident to Flat ${selectedFlat.building}-${selectedFlat.flatNumber}`}
          subtitle="Map an active resident user to this physical apartment unit"
        >
          <form onSubmit={handleAssignResident} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Select Resident User *
              </label>
              <select
                required
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Select a registered resident...</option>
                {residentsList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.email}) {r.flat ? '— [Already assigned]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedResidentId}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-accent hover:bg-teal-light rounded-xl shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Mapping Resident...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
