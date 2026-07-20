import api from './axios';

export const createCheckoutSession = (gigId, milestoneId) =>
  api.post('/payments/create-checkout-session', { gigId, milestoneId }).then((r) => r.data);

export const confirmPayment = (sessionId, gigId, milestoneId) =>
  api.post('/payments/confirm', { sessionId, gigId, milestoneId }).then((r) => r.data);

export const releaseMilestone = (gigId, milestoneId) =>
  api.post('/payments/release', { gigId, milestoneId }).then((r) => r.data);

export const getPaymentsForGig = (gigId) =>
  api.get(`/payments/gig/${gigId}`).then((r) => r.data);
