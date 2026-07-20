import api from './axios';

export const getNotifications = () => api.get('/notifications').then((r) => r.data);
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllAsRead = () => api.patch('/notifications/read-all').then((r) => r.data);
