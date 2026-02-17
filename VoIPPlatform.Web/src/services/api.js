import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5004'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to landing page (login is now a modal)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/Auth/login', credentials),
  register: (userData) => api.post('/Auth/register', userData),
  registerPublic: (userData) => api.post('/Auth/register-public', userData),
  getMe: () => api.get('/Auth/me'),
  changePassword: (passwords) => api.post('/Auth/change-password', passwords),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get('/Dashboard/user-stats'), // User personal stats
  getAdminStats: () => api.get('/Dashboard/stats'), // Admin system stats
  // Phase 5: Multi-Tenant Hierarchy
  getResellerStats: () => api.get('/Dashboard/reseller-stats'), // Reseller aggregated stats
  getCompanyStats: () => api.get('/Dashboard/company-stats'), // Company channel usage
};

// Users API calls
export const usersAPI = {
  getAll: () => api.get('/Users'),
  getById: (id) => api.get(`/Users/${id}`),
  create: (userData) => api.post('/Users', userData),
  update: (id, userData) => api.put(`/Users/${id}`, userData),
  delete: (id) => api.delete(`/Users/${id}`),
};

// Call Records API calls
export const callRecordsAPI = {
  getMyCalls: () => api.get('/CallRecords/my-calls'),
  seedCallRecords: () => api.post('/Auth/seed-call-records'),
  // Phase 5: Channel Management
  startCall: (callData) => api.post('/CallRecords/start-call', callData),
  endCall: (callData) => api.post('/CallRecords/end-call', callData),
  getChannelInfo: () => api.get('/CallRecords/channel-info'),
};

// SMS API calls
export const smsAPI = {
  sendSMS: (data) => api.post('/SMS', data),
  getMyMessages: () => api.get('/SMS/my-messages'),
  getSMSStats: () => api.get('/SMS/stats/summary'),
};

// Rates API calls
export const ratesAPI = {
  assignTariffPlan: (userId, tariffPlanId) => api.post('/Rates/assign-plan', { userId, tariffPlanId }),
  getTariffPlans: () => api.get('/rates/tariff-plans'),
  getConfigure: (planId) => api.get(`/rates/configure?planId=${planId}`),
  createTariffPlan: (payload) => api.post('/rates/tariff-plans', payload),
  uploadBaseRates: (formData) => api.post('/rates/upload-base-rates', formData),
  getMyRates: () => api.get('/rates/my-rates'),
};

// Invoices API calls
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getSummary: () => api.get('/invoices/admin/summary'),
  downloadPdf: (id) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
};

export default api;
