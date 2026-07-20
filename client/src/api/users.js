import api from './axios';

export const getProfile = (id) => api.get(`/users/${id}`).then((r) => r.data);
export const updateProfile = (data) => api.put('/users/me', data).then((r) => r.data);
