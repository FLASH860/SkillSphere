import api from './axios';

export const getRecommendedFreelancers = (gigId) =>
  api.get(`/match/gig/${gigId}`).then((r) => r.data);
