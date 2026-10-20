import api from './api';

export const paymentService = {
  // Get all payments (RBAC: resident sees own, admin/staff sees all)
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  // Get single payment details
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Create maintenance fee record (Admin)
  createPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  // Update payment status / record manual receipt (Admin)
  updatePaymentStatus: async (id, statusData) => {
    const response = await api.patch(`/payments/${id}/status`, statusData);
    return response.data;
  }
};
