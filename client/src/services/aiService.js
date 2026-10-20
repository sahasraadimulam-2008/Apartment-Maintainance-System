import api from './api';

export const aiService = {
  // Classify a complaint description
  classifyComplaint: async (data) => {
    const response = await api.post('/ai/classify-complaint', data);
    return response.data;
  },

  // Chat with NESTORA Concierge FAQ assistant
  chat: async (message, conversationHistory = []) => {
    const response = await api.post('/ai/chat', {
      message,
      conversationHistory
    });
    return response.data;
  },

  // Check AI service status
  getStatus: async () => {
    const response = await api.get('/ai/status');
    return response.data;
  }
};
