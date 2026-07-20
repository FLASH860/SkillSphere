import api from './axios';

export const getClientStats = () => api.get('/stats/client').then((r) => r.data);
export const getFreelancerStats = () => api.get('/stats/freelancer').then((r) => r.data);
