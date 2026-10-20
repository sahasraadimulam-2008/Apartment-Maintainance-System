import api from './api';

export const flatService = {
  // Get all flats (with pagination and building/occupancy filters)
  getFlats: async (params = {}) => {
    const response = await api.get('/flats', { params });
    return response.data;
  },

  // Get flat by ID
  getFlatById: async (id) => {
    const response = await api.get(`/flats/${id}`);
    return response.data;
  },

  // Create flat (Admin)
  createFlat: async (flatData) => {
    const response = await api.post('/flats', flatData);
    return response.data;
  },

  // Update flat (Admin)
  updateFlat: async (id, flatData) => {
    const response = await api.put(`/flats/${id}`, flatData);
    return response.data;
  },

  // Delete flat (Admin)
  deleteFlat: async (id) => {
    const response = await api.delete(`/flats/${id}`);
    return response.data;
  },

  // Assign resident to flat (Admin)
  assignResident: async (id, residentId) => {
    const response = await api.post(`/flats/${id}/assign-resident`, { residentId });
    return response.data;
  }
};
