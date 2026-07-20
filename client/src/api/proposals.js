import api from './axios';

export const createProposal = (data) => api.post('/proposals', data).then((r) => r.data);
export const getMyProposals = () => api.get('/proposals/mine').then((r) => r.data);
export const getProposalsForGig = (gigId) => api.get(`/proposals/gig/${gigId}`).then((r) => r.data);
export const updateProposalStatus = (id, status) =>
  api.put(`/proposals/${id}/status`, { status }).then((r) => r.data);
export const counterProposal = (id, data) =>
  api.post(`/proposals/${id}/counter`, data).then((r) => r.data);
export const respondToOffer = (id, data) =>
  api.post(`/proposals/${id}/respond`, data).then((r) => r.data);
