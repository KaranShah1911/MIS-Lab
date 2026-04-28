import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// ─── HIS APIs ──────────────────────────────────────────────
export const patientsApi = {
  getAll: (search) => api.get('/patients', { params: { search } }),
  getOne: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
};

export const doctorsApi = {
  getAll: () => api.get('/doctors'),
  getDepartments: () => api.get('/doctors/departments'),
};

export const opdApi = {
  getAll: () => api.get('/opd'),
  book: (data) => api.post('/opd', data),
  updateStatus: (id, status) => api.patch(`/opd/${id}`, { status }),
};

export const ipdApi = {
  getAll: () => api.get('/ipd'),
  getBeds: () => api.get('/ipd/beds'),
  admit: (data) => api.post('/ipd', data),
  discharge: (id) => api.patch(`/ipd/${id}/discharge`),
};

export const billingApi = {
  getAll: () => api.get('/billing'),
  markPaid: (id, payment_method) => api.patch(`/billing/${id}/pay`, { payment_method }),
};

// ─── MIS APIs ──────────────────────────────────────────────
export const misApi = {
  getKpis: (params) => api.get('/mis/kpis', { params }),
  getPatientStats: (params) => api.get('/mis/patient-stats', { params }),
  getDoctorPerformance: (params) => api.get('/mis/doctor-performance', { params }),
  getRevenue: (params) => api.get('/mis/revenue', { params }),
  getPaymentSummary: (params) => api.get('/mis/payment-summary', { params }),
  getOccupancy: (params) => api.get('/mis/occupancy', { params }),
  getPeakHours: (params) => api.get('/mis/peak-hours', { params }),
  getInsights: () => api.get('/mis/insights'),
};

export default api;
