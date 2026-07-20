import api from './axios';

export const createDispute = (data) => api.post('/disputes', data).then((r) => r.data);
export const getMyDisputes = () => api.get('/disputes/mine').then((r) => r.data);
export const getAllDisputes = () => api.get('/disputes').then((r) => r.data);
export const updateDisputeStatus = (id, data) => api.patch(`/disputes/${id}`, data).then((r) => r.data);
