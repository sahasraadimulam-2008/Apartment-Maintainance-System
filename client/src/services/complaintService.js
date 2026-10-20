import api from './api';

export const complaintService = {
  // Fetch complaints with filters
  getComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  // Fetch single complaint details
  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Create new complaint
  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  // Update complaint status (Admin / Staff)
  updateStatus: async (id, status, note = '') => {
    const response = await api.patch(`/complaints/${id}/status`, { status, note });
    return response.data;
  },

  // Assign staff to complaint (Admin)
  assignStaff: async (id, staffId, note = '') => {
    const response = await api.patch(`/complaints/${id}/assign`, { staffId, note });
    return response.data;
  },

  // Trigger AI classification on existing complaint
  classifyWithAi: async (id, options = { allowFallback: true, updateFields: false }) => {
    const response = await api.post(`/complaints/${id}/ai-classify`, options);
    return response.data;
  }
};
