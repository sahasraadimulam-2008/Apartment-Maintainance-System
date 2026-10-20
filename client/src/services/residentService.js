import api from './api';

export const residentService = {
  // Get all residents (Admin / Staff)
  getResidents: async (params = {}) => {
    const response = await api.get('/residents', { params });
    return response.data;
  },

  // Get single resident by ID
  getResidentById: async (id) => {
    const response = await api.get(`/residents/${id}`);
    return response.data;
  },

  // Update resident (Admin)
  updateResident: async (id, updateData) => {
    const response = await api.put(`/residents/${id}`, updateData);
    return response.data;
  }
};
