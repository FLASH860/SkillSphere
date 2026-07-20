import api from './axios';

export const createGig = (data) => api.post('/gigs', data).then((r) => r.data);
export const getGigs = (params) => api.get('/gigs', { params }).then((r) => r.data);
export const getMyGigs = () => api.get('/gigs/mine').then((r) => r.data);
export const getGigById = (id) => api.get(`/gigs/${id}`).then((r) => r.data);

export const getAssignedGigs = () => api.get('/gigs/assigned').then((r) => r.data);

export const updateGig = (id, data) => api.patch(`/gigs/${id}`, data).then((r) => r.data);

