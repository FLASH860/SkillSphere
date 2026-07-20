import api from './axios';

export const createReview = (data) => api.post('/reviews', data).then((r) => r.data);
export const getReviewsForUser = (userId) => api.get(`/reviews/user/${userId}`).then((r) => r.data);
export const getReviewsForGig = (gigId) => api.get(`/reviews/gig/${gigId}`).then((r) => r.data);

export const getReviewAnalytics = (userId) => api.get(`/reviews/analytics/${userId}`).then((r) => r.data);

