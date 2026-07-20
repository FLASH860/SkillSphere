import api from './axios';

export const setup2FA = () => api.get('/auth/2fa/setup').then((r) => r.data);
export const enable2FA = (code) => api.post('/auth/2fa/enable', { code }).then((r) => r.data);
export const disable2FA = () => api.post('/auth/2fa/disable').then((r) => r.data);
