import api from './api';

export const staffService = {
  // Get all staff members
  getStaff: async (params = {}) => {
    const response = await api.get('/staff', { params });
    return response.data;
  },

  // Get staff member by ID
  getStaffById: async (id) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },

  // Create staff member (Admin)
  createStaff: async (staffData) => {
    const response = await api.post('/staff', staffData);
    return response.data;
  },

  // Update staff member (Admin)
  updateStaff: async (id, staffData) => {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
  },

  // Delete staff member (Admin)
  deleteStaff: async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  }
};
